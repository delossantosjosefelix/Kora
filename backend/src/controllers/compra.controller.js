import {
  listarCompras as listarComprasService,
  obtenerCompraPorId as obtenerCompraPorIdService,
  registrarCompra as registrarCompraService,
} from '../services/compra.service.js';

export async function listarCompras(req, res, next) {
  try {
    const {
      limite,
      pagina,
      busqueda,
      suplidorId,
      suplidor_id,
      fechaDesde,
      fecha_desde,
      fechaHasta,
      fecha_hasta,
    } = req.query ?? {};

    const resultado = await listarComprasService({
      limite,
      pagina,
      busqueda,
      suplidorId: suplidorId || suplidor_id,
      fechaDesde: fechaDesde || fecha_desde,
      fechaHasta: fechaHasta || fecha_hasta,
    });

    return res.status(200).json({
      ok: true,
      ...resultado,
    });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerCompra(req, res, next) {
  try {
    const compra = await obtenerCompraPorIdService(req.params.id);

    return res.status(200).json({
      ok: true,
      compra,
    });
  } catch (error) {
    return next(error);
  }
}

export async function crearCompra(req, res, next) {
  try {
    const cuerpo = req.body ?? {};

    const compra = await registrarCompraService({
      suplidorId: cuerpo.suplidor_id ?? cuerpo.suplidorId,
      numeroFactura: cuerpo.numero_factura_suplidor ?? cuerpo.numeroFactura,
      fecha: cuerpo.fecha,
      observacion: cuerpo.observacion,
      actualizarCosto: cuerpo.actualizar_costo ?? cuerpo.actualizarCosto ?? false,
      items: cuerpo.items,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Compra registrada y existencias actualizadas.',
      compra,
    });
  } catch (error) {
    return next(error);
  }
}
