import { pool, query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

export const TIPOS_MOVIMIENTO = Object.freeze({
  ENTRADA_COMPRA: 'ENTRADA_COMPRA',
  SALIDA_VENTA: 'SALIDA_VENTA',
  DEVOLUCION_CLIENTE: 'DEVOLUCION_CLIENTE',
  AJUSTE: 'AJUSTE',
  MERMA: 'MERMA',
  ANULACION_VENTA: 'ANULACION_VENTA',
});

const TIPOS_VALIDOS = new Set(Object.values(TIPOS_MOVIMIENTO));
const REFERENCIAS_VALIDAS = new Set(['VENTA', 'COMPRA', 'DEVOLUCION']);

function validarNumeroDecimal(valor, nombreCampo = 'cantidad') {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    throw new ErrorHttp(400, `El campo ${nombreCampo} debe ser un número válido.`);
  }
  return Number(numero.toFixed(3));
}

export async function registrarMovimientoInventario({
  productoId,
  tipo,
  cantidad = null,
  stockResultanteObjetivo = null,
  usuarioId,
  motivo = null,
  referenciaTipo = null,
  referenciaId = null,
  permitirStockNegativo = false,
  client: clientExterno = null,
  ip = null,
}) {
  if (!productoId) {
    throw new ErrorHttp(400, 'Debe especificar el identificador del producto.');
  }

  if (!tipo || !TIPOS_VALIDOS.has(tipo)) {
    throw new ErrorHttp(
      400,
      `Tipo de movimiento no válido. Tipos permitidos: ${Array.from(TIPOS_VALIDOS).join(', ')}.`,
    );
  }

  if (!usuarioId) {
    throw new ErrorHttp(400, 'Debe indicar el usuario que ejecuta el movimiento.');
  }

  const motivoLimpio = typeof motivo === 'string' ? motivo.trim() : null;
  if (['AJUSTE', 'MERMA'].includes(tipo)) {
    if (!motivoLimpio) {
      throw new ErrorHttp(
        400,
        `El motivo es obligatorio para movimientos de tipo ${tipo}.`,
      );
    }
    if (motivoLimpio.length > 200) {
      throw new ErrorHttp(400, 'El motivo no puede superar los 200 caracteres.');
    }
  }

  if (referenciaTipo && !REFERENCIAS_VALIDAS.has(referenciaTipo)) {
    throw new ErrorHttp(
      400,
      `Tipo de referencia no válido. Tipos permitidos: ${Array.from(REFERENCIAS_VALIDAS).join(', ')}.`,
    );
  }

  const esTransaccionInterna = !clientExterno;
  const client = clientExterno ?? (await pool.connect());

  try {
    if (esTransaccionInterna) {
      await client.query('BEGIN');
    }

    const { rows: productoRows } = await client.query(
      `
        SELECT p.id, p.codigo, p.nombre, p.stock_minimo, p.activo,
               COALESCE(i.cantidad_actual, 0) AS stock_actual
        FROM productos p
        LEFT JOIN inventario i ON i.producto_id = p.id
        WHERE p.id = $1
      `,
      [productoId],
    );

    const producto = productoRows[0];
    if (!producto) {
      throw new ErrorHttp(404, 'El producto especificado no existe.');
    }

    await client.query(
      `
        INSERT INTO inventario (producto_id, cantidad_actual)
        VALUES ($1, 0)
        ON CONFLICT (producto_id) DO NOTHING
      `,
      [productoId],
    );

    const { rows: invRows } = await client.query(
      `
        SELECT cantidad_actual
        FROM inventario
        WHERE producto_id = $1
        FOR UPDATE
      `,
      [productoId],
    );

    const stockAnterior = Number(invRows[0].cantidad_actual);
    let delta = 0;

    if (stockResultanteObjetivo !== null && stockResultanteObjetivo !== undefined) {
      const objetivo = validarNumeroDecimal(stockResultanteObjetivo, 'stockResultanteObjetivo');
      if (objetivo < 0 && !permitirStockNegativo) {
        throw new ErrorHttp(400, 'El stock resultante no puede ser negativo.');
      }
      delta = Number((objetivo - stockAnterior).toFixed(3));
    } else {
      if (cantidad === null || cantidad === undefined) {
        throw new ErrorHttp(400, 'Debe especificar una cantidad o un stock objetivo.');
      }

      const cantValida = validarNumeroDecimal(cantidad, 'cantidad');
      if (cantValida === 0) {
        throw new ErrorHttp(400, 'La cantidad del movimiento no puede ser cero.');
      }

      switch (tipo) {
        case TIPOS_MOVIMIENTO.ENTRADA_COMPRA:
        case TIPOS_MOVIMIENTO.DEVOLUCION_CLIENTE:
        case TIPOS_MOVIMIENTO.ANULACION_VENTA:
          delta = Math.abs(cantValida);
          break;

        case TIPOS_MOVIMIENTO.SALIDA_VENTA:
        case TIPOS_MOVIMIENTO.MERMA:
          delta = -Math.abs(cantValida);
          break;

        case TIPOS_MOVIMIENTO.AJUSTE:
          delta = cantValida;
          break;

        default:
          delta = cantValida;
      }
    }

    if (delta === 0) {
      throw new ErrorHttp(400, 'El ajuste no produce variación en el stock.');
    }

    const stockResultante = Number((stockAnterior + delta).toFixed(3));

    if (stockResultante < 0 && !permitirStockNegativo) {
      throw new ErrorHttp(
        400,
        `Existencias insuficientes para "${producto.nombre}". Stock actual: ${stockAnterior}, requerimiento: ${Math.abs(delta)}.`,
      );
    }

    await client.query(
      `
        UPDATE inventario
        SET cantidad_actual = $1, updated_at = CURRENT_TIMESTAMP
        WHERE producto_id = $2
      `,
      [stockResultante, productoId],
    );

    const { rows: movRows } = await client.query(
      `
        INSERT INTO movimientos_inventario (
          producto_id,
          tipo,
          cantidad,
          stock_resultante,
          referencia_tipo,
          referencia_id,
          motivo,
          usuario_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, producto_id, tipo, cantidad, stock_resultante,
                  referencia_tipo, referencia_id, motivo, usuario_id, created_at
      `,
      [
        productoId,
        tipo,
        delta,
        stockResultante,
        referenciaTipo || null,
        referenciaId || null,
        motivoLimpio || null,
        usuarioId,
      ],
    );

    if (['AJUSTE', 'MERMA'].includes(tipo)) {
      await registrarAuditoria({
        usuarioId,
        accion: `INVENTARIO_${tipo}`,
        entidad: 'inventario',
        entidadId: productoId,
        datosAnteriores: { stock_actual: stockAnterior },
        datosNuevos: {
          delta,
          stock_resultante: stockResultante,
          motivo: motivoLimpio,
        },
        ip,
      });
    }

    if (esTransaccionInterna) {
      await client.query('COMMIT');
    }

    const movimiento = movRows[0];
    return {
      movimiento: {
        id: movimiento.id,
        producto_id: movimiento.producto_id,
        tipo: movimiento.tipo,
        cantidad: Number(movimiento.cantidad),
        stock_resultante: Number(movimiento.stock_resultante),
        referencia_tipo: movimiento.referencia_tipo,
        referencia_id: movimiento.referencia_id,
        motivo: movimiento.motivo,
        usuario_id: movimiento.usuario_id,
        created_at: movimiento.created_at,
      },
      stock_anterior: stockAnterior,
      stock_actual: stockResultante,
      producto: {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
      },
    };
  } catch (error) {
    if (esTransaccionInterna) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (esTransaccionInterna) {
      client.release();
    }
  }
}

export async function listarExistencias({
  busqueda = '',
  categoriaId = null,
  estadoStock = 'TODOS',
  activo = 'ACTIVOS',
  limite = 20,
  pagina = 1,
  rolSolicitante = 'Administrador',
} = {}) {
  const esCajero = rolSolicitante === 'Cajero';
  const condiciones = [];
  const valores = [];
  let posicion = 1;

  if (esCajero || activo === 'ACTIVOS') {
    condiciones.push('p.activo = TRUE');
  } else if (activo === 'INACTIVOS') {
    condiciones.push('p.activo = FALSE');
  }

  if (categoriaId) {
    const numCat = Number(categoriaId);
    if (Number.isInteger(numCat) && numCat > 0) {
      condiciones.push(`p.categoria_id = $${posicion++}`);
      valores.push(numCat);
    }
  }

  const textoBusqueda = String(busqueda ?? '').trim().toLowerCase();
  if (textoBusqueda) {
    condiciones.push(`
      (
        LOWER(p.nombre) ILIKE $${posicion}
        OR LOWER(p.codigo) ILIKE $${posicion}
        OR LOWER(COALESCE(p.codigo_barras, '')) ILIKE $${posicion}
      )
    `);
    valores.push(`%${textoBusqueda}%`);
    posicion++;
  }

  const estadoLimpio = String(estadoStock ?? '').trim().toUpperCase();
  if (estadoLimpio === 'AGOTADO') {
    condiciones.push('COALESCE(i.cantidad_actual, 0) <= 0');
  } else if (estadoLimpio === 'BAJO_STOCK') {
    condiciones.push('COALESCE(i.cantidad_actual, 0) > 0 AND COALESCE(i.cantidad_actual, 0) <= p.stock_minimo');
  } else if (estadoLimpio === 'ALERTA') {
    condiciones.push('COALESCE(i.cantidad_actual, 0) <= p.stock_minimo');
  } else if (estadoLimpio === 'NORMAL') {
    condiciones.push('COALESCE(i.cantidad_actual, 0) > p.stock_minimo');
  }

  const whereClausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consultaConteo = `
    SELECT COUNT(*)::int AS total
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN unidades_medida u ON u.id = p.unidad_id
    LEFT JOIN inventario i ON i.producto_id = p.id
    ${whereClausula}
  `;
  const { rows: rowsConteo } = await query(consultaConteo, valores);
  const totalRegistros = rowsConteo[0]?.total ?? 0;

  const limiteValido = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limiteValido));
  const paginaValida = Math.min(Math.max(1, parseInt(pagina, 10) || 1), totalPaginas);
  const offset = (paginaValida - 1) * limiteValido;

  const consultaDatos = `
    SELECT
      p.id AS producto_id,
      p.codigo,
      p.codigo_barras,
      p.nombre,
      p.imagen_url,
      p.costo,
      p.precio_final,
      p.stock_minimo,
      p.activo,
      c.id AS categoria_id,
      c.nombre AS categoria_nombre,
      c.icono AS categoria_icono,
      u.id AS unidad_id,
      u.nombre AS unidad_nombre,
      u.abreviatura AS unidad_abreviatura,
      u.icono AS unidad_icono,
      COALESCE(i.cantidad_actual, 0) AS stock_actual,
      i.updated_at AS inventario_actualizado_at,
      CASE
        WHEN COALESCE(i.cantidad_actual, 0) <= 0 THEN 'AGOTADO'
        WHEN COALESCE(i.cantidad_actual, 0) <= p.stock_minimo THEN 'BAJO_STOCK'
        ELSE 'NORMAL'
      END AS estado_stock
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN unidades_medida u ON u.id = p.unidad_id
    LEFT JOIN inventario i ON i.producto_id = p.id
    ${whereClausula}
    ORDER BY
      CASE
        WHEN COALESCE(i.cantidad_actual, 0) <= 0 THEN 1
        WHEN COALESCE(i.cantidad_actual, 0) <= p.stock_minimo THEN 2
        ELSE 3
      END ASC,
      LOWER(p.nombre) ASC
    LIMIT $${posicion++} OFFSET $${posicion++}
  `;

  valores.push(limiteValido, offset);
  const { rows: existencias } = await query(consultaDatos, valores);

  const { rows: resumenRows } = await query(`
    SELECT
      COUNT(*)::int AS total_productos,
      COUNT(CASE WHEN COALESCE(i.cantidad_actual, 0) <= 0 THEN 1 END)::int AS agotados,
      COUNT(CASE WHEN COALESCE(i.cantidad_actual, 0) > 0 AND COALESCE(i.cantidad_actual, 0) <= p.stock_minimo THEN 1 END)::int AS bajo_stock,
      COUNT(CASE WHEN COALESCE(i.cantidad_actual, 0) <= p.stock_minimo THEN 1 END)::int AS total_alertas,
      COALESCE(SUM(COALESCE(i.cantidad_actual, 0) * p.costo), 0)::numeric AS valor_inventario_costo,
      COALESCE(SUM(COALESCE(i.cantidad_actual, 0) * p.precio_final), 0)::numeric AS valor_inventario_venta
    FROM productos p
    LEFT JOIN inventario i ON i.producto_id = p.id
    WHERE p.activo = TRUE
  `);

  const resumen = resumenRows[0] || {};

  const resultado = existencias.map((item) => ({
    producto_id: item.producto_id,
    codigo: item.codigo,
    codigo_barras: item.codigo_barras,
    nombre: item.nombre,
    imagen_url: item.imagen_url,
    categoria_id: item.categoria_id,
    categoria_nombre: item.categoria_nombre,
    unidad_id: item.unidad_id,
    unidad_nombre: item.unidad_nombre,
    unidad_abreviatura: item.unidad_abreviatura,
    stock_actual: Number(item.stock_actual),
    stock_minimo: Number(item.stock_minimo),
    estado_stock: item.estado_stock,
    activo: Boolean(item.activo),
    precio_final: Number(item.precio_final),
    costo: esCajero ? null : Number(item.costo),
    valor_total_costo: esCajero ? null : Number((Number(item.stock_actual) * Number(item.costo)).toFixed(2)),
    inventario_actualizado_at: item.inventario_actualizado_at,
  }));

  return {
    existencias: resultado,
    paginacion: {
      total: totalRegistros,
      pagina: paginaValida,
      limite: limiteValido,
      total_paginas: totalPaginas,
    },
    resumen: {
      total_productos: resumen.total_productos || 0,
      agotados: resumen.agotados || 0,
      bajo_stock: resumen.bajo_stock || 0,
      total_alertas: resumen.total_alertas || 0,
      valor_inventario_costo: esCajero ? null : Number(Number(resumen.valor_inventario_costo || 0).toFixed(2)),
      valor_inventario_venta: Number(Number(resumen.valor_inventario_venta || 0).toFixed(2)),
    },
  };
}

export async function listarMovimientos({
  productoId = null,
  tipo = null,
  fechaDesde = null,
  fechaHasta = null,
  busqueda = '',
  limite = 20,
  pagina = 1,
} = {}) {
  const condiciones = [];
  const valores = [];
  let posicion = 1;

  if (productoId) {
    condiciones.push(`m.producto_id = $${posicion++}`);
    valores.push(productoId);
  }

  if (tipo && TIPOS_VALIDOS.has(tipo)) {
    condiciones.push(`m.tipo = $${posicion++}`);
    valores.push(tipo);
  }

  if (fechaDesde) {
    condiciones.push(`m.created_at >= $${posicion++}::timestamp`);
    valores.push(fechaDesde);
  }

  if (fechaHasta) {
    condiciones.push(`m.created_at <= $${posicion++}::timestamp`);
    valores.push(fechaHasta);
  }

  const textoBusqueda = String(busqueda ?? '').trim().toLowerCase();
  if (textoBusqueda) {
    condiciones.push(`
      (
        LOWER(p.nombre) ILIKE $${posicion}
        OR LOWER(p.codigo) ILIKE $${posicion}
        OR LOWER(COALESCE(m.motivo, '')) ILIKE $${posicion}
      )
    `);
    valores.push(`%${textoBusqueda}%`);
    posicion++;
  }

  const whereClausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consultaConteo = `
    SELECT COUNT(*)::int AS total
    FROM movimientos_inventario m
    INNER JOIN productos p ON p.id = m.producto_id
    ${whereClausula}
  `;
  const { rows: rowsConteo } = await query(consultaConteo, valores);
  const totalRegistros = rowsConteo[0]?.total ?? 0;

  const limiteValido = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limiteValido));
  const paginaValida = Math.min(Math.max(1, parseInt(pagina, 10) || 1), totalPaginas);
  const offset = (paginaValida - 1) * limiteValido;

  const consultaDatos = `
    SELECT
      m.id,
      m.producto_id,
      p.codigo AS producto_codigo,
      p.nombre AS producto_nombre,
      p.imagen_url AS producto_imagen_url,
      u_med.abreviatura AS unidad_abreviatura,
      m.tipo,
      m.cantidad,
      m.stock_resultante,
      m.referencia_tipo,
      m.referencia_id,
      m.motivo,
      m.usuario_id,
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido,
      u.username AS usuario_username,
      m.created_at
    FROM movimientos_inventario m
    INNER JOIN productos p ON p.id = m.producto_id
    INNER JOIN unidades_medida u_med ON u_med.id = p.unidad_id
    INNER JOIN usuarios u ON u.id = m.usuario_id
    ${whereClausula}
    ORDER BY m.created_at DESC
    LIMIT $${posicion++} OFFSET $${posicion++}
  `;

  valores.push(limiteValido, offset);
  const { rows: movimientos } = await query(consultaDatos, valores);

  return {
    movimientos: movimientos.map((m) => ({
      id: m.id,
      producto_id: m.producto_id,
      producto_codigo: m.producto_codigo,
      producto_nombre: m.producto_nombre,
      producto_imagen_url: m.producto_imagen_url,
      unidad_abreviatura: m.unidad_abreviatura,
      tipo: m.tipo,
      cantidad: Number(m.cantidad),
      stock_resultante: Number(m.stock_resultante),
      referencia_tipo: m.referencia_tipo,
      referencia_id: m.referencia_id,
      motivo: m.motivo,
      usuario_id: m.usuario_id,
      usuario_nombre: `${m.usuario_nombre} ${m.usuario_apellido || ''}`.trim(),
      usuario_username: m.usuario_username,
      created_at: m.created_at,
    })),
    paginacion: {
      total: totalRegistros,
      pagina: paginaValida,
      limite: limiteValido,
      total_paginas: totalPaginas,
    },
  };
}

export async function obtenerAlertasStock() {
  const { rows } = await query(`
    SELECT
      p.id,
      p.codigo,
      p.codigo_barras,
      p.nombre,
      p.imagen_url,
      p.stock_minimo,
      c.nombre AS categoria_nombre,
      u.abreviatura AS unidad_abreviatura,
      COALESCE(i.cantidad_actual, 0) AS stock_actual,
      CASE
        WHEN COALESCE(i.cantidad_actual, 0) <= 0 THEN 'AGOTADO'
        ELSE 'BAJO_STOCK'
      END AS estado_stock
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    INNER JOIN unidades_medida u ON u.id = p.unidad_id
    LEFT JOIN inventario i ON i.producto_id = p.id
    WHERE p.activo = TRUE
      AND COALESCE(i.cantidad_actual, 0) <= p.stock_minimo
    ORDER BY
      CASE WHEN COALESCE(i.cantidad_actual, 0) <= 0 THEN 1 ELSE 2 END ASC,
      (COALESCE(i.cantidad_actual, 0) - p.stock_minimo) ASC,
      LOWER(p.nombre) ASC
  `);

  return rows.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    codigo_barras: r.codigo_barras,
    nombre: r.nombre,
    imagen_url: r.imagen_url,
    categoria_nombre: r.categoria_nombre,
    unidad_abreviatura: r.unidad_abreviatura,
    stock_actual: Number(r.stock_actual),
    stock_minimo: Number(r.stock_minimo),
    estado_stock: r.estado_stock,
  }));
}

export async function registrarAjusteManual({
  productoId,
  tipo = 'AJUSTE',
  cantidad = null,
  stockResultanteObjetivo = null,
  motivo,
  usuarioId,
  ip = null,
}) {
  if (!['AJUSTE', 'MERMA'].includes(tipo)) {
    throw new ErrorHttp(400, 'El tipo de ajuste manual solo puede ser AJUSTE o MERMA.');
  }

  return await registrarMovimientoInventario({
    productoId,
    tipo,
    cantidad,
    stockResultanteObjetivo,
    usuarioId,
    motivo,
    ip,
  });
}
