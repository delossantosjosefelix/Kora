import {
  actualizarUnidad as actualizarUnidadService,
  crearUnidad as crearUnidadService,
  eliminarUnidad as eliminarUnidadService,
  listarUnidades as listarUnidadesService,
  obtenerUnidadPorId,
} from '../services/unidad.service.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

function puedeVerInactivas(usuario) {
  return usuario?.rol === 'Administrador' || usuario?.rol === 'Gerente';
}

export async function listarUnidades(req, res, next) {
  try {
    const incluirInactivas =
      puedeVerInactivas(req.usuario) &&
      ['1', 'true'].includes(
        String(req.query.incluirInactivas ?? '').toLowerCase(),
      );

    const unidades = await listarUnidadesService({ incluirInactivas });

    return res.status(200).json({ ok: true, unidades });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerUnidad(req, res, next) {
  try {
    const unidad = await obtenerUnidadPorId(req.params.id);

    if (!unidad || (!puedeVerInactivas(req.usuario) && !unidad.activo)) {
      throw new ErrorHttp(404, 'La unidad no existe.');
    }

    return res.status(200).json({ ok: true, unidad });
  } catch (error) {
    return next(error);
  }
}

export async function crearUnidad(req, res, next) {
  try {
    const { nombre, abreviatura } = req.body ?? {};

    const unidad = await crearUnidadService({
      nombre,
      abreviatura,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Unidad creada.',
      unidad,
    });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarUnidad(req, res, next) {
  try {
    const { nombre, abreviatura, activo } = req.body ?? {};

    const unidad = await actualizarUnidadService(
      req.params.id,
      { nombre, abreviatura, activo },
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Unidad actualizada.',
      unidad,
    });
  } catch (error) {
    return next(error);
  }
}

export async function eliminarUnidad(req, res, next) {
  try {
    const resultado = await eliminarUnidadService(
      req.params.id,
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Unidad eliminada.',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
}
