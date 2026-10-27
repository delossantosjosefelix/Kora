import { pool, query } from '../config/db.js';
import { eliminarArchivoUpload } from '../middleware/upload.middleware.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';
import {
  generarSiguienteCodigo,
  previsualizarSiguienteCodigo,
} from './secuencia.service.js';

const TASAS_ITBIS_PERMITIDAS = new Set([0, 16, 18]);

export function calcularItbis(precioFinal, tasaItbis) {
  const precio = Number(precioFinal);
  const tasa = Number(tasaItbis);

  if (!Number.isFinite(precio) || precio < 0) {
    return { precioBase: 0, montoItbis: 0 };
  }

  if (tasa === 0) {
    return {
      precioBase: Number(precio.toFixed(2)),
      montoItbis: 0,
    };
  }

  const base = Number((precio / (1 + tasa / 100)).toFixed(2));
  const itbis = Number((precio - base).toFixed(2));

  return {
    precioBase: base,
    montoItbis: itbis,
  };
}

function validarCodigo(codigo) {
  if (typeof codigo !== 'string' || !codigo.trim()) {
    throw new ErrorHttp(400, 'El código del producto es obligatorio.');
  }

  const codigoLimpio = codigo.trim();

  if (codigoLimpio.length > 30) {
    throw new ErrorHttp(
      400,
      'El código del producto no puede superar los 30 caracteres.',
    );
  }

  return codigoLimpio;
}

function validarCodigoBarras(codigoBarras) {
  if (
    codigoBarras === undefined ||
    codigoBarras === null ||
    (typeof codigoBarras === 'string' && !codigoBarras.trim())
  ) {
    return null;
  }

  if (typeof codigoBarras !== 'string') {
    throw new ErrorHttp(400, 'El código de barras no es válido.');
  }

  const codigoLimpio = codigoBarras.trim();

  if (codigoLimpio.length > 50) {
    throw new ErrorHttp(
      400,
      'El código de barras no puede superar los 50 caracteres.',
    );
  }

  return codigoLimpio;
}

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    throw new ErrorHttp(400, 'El nombre del producto es obligatorio.');
  }

  const nombreLimpio = nombre.trim();

  if (nombreLimpio.length > 120) {
    throw new ErrorHttp(
      400,
      'El nombre del producto no puede superar los 120 caracteres.',
    );
  }

  return nombreLimpio;
}

function validarDescripcion(descripcion) {
  if (
    descripcion === undefined ||
    descripcion === null ||
    (typeof descripcion === 'string' && !descripcion.trim())
  ) {
    return null;
  }

  if (typeof descripcion !== 'string') {
    throw new ErrorHttp(400, 'La descripción del producto no es válida.');
  }

  const descripcionLimpia = descripcion.trim();

  if (descripcionLimpia.length > 255) {
    throw new ErrorHttp(
      400,
      'La descripción no puede superar los 255 caracteres.',
    );
  }

  return descripcionLimpia;
}

async function validarCategoria(categoriaId, client = null) {
  const numero = Number(categoriaId);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorHttp(400, 'Debe seleccionar una categoría válida.');
  }

  const ejecutador = client ?? pool;
  const { rows } = await ejecutador.query(
    'SELECT id, nombre, activo FROM categorias WHERE id = $1',
    [numero],
  );

  const categoria = rows[0];

  if (!categoria) {
    throw new ErrorHttp(400, 'La categoría seleccionada no existe.');
  }

  if (!categoria.activo) {
    throw new ErrorHttp(
      400,
      'La categoría seleccionada está inactiva y no puede recibir productos nuevos.',
    );
  }

  return numero;
}

async function validarUnidad(unidadId, client = null) {
  const numero = Number(unidadId);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorHttp(400, 'Debe seleccionar una unidad de medida válida.');
  }

  const ejecutador = client ?? pool;
  const { rows } = await ejecutador.query(
    'SELECT id, nombre, abreviatura, activo FROM unidades_medida WHERE id = $1',
    [numero],
  );

  const unidad = rows[0];

  if (!unidad) {
    throw new ErrorHttp(400, 'La unidad de medida seleccionada no existe.');
  }

  if (!unidad.activo) {
    throw new ErrorHttp(
      400,
      'La unidad de medida seleccionada está inactiva.',
    );
  }

  return numero;
}

function validarPrecioFinal(precioFinal) {
  const numero = Number(precioFinal);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new ErrorHttp(
      400,
      'El precio final de venta es obligatorio y debe ser mayor o igual a 0.',
    );
  }

  return Number(numero.toFixed(2));
}

function validarCosto(costo) {
  if (costo === undefined || costo === null || costo === '') {
    return 0;
  }

  const numero = Number(costo);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new ErrorHttp(400, 'El costo del producto debe ser mayor o igual a 0.');
  }

  return Number(numero.toFixed(2));
}

function validarTasaItbis(tasaItbis) {
  if (tasaItbis === undefined || tasaItbis === null || tasaItbis === '') {
    return 18.00;
  }

  const numero = Number(tasaItbis);

  if (!TASAS_ITBIS_PERMITIDAS.has(numero)) {
    throw new ErrorHttp(
      400,
      'La tasa de ITBIS debe ser 0 %, 16 % o 18 %.',
    );
  }

  return Number(numero.toFixed(2));
}

function validarStockMinimo(stockMinimo) {
  if (stockMinimo === undefined || stockMinimo === null || stockMinimo === '') {
    return 0;
  }

  const numero = Number(stockMinimo);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new ErrorHttp(
      400,
      'El stock mínimo debe ser un número mayor o igual a 0.',
    );
  }

  return Number(numero.toFixed(3));
}

async function codigoExiste(codigo, excluirId = null, client = null) {
  const ejecutador = client ?? pool;
  const { rows } = await ejecutador.query(
    `
      SELECT 1 FROM productos
      WHERE LOWER(codigo) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2)
    `,
    [codigo, excluirId],
  );

  return rows.length > 0;
}

async function codigoBarrasExiste(codigoBarras, excluirId = null, client = null) {
  if (!codigoBarras) return false;

  const ejecutador = client ?? pool;
  const { rows } = await ejecutador.query(
    `
      SELECT 1 FROM productos
      WHERE LOWER(codigo_barras) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2)
    `,
    [codigoBarras, excluirId],
  );

  return rows.length > 0;
}

export function mapearProducto(fila, rolSolicitante) {
  if (!fila) return null;

  const esCajero = rolSolicitante === 'Cajero';
  const precioFinal = Number(fila.precio_final);
  const tasaItbis = Number(fila.tasa_itbis);
  const costo = esCajero ? null : Number(fila.costo);
  const { precioBase, montoItbis } = calcularItbis(precioFinal, tasaItbis);

  let margenBruto = null;
  let porcentajeMargen = null;

  if (!esCajero && costo !== null) {
    margenBruto = Number((precioFinal - costo).toFixed(2));
    porcentajeMargen =
      costo > 0 ? Number((((precioFinal - costo) / costo) * 100).toFixed(1)) : null;
  }

  return {
    id: fila.id,
    codigo: fila.codigo,
    codigo_barras: fila.codigo_barras,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    categoria_id: fila.categoria_id,
    categoria_nombre: fila.categoria_nombre,
    categoria_icono: fila.categoria_icono || 'Tag',
    unidad_id: fila.unidad_id,
    unidad_nombre: fila.unidad_nombre,
    unidad_abreviatura: fila.unidad_abreviatura,
    unidad_icono: fila.unidad_icono || 'Package',
    precio_final: precioFinal,
    tasa_itbis: tasaItbis,
    precio_base: precioBase,
    monto_itbis: montoItbis,
    costo,
    margen_bruto: margenBruto,
    porcentaje_margen: porcentajeMargen,
    stock_actual: Number(fila.stock_actual ?? 0),
    stock_minimo: Number(fila.stock_minimo ?? 0),
    imagen_url: fila.imagen_url,
    activo: Boolean(fila.activo),
    created_at: fila.created_at,
    updated_at: fila.updated_at,
  };
}

const SELECT_PRODUCTO = `
  SELECT
    p.id,
    p.codigo,
    p.codigo_barras,
    p.nombre,
    p.descripcion,
    p.categoria_id,
    c.nombre AS categoria_nombre,
    c.icono AS categoria_icono,
    p.unidad_id,
    u.nombre AS unidad_nombre,
    u.abreviatura AS unidad_abreviatura,
    u.icono AS unidad_icono,
    p.costo,
    p.precio_final,
    p.tasa_itbis,
    p.stock_minimo,
    p.imagen_url,
    p.activo,
    p.created_at,
    p.updated_at,
    COALESCE(i.cantidad_actual, 0) AS stock_actual
  FROM productos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  INNER JOIN unidades_medida u ON u.id = p.unidad_id
  LEFT JOIN inventario i ON i.producto_id = p.id
`;

export async function listarProductos({
  busqueda = '',
  categoriaId = null,
  activo = 'todos',
  rolSolicitante = 'Administrador',
} = {}) {
  const esCajero = rolSolicitante === 'Cajero';
  const condiciones = [];
  const valores = [];
  let posicion = 1;

  if (esCajero) {
    condiciones.push('p.activo = TRUE');
  } else if (activo === 'activos' || activo === 'true' || activo === true) {
    condiciones.push('p.activo = TRUE');
  } else if (activo === 'inactivos' || activo === 'false' || activo === false) {
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

  const whereClausula =
    condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const consulta = `
    ${SELECT_PRODUCTO}
    ${whereClausula}
    ORDER BY p.activo DESC, LOWER(p.nombre) ASC
  `;

  const { rows } = await query(consulta, valores);
  return rows.map((fila) => mapearProducto(fila, rolSolicitante));
}

export async function obtenerProductoPorId(id, rolSolicitante = 'Administrador') {
  if (!id) {
    throw new ErrorHttp(400, 'Identificador de producto no válido.');
  }

  const { rows } = await query(`${SELECT_PRODUCTO} WHERE p.id = $1`, [id]);
  const producto = rows[0];

  if (!producto) {
    return null;
  }

  if (rolSolicitante === 'Cajero' && !producto.activo) {
    return null;
  }

  const productoMapeado = mapearProducto(producto, rolSolicitante);

  if (rolSolicitante !== 'Cajero') {
    const { rows: historial } = await query(
      `
        SELECT
          hp.id,
          hp.costo_anterior,
          hp.costo_nuevo,
          hp.precio_anterior,
          hp.precio_nuevo,
          hp.fecha,
          u.nombre AS usuario_nombre,
          u.username AS usuario_username
        FROM historial_precios hp
        LEFT JOIN usuarios u ON u.id = hp.usuario_id
        WHERE hp.producto_id = $1
        ORDER BY hp.fecha DESC
        LIMIT 10
      `,
      [id],
    );

    productoMapeado.historial_precios = historial;
  }

  return productoMapeado;
}

export async function crearProducto({
  codigo,
  codigoBarras,
  nombre,
  descripcion,
  categoriaId,
  unidadId,
  costo,
  precioFinal,
  tasaItbis,
  stockMinimo,
  imagenUrl,
  usuarioId,
  ip,
  rolSolicitante,
}) {
  const client = await pool.connect();
  let imagenGuardada = imagenUrl;

  try {
    const codigoBarrasValido = validarCodigoBarras(codigoBarras);
    const nombreValido = validarNombre(nombre);
    const descripcionValida = validarDescripcion(descripcion);
    const catIdValido = await validarCategoria(categoriaId, client);
    const uniIdValido = await validarUnidad(unidadId, client);
    const costoValido = validarCosto(costo);
    const precioFinalValido = validarPrecioFinal(precioFinal);
    const tasaItbisValida = validarTasaItbis(tasaItbis);
    const stockMinimoValido = validarStockMinimo(stockMinimo);

    if (
      codigoBarrasValido &&
      (await codigoBarrasExiste(codigoBarrasValido, null, client))
    ) {
      throw new ErrorHttp(
        400,
        `Ya existe un producto con el código de barras "${codigoBarrasValido}".`,
      );
    }

    await client.query('BEGIN');

    let codigoValido;
    if (codigo && typeof codigo === 'string' && codigo.trim()) {
      codigoValido = validarCodigo(codigo);
      if (await codigoExiste(codigoValido, null, client)) {
        throw new ErrorHttp(
          400,
          `Ya existe un producto con el código "${codigoValido}".`,
        );
      }
    } else {
      codigoValido = await generarSiguienteCodigo(client, {
        tabla: 'productos',
        columna: 'codigo',
        prefijo: 'PROD-',
        longitud: 4,
      });
    }

    const { rows: productoRows } = await client.query(
      `
        INSERT INTO productos (
          codigo,
          codigo_barras,
          nombre,
          descripcion,
          categoria_id,
          unidad_id,
          costo,
          precio_final,
          tasa_itbis,
          stock_minimo,
          imagen_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `,
      [
        codigoValido,
        codigoBarrasValido,
        nombreValido,
        descripcionValida,
        catIdValido,
        uniIdValido,
        costoValido,
        precioFinalValido,
        tasaItbisValida,
        stockMinimoValido,
        imagenGuardada || null,
      ],
    );

    const nuevoId = productoRows[0].id;

    await client.query(
      `
        INSERT INTO inventario (producto_id, cantidad_actual)
        VALUES ($1, 0)
        ON CONFLICT (producto_id) DO NOTHING
      `,
      [nuevoId],
    );

    await client.query('COMMIT');

    await registrarAuditoria({
      usuarioId,
      accion: 'PRODUCTO_CREADO',
      entidad: 'productos',
      entidadId: nuevoId,
      datosNuevos: {
        codigo: codigoValido,
        nombre: nombreValido,
        precio_final: precioFinalValido,
        costo: costoValido,
        tasa_itbis: tasaItbisValida,
      },
      ip,
    });

    return await obtenerProductoPorId(nuevoId, rolSolicitante);
  } catch (error) {
    await client.query('ROLLBACK');

    if (imagenGuardada) {
      await eliminarArchivoUpload(imagenGuardada);
    }

    if (error.code === '23505') {
      if (error.constraint?.includes('codigo_barras')) {
        throw new ErrorHttp(
          400,
          'Ya existe un producto con ese código de barras.',
        );
      }
      throw new ErrorHttp(400, 'Ya existe un producto con ese código.');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarProducto(
  id,
  datos,
  usuarioId,
  ip,
  rolSolicitante,
) {
  const client = await pool.connect();
  const productoActual = await obtenerProductoPorId(id, 'Administrador');

  if (!productoActual) {
    if (datos.nuevaImagenUrl) {
      await eliminarArchivoUpload(datos.nuevaImagenUrl);
    }
    throw new ErrorHttp(404, 'El producto no existe.');
  }

  let imagenAnteriorABorrar = null;

  try {
    const sets = [];
    const valores = [];
    let posicion = 1;

    let nuevoCosto = Number(productoActual.costo);
    let nuevoPrecioFinal = Number(productoActual.precio_final);
    let cambioCosto = false;
    let cambioPrecio = false;

    if (datos.codigo !== undefined) {
      const codigoValido = validarCodigo(datos.codigo);
      if (await codigoExiste(codigoValido, id, client)) {
        throw new ErrorHttp(
          400,
          `Ya existe un producto con el código "${codigoValido}".`,
        );
      }
      sets.push(`codigo = $${posicion++}`);
      valores.push(codigoValido);
    }

    if (datos.codigoBarras !== undefined) {
      const codigoBarrasValido = validarCodigoBarras(datos.codigoBarras);
      if (
        codigoBarrasValido &&
        (await codigoBarrasExiste(codigoBarrasValido, id, client))
      ) {
        throw new ErrorHttp(
          400,
          `Ya existe un producto con el código de barras "${codigoBarrasValido}".`,
        );
      }
      sets.push(`codigo_barras = $${posicion++}`);
      valores.push(codigoBarrasValido);
    }

    if (datos.nombre !== undefined) {
      const nombreValido = validarNombre(datos.nombre);
      sets.push(`nombre = $${posicion++}`);
      valores.push(nombreValido);
    }

    if (datos.descripcion !== undefined) {
      const descripcionValida = validarDescripcion(datos.descripcion);
      sets.push(`descripcion = $${posicion++}`);
      valores.push(descripcionValida);
    }

    if (datos.categoriaId !== undefined) {
      const catIdValido = await validarCategoria(datos.categoriaId, client);
      sets.push(`categoria_id = $${posicion++}`);
      valores.push(catIdValido);
    }

    if (datos.unidadId !== undefined) {
      const uniIdValido = await validarUnidad(datos.unidadId, client);
      sets.push(`unidad_id = $${posicion++}`);
      valores.push(uniIdValido);
    }

    if (datos.costo !== undefined) {
      nuevoCosto = validarCosto(datos.costo);
      if (nuevoCosto !== Number(productoActual.costo)) {
        cambioCosto = true;
      }
      sets.push(`costo = $${posicion++}`);
      valores.push(nuevoCosto);
    }

    if (datos.precioFinal !== undefined) {
      nuevoPrecioFinal = validarPrecioFinal(datos.precioFinal);
      if (nuevoPrecioFinal !== Number(productoActual.precio_final)) {
        cambioPrecio = true;
      }
      sets.push(`precio_final = $${posicion++}`);
      valores.push(nuevoPrecioFinal);
    }

    if (datos.tasaItbis !== undefined) {
      const tasaItbisValida = validarTasaItbis(datos.tasaItbis);
      sets.push(`tasa_itbis = $${posicion++}`);
      valores.push(tasaItbisValida);
    }

    if (datos.stockMinimo !== undefined) {
      const stockMinimoValido = validarStockMinimo(datos.stockMinimo);
      sets.push(`stock_minimo = $${posicion++}`);
      valores.push(stockMinimoValido);
    }

    if (datos.activo !== undefined) {
      if (typeof datos.activo !== 'boolean') {
        throw new ErrorHttp(400, 'El estado del producto debe ser un booleano.');
      }
      sets.push(`activo = $${posicion++}`);
      valores.push(datos.activo);
    }

    if (datos.nuevaImagenUrl) {
      sets.push(`imagen_url = $${posicion++}`);
      valores.push(datos.nuevaImagenUrl);
      if (productoActual.imagen_url) {
        imagenAnteriorABorrar = productoActual.imagen_url;
      }
    } else if (datos.eliminarImagen === true || datos.eliminarImagen === 'true') {
      sets.push(`imagen_url = $${posicion++}`);
      valores.push(null);
      if (productoActual.imagen_url) {
        imagenAnteriorABorrar = productoActual.imagen_url;
      }
    }

    if (sets.length === 0) {
      throw new ErrorHttp(400, 'No hay campos para actualizar.');
    }

    await client.query('BEGIN');

    valores.push(id);
    await client.query(
      `
        UPDATE productos
        SET ${sets.join(', ')}
        WHERE id = $${posicion}
      `,
      valores,
    );

    if (cambioCosto || cambioPrecio) {
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
          id,
          Number(productoActual.costo),
          nuevoCosto,
          Number(productoActual.precio_final),
          nuevoPrecioFinal,
          usuarioId,
        ],
      );
    }

    await client.query('COMMIT');

    if (imagenAnteriorABorrar) {
      await eliminarArchivoUpload(imagenAnteriorABorrar);
    }

    await registrarAuditoria({
      usuarioId,
      accion: 'PRODUCTO_ACTUALIZADO',
      entidad: 'productos',
      entidadId: id,
      datosAnteriores: {
        codigo: productoActual.codigo,
        nombre: productoActual.nombre,
        costo: productoActual.costo,
        precio_final: productoActual.precio_final,
        activo: productoActual.activo,
      },
      datosNuevos: {
        costo: nuevoCosto,
        precio_final: nuevoPrecioFinal,
      },
      ip,
    });

    return await obtenerProductoPorId(id, rolSolicitante);
  } catch (error) {
    await client.query('ROLLBACK');

    if (datos.nuevaImagenUrl) {
      await eliminarArchivoUpload(datos.nuevaImagenUrl);
    }

    if (error.code === '23505') {
      if (error.constraint?.includes('codigo_barras')) {
        throw new ErrorHttp(
          400,
          'Ya existe un producto con ese código de barras.',
        );
      }
      throw new ErrorHttp(400, 'Ya existe un producto con ese código.');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function eliminarProducto(id, usuarioId, ip) {
  const client = await pool.connect();
  const producto = await obtenerProductoPorId(id, 'Administrador');

  if (!producto) {
    throw new ErrorHttp(404, 'El producto no existe.');
  }

  try {
    const { rows: conteos } = await client.query(
      `
        SELECT
          (SELECT COUNT(*)::int FROM detalle_ventas WHERE producto_id = $1) AS ventas_count,
          (SELECT COUNT(*)::int FROM detalle_compras WHERE producto_id = $1) AS compras_count,
          (SELECT COUNT(*)::int FROM detalle_devoluciones WHERE producto_id = $1) AS devoluciones_count,
          (SELECT COUNT(*)::int FROM movimientos_inventario WHERE producto_id = $1) AS movimientos_count,
          (SELECT COALESCE(cantidad_actual, 0) FROM inventario WHERE producto_id = $1) AS stock_actual
      `,
      [id],
    );

    const row = conteos[0] || {};
    const totalOperaciones =
      (row.ventas_count || 0) +
      (row.compras_count || 0) +
      (row.devoluciones_count || 0) +
      (row.movimientos_count || 0);

    const stockActual = Number(row.stock_actual || 0);

    if (totalOperaciones > 0 || stockActual !== 0) {
      throw new ErrorHttp(
        409,
        'No se puede eliminar un producto con existencias o historial de ventas, compras o movimientos. Desactívalo para conservar el registro contable.',
      );
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM historial_precios WHERE producto_id = $1', [id]);
    await client.query('DELETE FROM inventario WHERE producto_id = $1', [id]);
    await client.query('DELETE FROM productos WHERE id = $1', [id]);
    await client.query('COMMIT');

    if (producto.imagen_url) {
      await eliminarArchivoUpload(producto.imagen_url);
    }

    await registrarAuditoria({
      usuarioId,
      accion: 'PRODUCTO_ELIMINADO',
      entidad: 'productos',
      entidadId: id,
      datosAnteriores: {
        codigo: producto.codigo,
        nombre: producto.nombre,
      },
      ip,
    });

    return { id, nombre: producto.nombre, codigo: producto.codigo };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function obtenerSiguienteCodigoProducto() {
  return await previsualizarSiguienteCodigo({
    tabla: 'productos',
    columna: 'codigo',
    prefijo: 'PROD-',
    longitud: 4,
  });
}
