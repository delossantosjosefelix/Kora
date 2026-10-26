import { pool, query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';
import {
  TIPOS_MOVIMIENTO,
  registrarMovimientoInventario,
} from './inventario.service.js';

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarTextoOpcional(valor, nombreCampo, maxLen) {
  if (valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim())) {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new ErrorHttp(400, `El campo ${nombreCampo} no es válido.`);
  }

  const limpio = valor.trim();
  if (limpio.length > maxLen) {
    throw new ErrorHttp(400, `El campo ${nombreCampo} no puede superar los ${maxLen} caracteres.`);
  }

  return limpio;
}

function validarNumero(valor, nombreCampo) {
  const numero = Number(valor);
  if (
    valor === null ||
    valor === undefined ||
    valor === '' ||
    typeof valor === 'boolean' ||
    !Number.isFinite(numero)
  ) {
    throw new ErrorHttp(400, `El campo ${nombreCampo} debe ser un número válido.`);
  }
  return numero;
}

function validarItems(items, defaultActualizarCosto = false) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorHttp(400, 'La compra debe tener al menos un producto.');
  }

  if (items.length > 500) {
    throw new ErrorHttp(400, 'Una compra no puede contener más de 500 productos por operación.');
  }

  return items.map((item, indice) => {
    const numeroLinea = indice + 1;
    const productoId = item?.producto_id ?? item?.productoId;
    if (!productoId || typeof productoId !== 'string' || !REGEX_UUID.test(productoId)) {
      throw new ErrorHttp(400, `La línea ${numeroLinea} no tiene un producto válido.`);
    }

    const cantidad = validarNumero(item?.cantidad, `cantidad de la línea ${numeroLinea}`);
    if (cantidad <= 0) {
      throw new ErrorHttp(400, `La cantidad de la línea ${numeroLinea} debe ser mayor que cero.`);
    }

    const costoUnitario = validarNumero(
      item?.costo_unitario ?? item?.costoUnitario,
      `costo unitario de la línea ${numeroLinea}`,
    );
    if (costoUnitario < 0) {
      throw new ErrorHttp(400, `El costo unitario de la línea ${numeroLinea} no puede ser negativo.`);
    }

    const cantidadRedondeada = Number(cantidad.toFixed(3));
    const costoRedondeado = Number(costoUnitario.toFixed(2));
    const actualizarCosto = Boolean(
      item?.actualizar_costo ?? item?.actualizarCosto ?? defaultActualizarCosto,
    );

    return {
      productoId,
      cantidad: cantidadRedondeada,
      costoUnitario: costoRedondeado,
      subtotal: Number((cantidadRedondeada * costoRedondeado).toFixed(2)),
      actualizarCosto,
    };
  });
}

export async function registrarCompra({
  suplidorId,
  numeroFactura = null,
  fecha = null,
  observacion = null,
  actualizarCosto = false,
  items,
  usuarioId,
  ip = null,
}) {
  if (!suplidorId || typeof suplidorId !== 'string' || !REGEX_UUID.test(suplidorId)) {
    throw new ErrorHttp(400, 'Debe seleccionar un suplidor válido.');
  }

  if (!usuarioId) {
    throw new ErrorHttp(400, 'Debe indicar el usuario que registra la compra.');
  }

  const numeroFacturaLimpio = validarTextoOpcional(numeroFactura, 'número de factura', 40);
  const observacionLimpia = validarTextoOpcional(observacion, 'observación', 255);

  let fechaLimpia = null;
  if (fecha !== null && fecha !== undefined && fecha !== '') {
    if (typeof fecha !== 'string' || !REGEX_FECHA.test(fecha)) {
      throw new ErrorHttp(400, 'La fecha de la compra no es válida.');
    }
    fechaLimpia = fecha;
  }

  const lineas = validarItems(items, Boolean(actualizarCosto));

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: suplidorRows } = await client.query(
      'SELECT id, nombre, activo FROM suplidores WHERE id = $1',
      [suplidorId],
    );
    const suplidor = suplidorRows[0];
    if (!suplidor) {
      throw new ErrorHttp(404, 'El suplidor especificado no existe.');
    }
    if (!suplidor.activo) {
      throw new ErrorHttp(400, 'No se puede registrar una compra a un suplidor inactivo.');
    }

    const productosMap = new Map();
    for (const linea of lineas) {
      const { rows: productoRows } = await client.query(
        'SELECT id, nombre, costo, precio_final, activo FROM productos WHERE id = $1',
        [linea.productoId],
      );
      const producto = productoRows[0];
      if (!producto) {
        throw new ErrorHttp(404, `El producto de la línea con id ${linea.productoId} no existe.`);
      }
      if (!producto.activo) {
        throw new ErrorHttp(400, `El producto "${producto.nombre}" está inactivo y no puede comprarse.`);
      }
      productosMap.set(linea.productoId, producto);
    }

    const total = Number(lineas.reduce((suma, linea) => suma + linea.subtotal, 0).toFixed(2));

    const { rows: compraRows } = await client.query(
      `
        INSERT INTO compras (
          suplidor_id,
          numero_factura_suplidor,
          fecha,
          total,
          observacion,
          usuario_id
        ) VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6)
        RETURNING id, suplidor_id, numero_factura_suplidor, fecha, total, estado, observacion, usuario_id, created_at
      `,
      [suplidorId, numeroFacturaLimpio, fechaLimpia, total, observacionLimpia, usuarioId],
    );
    const compra = compraRows[0];

    const detalles = [];
    for (const linea of lineas) {
      const { rows: detalleRows } = await client.query(
        `
          INSERT INTO detalle_compras (compra_id, producto_id, cantidad, costo_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, producto_id, cantidad, costo_unitario, subtotal
        `,
        [compra.id, linea.productoId, linea.cantidad, linea.costoUnitario, linea.subtotal],
      );

      const resultadoMovimiento = await registrarMovimientoInventario({
        productoId: linea.productoId,
        tipo: TIPOS_MOVIMIENTO.ENTRADA_COMPRA,
        cantidad: linea.cantidad,
        usuarioId,
        referenciaTipo: 'COMPRA',
        referenciaId: compra.id,
        client,
        ip,
      });

      const producto = productosMap.get(linea.productoId);
      let costoActualizado = false;

      if (linea.actualizarCosto && Number(producto.costo) !== linea.costoUnitario) {
        await client.query(
          'UPDATE productos SET costo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [linea.costoUnitario, linea.productoId],
        );

        await client.query(
          `
            INSERT INTO historial_precios (
              producto_id,
              costo_anterior,
              costo_nuevo,
              precio_anterior,
              precio_nuevo,
              usuario_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            linea.productoId,
            Number(producto.costo),
            linea.costoUnitario,
            Number(producto.precio_final),
            Number(producto.precio_final),
            usuarioId,
          ],
        );

        costoActualizado = true;
        producto.costo = linea.costoUnitario;
      }

      const detalle = detalleRows[0];
      detalles.push({
        id: Number(detalle.id),
        producto_id: detalle.producto_id,
        producto_nombre: resultadoMovimiento.producto.nombre,
        cantidad: Number(detalle.cantidad),
        costo_unitario: Number(detalle.costo_unitario),
        subtotal: Number(detalle.subtotal),
        costo_actualizado: costoActualizado,
        stock_anterior: resultadoMovimiento.stock_anterior,
        stock_actual: resultadoMovimiento.stock_actual,
      });
    }

    await client.query('COMMIT');

    // La compra ya está confirmada: un fallo de auditoría no debe provocar
    // ROLLBACK ni devolver error al cliente. Solo se registra en consola.
    try {
      await registrarAuditoria({
        usuarioId,
        accion: 'COMPRA_REGISTRAR',
        entidad: 'compras',
        entidadId: compra.id,
        datosNuevos: {
          suplidor_id: compra.suplidor_id,
          suplidor_nombre: suplidor.nombre,
          numero_factura_suplidor: compra.numero_factura_suplidor,
          fecha: compra.fecha,
          total,
          total_items: lineas.length,
        },
        ip,
      });
    } catch (errorAuditoria) {
      console.error('No se pudo registrar la auditoría de la compra', compra.id, errorAuditoria);
    }

    return {
      id: compra.id,
      suplidor_id: compra.suplidor_id,
      suplidor_nombre: suplidor.nombre,
      numero_factura_suplidor: compra.numero_factura_suplidor,
      fecha: compra.fecha,
      total: Number(compra.total),
      estado: compra.estado,
      observacion: compra.observacion,
      usuario_id: compra.usuario_id,
      created_at: compra.created_at,
      detalles,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listarCompras({
  limite = 20,
  pagina = 1,
  busqueda = '',
  suplidorId = null,
  fechaDesde = null,
  fechaHasta = null,
} = {}) {
  const condiciones = [];
  const valores = [];
  let posicion = 1;

  if (suplidorId && REGEX_UUID.test(String(suplidorId))) {
    condiciones.push(`c.suplidor_id = $${posicion++}`);
    valores.push(suplidorId);
  }

  if (fechaDesde && REGEX_FECHA.test(String(fechaDesde))) {
    condiciones.push(`c.fecha >= $${posicion++}::date`);
    valores.push(fechaDesde);
  }

  if (fechaHasta && REGEX_FECHA.test(String(fechaHasta))) {
    condiciones.push(`c.fecha <= $${posicion++}::date`);
    valores.push(fechaHasta);
  }

  const textoBusqueda = String(busqueda ?? '').trim().toLowerCase();
  if (textoBusqueda) {
    condiciones.push(`
      (
        LOWER(s.nombre) ILIKE $${posicion}
        OR LOWER(COALESCE(c.numero_factura_suplidor, '')) ILIKE $${posicion}
      )
    `);
    valores.push(`%${textoBusqueda}%`);
    posicion++;
  }

  const whereClausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consultaConteo = `
    SELECT COUNT(*)::int AS total
    FROM compras c
    INNER JOIN suplidores s ON s.id = c.suplidor_id
    ${whereClausula}
  `;
  const { rows: rowsConteo } = await query(consultaConteo, valores);
  const totalRegistros = rowsConteo[0]?.total ?? 0;

  const limiteValido = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limiteValido));
  const paginaValida = Math.min(Math.max(1, parseInt(pagina, 10) || 1), totalPaginas);
  const offset = (paginaValida - 1) * limiteValido;

  const consultaDatos = `
    SELECT c.id, c.fecha, c.numero_factura_suplidor, c.total, c.estado,
           c.observacion, s.id AS suplidor_id, s.nombre AS suplidor_nombre, c.created_at
    FROM compras c
    INNER JOIN suplidores s ON s.id = c.suplidor_id
    ${whereClausula}
    ORDER BY c.created_at DESC
    LIMIT $${posicion++} OFFSET $${posicion++}
  `;

  valores.push(limiteValido, offset);
  const { rows: compras } = await query(consultaDatos, valores);

  return {
    compras: compras.map((fila) => ({
      ...fila,
      total: Number(fila.total),
    })),
    paginacion: {
      total: totalRegistros,
      pagina: paginaValida,
      limite: limiteValido,
      total_paginas: totalPaginas,
    },
  };
}

export async function obtenerCompraPorId(id) {
  if (!REGEX_UUID.test(String(id ?? ''))) {
    throw new ErrorHttp(400, 'Identificador de compra no válido.');
  }

  const { rows: cabecera } = await query(
    `
      SELECT c.id, c.suplidor_id, s.nombre AS suplidor_nombre, c.numero_factura_suplidor,
             c.fecha, c.total, c.estado, c.observacion, c.usuario_id, c.created_at
      FROM compras c
      INNER JOIN suplidores s ON s.id = c.suplidor_id
      WHERE c.id = $1
    `,
    [id],
  );

  const compra = cabecera[0];
  if (!compra) {
    throw new ErrorHttp(404, 'La compra especificada no existe.');
  }

  const { rows: detalles } = await query(
    `
      SELECT d.id, d.producto_id, p.nombre AS producto_nombre, d.cantidad,
             d.costo_unitario, d.subtotal
      FROM detalle_compras d
      INNER JOIN productos p ON p.id = d.producto_id
      WHERE d.compra_id = $1
      ORDER BY d.id ASC
    `,
    [id],
  );

  return {
    ...compra,
    total: Number(compra.total),
    detalles: detalles.map((d) => ({
      ...d,
      id: Number(d.id),
      cantidad: Number(d.cantidad),
      costo_unitario: Number(d.costo_unitario),
      subtotal: Number(d.subtotal),
    })),
  };
}
