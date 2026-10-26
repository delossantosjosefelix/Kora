import {
  actualizarSuplidor as actualizarSuplidorService,
  crearSuplidor as crearSuplidorService,
  eliminarSuplidor as eliminarSuplidorService,
  listarSuplidores as listarSuplidoresService,
  obtenerSuplidorPorId,
} from '../services/suplidor.service.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

export async function listarSuplidores(req, res, next) {
  try {
    const { busqueda, activo } = req.query ?? {};

    const suplidores = await listarSuplidoresService({
      busqueda,
      activo,
    });

    return res.status(200).json({
      ok: true,
      suplidores,
      total: suplidores.length,
    });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerSuplidor(req, res, next) {
  try {
    const suplidor = await obtenerSuplidorPorId(req.params.id);

    if (!suplidor) {
      throw new ErrorHttp(404, 'El suplidor no existe.');
    }

    return res.status(200).json({
      ok: true,
      suplidor,
    });
  } catch (error) {
    return next(error);
  }
}

export async function crearSuplidor(req, res, next) {
  try {
    const cuerpo = req.body ?? {};

    const suplidor = await crearSuplidorService({
      nombre: cuerpo.nombre,
      rnc: cuerpo.rnc,
      contacto: cuerpo.contacto,
      telefono: cuerpo.telefono,
      email: cuerpo.email,
      direccion: cuerpo.direccion,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Suplidor registrado exitosamente.',
      suplidor,
    });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarSuplidor(req, res, next) {
  try {
    const cuerpo = req.body ?? {};
    const datos = {};

    if (cuerpo.nombre !== undefined) datos.nombre = cuerpo.nombre;
    if (cuerpo.rnc !== undefined) datos.rnc = cuerpo.rnc;
    if (cuerpo.contacto !== undefined) datos.contacto = cuerpo.contacto;
    if (cuerpo.telefono !== undefined) datos.telefono = cuerpo.telefono;
    if (cuerpo.email !== undefined) datos.email = cuerpo.email;
    if (cuerpo.direccion !== undefined) datos.direccion = cuerpo.direccion;
    if (cuerpo.activo !== undefined) datos.activo = cuerpo.activo;

    const suplidor = await actualizarSuplidorService(
      req.params.id,
      datos,
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Suplidor actualizado exitosamente.',
      suplidor,
    });
  } catch (error) {
    return next(error);
  }
}

export async function eliminarSuplidor(req, res, next) {
  try {
    const resultado = await eliminarSuplidorService(
      req.params.id,
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Suplidor eliminado exitosamente.',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
}
