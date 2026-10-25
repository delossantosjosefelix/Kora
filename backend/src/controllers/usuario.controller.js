import {
  crearUsuario as crearUsuarioService,
  actualizarUsuario as actualizarUsuarioService,
  eliminarUsuario as eliminarUsuarioService,
  listarUsuarios as listarUsuariosService,
  obtenerUsuarioPorId,
} from '../services/usuario.service.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

export async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await listarUsuariosService({
      rolSolicitante: req.usuario.rol,
    });
    return res.status(200).json({ ok: true, usuarios });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerUsuario(req, res, next) {
  try {
    const usuario = await obtenerUsuarioPorId(req.params.id, {
      rolSolicitante: req.usuario.rol,
    });
    if (!usuario) {
      throw new ErrorHttp(404, 'Usuario no encontrado.');
    }
    return res.status(200).json({ ok: true, usuario });
  } catch (error) {
    return next(error);
  }
}

export async function crearUsuario(req, res, next) {
  try {
    const { nombre, apellido, username, password, rol_id } = req.body ?? {};
    const usuario = await crearUsuarioService({
      nombre,
      apellido,
      username,
      password,
      rolId: rol_id,
      creadoPor: req.usuario.id,
      ip: req.ip,
      rolSolicitante: req.usuario.rol,
    });
    return res.status(201).json({ ok: true, mensaje: 'Usuario creado.', usuario });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarUsuario(req, res, next) {
  try {
    const { nombre, apellido, username, rol_id, activo, password } = req.body ?? {};

    const usuario = await actualizarUsuarioService(
      req.params.id,
      {
        nombre,
        apellido,
        username,
        rolId: rol_id,
        activo,
        password,
      },
      req.usuario.id,
      req.ip,
      req.usuario.rol,
    );

    return res.status(200).json({ ok: true, mensaje: 'Usuario actualizado.', usuario });
  } catch (error) {
    return next(error);
  }
}

export async function eliminarUsuario(req, res, next) {
  try {
    const resultado = await eliminarUsuarioService(
      req.params.id,
      req.usuario.id,
      req.ip,
      req.usuario.rol,
    );
    return res.status(200).json({ ok: true, mensaje: 'Usuario eliminado permanentemente.', resultado });
  } catch (error) {
    return next(error);
  }
}

