import {
  listarExistencias as listarExistenciasService,
  listarMovimientos as listarMovimientosService,
  obtenerAlertasStock as obtenerAlertasStockService,
  registrarAjusteManual as registrarAjusteManualService,
} from '../services/inventario.service.js';

export async function listarExistencias(req, res, next) {
  try {
    const {
      busqueda,
      categoriaId,
      categoria_id,
      estadoStock,
      estado_stock,
      activo,
      limite,
      pagina,
    } = req.query ?? {};

    const resultado = await listarExistenciasService({
      busqueda,
      categoriaId: categoriaId || categoria_id,
      estadoStock: estadoStock || estado_stock,
      activo,
      limite,
      pagina,
      rolSolicitante: req.usuario?.rol,
    });

    return res.status(200).json({
      ok: true,
      ...resultado,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listarMovimientos(req, res, next) {
  try {
    const {
      productoId,
      producto_id,
      tipo,
      fechaDesde,
      fecha_desde,
      fechaHasta,
      fecha_hasta,
      busqueda,
      limite,
      pagina,
    } = req.query ?? {};

    const resultado = await listarMovimientosService({
      productoId: productoId || producto_id,
      tipo,
      fechaDesde: fechaDesde || fecha_desde,
      fechaHasta: fechaHasta || fecha_hasta,
      busqueda,
      limite,
      pagina,
    });

    return res.status(200).json({
      ok: true,
      ...resultado,
    });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerAlertasStock(req, res, next) {
  try {
    const alertas = await obtenerAlertasStockService();

    return res.status(200).json({
      ok: true,
      alertas,
      total_alertas: alertas.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function registrarAjuste(req, res, next) {
  try {
    const cuerpo = req.body ?? {};
    const productoId = cuerpo.producto_id ?? cuerpo.productoId;
    const tipo = cuerpo.tipo ?? 'AJUSTE';
    const cantidad = cuerpo.cantidad;
    const stockResultanteObjetivo =
      cuerpo.stock_resultante_objetivo ??
      cuerpo.stockResultanteObjetivo ??
      cuerpo.nuevo_stock ??
      cuerpo.nuevoStock;
    const motivo = cuerpo.motivo;

    const resultado = await registrarAjusteManualService({
      productoId,
      tipo,
      cantidad,
      stockResultanteObjetivo,
      motivo,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: `Movimiento de ${tipo === 'MERMA' ? 'merma' : 'ajuste'} registrado exitosamente.`,
      resultado,
    });
  } catch (error) {
    return next(error);
  }
}
