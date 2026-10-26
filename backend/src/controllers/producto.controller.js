import {
  actualizarProducto as actualizarProductoService,
  crearProducto as crearProductoService,
  eliminarProducto as eliminarProductoService,
  listarProductos as listarProductosService,
  obtenerProductoPorId,
} from '../services/producto.service.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

export async function listarProductos(req, res, next) {
  try {
    const { busqueda, categoriaId, categoria_id, activo } = req.query ?? {};

    const productos = await listarProductosService({
      busqueda,
      categoriaId: categoriaId || categoria_id,
      activo,
      rolSolicitante: req.usuario?.rol,
    });

    return res.status(200).json({ ok: true, productos });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerProducto(req, res, next) {
  try {
    const producto = await obtenerProductoPorId(
      req.params.id,
      req.usuario?.rol,
    );

    if (!producto) {
      throw new ErrorHttp(404, 'El producto no existe.');
    }

    return res.status(200).json({ ok: true, producto });
  } catch (error) {
    return next(error);
  }
}

export async function crearProducto(req, res, next) {
  try {
    const cuerpo = req.body ?? {};

    const codigo = cuerpo.codigo;
    const codigoBarras = cuerpo.codigo_barras ?? cuerpo.codigoBarras;
    const nombre = cuerpo.nombre;
    const descripcion = cuerpo.descripcion;
    const categoriaId = cuerpo.categoria_id ?? cuerpo.categoriaId;
    const unidadId = cuerpo.unidad_id ?? cuerpo.unidadId;
    const costo = cuerpo.costo;
    const precioFinal = cuerpo.precio_final ?? cuerpo.precioFinal;
    const tasaItbis = cuerpo.tasa_itbis ?? cuerpo.tasaItbis;
    const stockMinimo = cuerpo.stock_minimo ?? cuerpo.stockMinimo;

    const imagenUrl = req.file
      ? `/uploads/productos/${req.file.filename}`
      : undefined;

    const producto = await crearProductoService({
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
      usuarioId: req.usuario.id,
      ip: req.ip,
      rolSolicitante: req.usuario.rol,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Producto creado exitosamente.',
      producto,
    });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarProducto(req, res, next) {
  try {
    const cuerpo = req.body ?? {};
    const datos = {};

    if (cuerpo.codigo !== undefined) datos.codigo = cuerpo.codigo;
    if (cuerpo.codigo_barras !== undefined || cuerpo.codigoBarras !== undefined) {
      datos.codigoBarras = cuerpo.codigo_barras ?? cuerpo.codigoBarras;
    }
    if (cuerpo.nombre !== undefined) datos.nombre = cuerpo.nombre;
    if (cuerpo.descripcion !== undefined) datos.descripcion = cuerpo.descripcion;
    if (cuerpo.categoria_id !== undefined || cuerpo.categoriaId !== undefined) {
      datos.categoriaId = cuerpo.categoria_id ?? cuerpo.categoriaId;
    }
    if (cuerpo.unidad_id !== undefined || cuerpo.unidadId !== undefined) {
      datos.unidadId = cuerpo.unidad_id ?? cuerpo.unidadId;
    }
    if (cuerpo.costo !== undefined) datos.costo = cuerpo.costo;
    if (cuerpo.precio_final !== undefined || cuerpo.precioFinal !== undefined) {
      datos.precioFinal = cuerpo.precio_final ?? cuerpo.precioFinal;
    }
    if (cuerpo.tasa_itbis !== undefined || cuerpo.tasaItbis !== undefined) {
      datos.tasaItbis = cuerpo.tasa_itbis ?? cuerpo.tasaItbis;
    }
    if (cuerpo.stock_minimo !== undefined || cuerpo.stockMinimo !== undefined) {
      datos.stockMinimo = cuerpo.stock_minimo ?? cuerpo.stockMinimo;
    }
    if (cuerpo.activo !== undefined) {
      datos.activo =
        typeof cuerpo.activo === 'boolean'
          ? cuerpo.activo
          : ['1', 'true'].includes(String(cuerpo.activo).toLowerCase());
    }

    if (req.file) {
      datos.nuevaImagenUrl = `/uploads/productos/${req.file.filename}`;
    }

    if (
      cuerpo.eliminar_imagen === 'true' ||
      cuerpo.eliminar_imagen === true ||
      cuerpo.eliminarImagen === 'true' ||
      cuerpo.eliminarImagen === true
    ) {
      datos.eliminarImagen = true;
    }

    const producto = await actualizarProductoService(
      req.params.id,
      datos,
      req.usuario.id,
      req.ip,
      req.usuario.rol,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Producto actualizado exitosamente.',
      producto,
    });
  } catch (error) {
    return next(error);
  }
}

export async function eliminarProducto(req, res, next) {
  try {
    const resultado = await eliminarProductoService(
      req.params.id,
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Producto eliminado exitosamente.',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
}
