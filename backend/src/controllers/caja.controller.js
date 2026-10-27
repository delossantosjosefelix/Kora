import {
  abrirTurno as abrirTurnoService,
  listarCajasConEstado as listarCajasConEstadoService,
  obtenerTurnoAbierto as obtenerTurnoAbiertoService,
} from '../services/caja.service.js';

export async function obtenerEstadoCajas(req, res, next) {
  try {
    const [cajas, turnoActual] = await Promise.all([
      listarCajasConEstadoService(),
      obtenerTurnoAbiertoService(req.usuario.id),
    ]);

    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      ok: true,
      cajas,
      turno_actual: turnoActual,
    });
  } catch (error) {
    return next(error);
  }
}

export async function abrirTurno(req, res, next) {
  try {
    const cuerpo = req.body ?? {};

    const turno = await abrirTurnoService({
      cajaId: cuerpo.caja_id ?? cuerpo.cajaId,
      efectivoInicial: cuerpo.efectivo_inicial ?? cuerpo.efectivoInicial ?? 0,
      observacion: cuerpo.observacion,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Caja abierta correctamente. Turno iniciado.',
      turno,
    });
  } catch (error) {
    return next(error);
  }
}
