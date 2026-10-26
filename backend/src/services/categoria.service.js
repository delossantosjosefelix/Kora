import { query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

const CAMPOS = 'id, nombre, descripcion, activo';

function validarId(id) {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorHttp(400, 'El identificador de la categoría no es válido.');
  }

  return numero;
}

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    throw new ErrorHttp(400, 'El nombre de la categoría es obligatorio.');
  }

  const nombreLimpio = nombre.trim();

  if (nombreLimpio.length > 60) {
    throw new ErrorHttp(
      400,
      'El nombre de la categoría no puede superar los 60 caracteres.',
    );
  }

  return nombreLimpio;
}

function validarDescripcion(descripcion) {
  if (descripcion === undefined || descripcion === null) {
    return null;
  }

  if (typeof descripcion !== 'string') {
    throw new ErrorHttp(400, 'La descripción de la categoría no es válida.');
  }

  const descripcionLimpia = descripcion.trim();

  if (descripcionLimpia.length > 150) {
    throw new ErrorHttp(
      400,
      'La descripción no puede superar los 150 caracteres.',
    );
  }

  return descripcionLimpia || null;
}

async function nombreExiste(nombre, excluirId = null) {
  const { rows } = excluirId
    ? await query(
        'SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER($1) AND id <> $2',
        [nombre, excluirId],
      )
    : await query('SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER($1)', [
        nombre,
      ]);

  return rows.length > 0;
}

async function contarProductos(categoriaId, soloActivos = false) {
  const { rows } = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM productos
      WHERE categoria_id = $1
        AND ($2::boolean = FALSE OR activo = TRUE)
    `,
    [categoriaId, soloActivos],
  );

  return rows[0]?.total ?? 0;
}

export async function listarCategorias({ incluirInactivas = false } = {}) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS}
      FROM categorias
      WHERE ($1::boolean = TRUE OR activo = TRUE)
      ORDER BY activo DESC, LOWER(nombre) ASC
    `,
    [Boolean(incluirInactivas)],
  );

  return rows;
}

export async function obtenerCategoriaPorId(id) {
  const idNumero = validarId(id);

  const { rows } = await query(
    `SELECT ${CAMPOS} FROM categorias WHERE id = $1`,
    [idNumero],
  );

  return rows[0] ?? null;
}

export async function crearCategoria({ nombre, descripcion, usuarioId, ip }) {
  const nombreLimpio = validarNombre(nombre);
  const descripcionLimpia = validarDescripcion(descripcion);

  if (await nombreExiste(nombreLimpio)) {
    throw new ErrorHttp(400, 'Ya existe una categoría con ese nombre.');
  }

  let categoria;

  try {
    const { rows } = await query(
      `
        INSERT INTO categorias (nombre, descripcion)
        VALUES ($1, $2)
        RETURNING ${CAMPOS}
      `,
      [nombreLimpio, descripcionLimpia],
    );

    categoria = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ErrorHttp(400, 'Ya existe una categoría con ese nombre.');
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'CATEGORIA_CREADA',
    entidad: 'categorias',
    entidadId: String(categoria.id),
    datosNuevos: {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    },
    ip,
  });

  return categoria;
}

export async function actualizarCategoria(
  id,
  { nombre, descripcion, activo },
  usuarioId,
  ip,
) {
  const idNumero = validarId(id);
  const categoriaActual = await obtenerCategoriaPorId(idNumero);

  if (!categoriaActual) {
    throw new ErrorHttp(404, 'La categoría no existe.');
  }

  const sets = [];
  const valores = [];
  let posicion = 1;

  if (nombre !== undefined) {
    const nombreLimpio = validarNombre(nombre);

    if (await nombreExiste(nombreLimpio, idNumero)) {
      throw new ErrorHttp(400, 'Ya existe una categoría con ese nombre.');
    }

    sets.push(`nombre = $${posicion++}`);
    valores.push(nombreLimpio);
  }

  if (descripcion !== undefined) {
    sets.push(`descripcion = $${posicion++}`);
    valores.push(validarDescripcion(descripcion));
  }

  if (activo !== undefined) {
    if (typeof activo !== 'boolean') {
      throw new ErrorHttp(400, 'El estado de la categoría no es válido.');
    }

    if (activo === false && categoriaActual.activo) {
      const productosActivos = await contarProductos(idNumero, true);

      if (productosActivos > 0) {
        throw new ErrorHttp(
          409,
          'No se puede desactivar una categoría que tiene productos activos. Cambia o desactiva esos productos primero.',
        );
      }
    }

    sets.push(`activo = $${posicion++}`);
    valores.push(activo);
  }

  if (sets.length === 0) {
    throw new ErrorHttp(400, 'No hay campos para actualizar.');
  }

  valores.push(idNumero);

  let categoriaActualizada;

  try {
    const { rows } = await query(
      `
        UPDATE categorias
        SET ${sets.join(', ')}
        WHERE id = $${posicion}
        RETURNING ${CAMPOS}
      `,
      valores,
    );

    categoriaActualizada = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ErrorHttp(400, 'Ya existe una categoría con ese nombre.');
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'CATEGORIA_ACTUALIZADA',
    entidad: 'categorias',
    entidadId: String(idNumero),
    datosAnteriores: {
      nombre: categoriaActual.nombre,
      descripcion: categoriaActual.descripcion,
      activo: categoriaActual.activo,
    },
    datosNuevos: {
      nombre: categoriaActualizada.nombre,
      descripcion: categoriaActualizada.descripcion,
      activo: categoriaActualizada.activo,
    },
    ip,
  });

  return categoriaActualizada;
}

export async function eliminarCategoria(id, usuarioId, ip) {
  const idNumero = validarId(id);
  const categoria = await obtenerCategoriaPorId(idNumero);

  if (!categoria) {
    throw new ErrorHttp(404, 'La categoría no existe.');
  }

  const productosAsociados = await contarProductos(idNumero);

  if (productosAsociados > 0) {
    throw new ErrorHttp(
      409,
      'No se puede eliminar una categoría que tiene productos asociados. Desactívala para conservar el historial.',
    );
  }

  try {
    await query('DELETE FROM categorias WHERE id = $1', [idNumero]);
  } catch (error) {
    if (error.code === '23503') {
      throw new ErrorHttp(
        409,
        'No se puede eliminar una categoría que tiene productos asociados. Desactívala para conservar el historial.',
      );
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'CATEGORIA_ELIMINADA',
    entidad: 'categorias',
    entidadId: String(idNumero),
    datosAnteriores: {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
      activo: categoria.activo,
    },
    ip,
  });

  return { id: idNumero, nombre: categoria.nombre };
}
