import {
  actualizarCategoria as actualizarCategoriaService,
  crearCategoria as crearCategoriaService,
  eliminarCategoria as eliminarCategoriaService,
  listarCategorias as listarCategoriasService,
  obtenerCategoriaPorId,
} from '../services/categoria.service.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';

function puedeVerInactivas(usuario) {
  return usuario?.rol === 'Administrador' || usuario?.rol === 'Gerente';
}

export async function listarCategorias(req, res, next) {
  try {
    const incluirInactivas =
      puedeVerInactivas(req.usuario) &&
      ['1', 'true'].includes(
        String(req.query.incluirInactivas ?? '').toLowerCase(),
      );

    const categorias = await listarCategoriasService({ incluirInactivas });

    return res.status(200).json({ ok: true, categorias });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerCategoria(req, res, next) {
  try {
    const categoria = await obtenerCategoriaPorId(req.params.id);

    if (
      !categoria ||
      (!puedeVerInactivas(req.usuario) && !categoria.activo)
    ) {
      throw new ErrorHttp(404, 'La categoría no existe.');
    }

    return res.status(200).json({ ok: true, categoria });
  } catch (error) {
    return next(error);
  }
}

export async function crearCategoria(req, res, next) {
  try {
    const { nombre, descripcion } = req.body ?? {};

    const categoria = await crearCategoriaService({
      nombre,
      descripcion,
      usuarioId: req.usuario.id,
      ip: req.ip,
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Categoría creada.',
      categoria,
    });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarCategoria(req, res, next) {
  try {
    const { nombre, descripcion, activo } = req.body ?? {};

    const categoria = await actualizarCategoriaService(
      req.params.id,
      { nombre, descripcion, activo },
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Categoría actualizada.',
      categoria,
    });
  } catch (error) {
    return next(error);
  }
}

export async function eliminarCategoria(req, res, next) {
  try {
    const resultado = await eliminarCategoriaService(
      req.params.id,
      req.usuario.id,
      req.ip,
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Categoría eliminada.',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
}
