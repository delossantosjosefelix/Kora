import { query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

const CAMPOS = 'id, nombre, abreviatura, activo';

function validarId(id) {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErrorHttp(400, 'El identificador de la unidad no es válido.');
  }

  return numero;
}

function validarNombre(nombre) {
  if (typeof nombre !== 'string' || !nombre.trim()) {
    throw new ErrorHttp(400, 'El nombre de la unidad es obligatorio.');
  }

  const nombreLimpio = nombre.trim();

  if (nombreLimpio.length > 30) {
    throw new ErrorHttp(
      400,
      'El nombre de la unidad no puede superar los 30 caracteres.',
    );
  }

  return nombreLimpio;
}

function validarAbreviatura(abreviatura) {
  if (typeof abreviatura !== 'string' || !abreviatura.trim()) {
    throw new ErrorHttp(400, 'La abreviatura de la unidad es obligatoria.');
  }

  const abreviaturaLimpia = abreviatura.trim();

  if (abreviaturaLimpia.length > 10) {
    throw new ErrorHttp(
      400,
      'La abreviatura no puede superar los 10 caracteres.',
    );
  }

  return abreviaturaLimpia;
}

async function nombreExiste(nombre, excluirId = null) {
  const { rows } = excluirId
    ? await query(
        'SELECT 1 FROM unidades_medida WHERE LOWER(nombre) = LOWER($1) AND id <> $2',
        [nombre, excluirId],
      )
    : await query(
        'SELECT 1 FROM unidades_medida WHERE LOWER(nombre) = LOWER($1)',
        [nombre],
      );

  return rows.length > 0;
}

async function abreviaturaExiste(abreviatura, excluirId = null) {
  const { rows } = excluirId
    ? await query(
        'SELECT 1 FROM unidades_medida WHERE LOWER(abreviatura) = LOWER($1) AND id <> $2',
        [abreviatura, excluirId],
      )
    : await query(
        'SELECT 1 FROM unidades_medida WHERE LOWER(abreviatura) = LOWER($1)',
        [abreviatura],
      );

  return rows.length > 0;
}

async function contarProductos(unidadId, soloActivos = false) {
  const { rows } = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM productos
      WHERE unidad_id = $1
        AND ($2::boolean = FALSE OR activo = TRUE)
    `,
    [unidadId, soloActivos],
  );

  return rows[0]?.total ?? 0;
}

export async function listarUnidades({ incluirInactivas = false } = {}) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS}
      FROM unidades_medida
      WHERE ($1::boolean = TRUE OR activo = TRUE)
      ORDER BY activo DESC, LOWER(nombre) ASC
    `,
    [Boolean(incluirInactivas)],
  );

  return rows;
}

export async function obtenerUnidadPorId(id) {
  const idNumero = validarId(id);

  const { rows } = await query(
    `SELECT ${CAMPOS} FROM unidades_medida WHERE id = $1`,
    [idNumero],
  );

  return rows[0] ?? null;
}

export async function crearUnidad({
  nombre,
  abreviatura,
  usuarioId,
  ip,
}) {
  const nombreLimpio = validarNombre(nombre);
  const abreviaturaLimpia = validarAbreviatura(abreviatura);

  if (await nombreExiste(nombreLimpio)) {
    throw new ErrorHttp(400, 'Ya existe una unidad con ese nombre.');
  }

  if (await abreviaturaExiste(abreviaturaLimpia)) {
    throw new ErrorHttp(400, 'Ya existe una unidad con esa abreviatura.');
  }

  let unidad;

  try {
    const { rows } = await query(
      `
        INSERT INTO unidades_medida (nombre, abreviatura)
        VALUES ($1, $2)
        RETURNING ${CAMPOS}
      `,
      [nombreLimpio, abreviaturaLimpia],
    );

    unidad = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ErrorHttp(
        400,
        'Ya existe una unidad con ese nombre o abreviatura.',
      );
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'UNIDAD_CREADA',
    entidad: 'unidades_medida',
    entidadId: String(unidad.id),
    datosNuevos: {
      nombre: unidad.nombre,
      abreviatura: unidad.abreviatura,
    },
    ip,
  });

  return unidad;
}

export async function actualizarUnidad(
  id,
  { nombre, abreviatura, activo },
  usuarioId,
  ip,
) {
  const idNumero = validarId(id);
  const unidadActual = await obtenerUnidadPorId(idNumero);

  if (!unidadActual) {
    throw new ErrorHttp(404, 'La unidad no existe.');
  }

  const sets = [];
  const valores = [];
  let posicion = 1;

  if (nombre !== undefined) {
    const nombreLimpio = validarNombre(nombre);

    if (await nombreExiste(nombreLimpio, idNumero)) {
      throw new ErrorHttp(400, 'Ya existe una unidad con ese nombre.');
    }

    sets.push(`nombre = $${posicion++}`);
    valores.push(nombreLimpio);
  }

  if (abreviatura !== undefined) {
    const abreviaturaLimpia = validarAbreviatura(abreviatura);

    if (await abreviaturaExiste(abreviaturaLimpia, idNumero)) {
      throw new ErrorHttp(400, 'Ya existe una unidad con esa abreviatura.');
    }

    sets.push(`abreviatura = $${posicion++}`);
    valores.push(abreviaturaLimpia);
  }

  if (activo !== undefined) {
    if (typeof activo !== 'boolean') {
      throw new ErrorHttp(400, 'El estado de la unidad no es válido.');
    }

    if (activo === false && unidadActual.activo) {
      const productosActivos = await contarProductos(idNumero, true);

      if (productosActivos > 0) {
        throw new ErrorHttp(
          409,
          'No se puede desactivar una unidad que tiene productos activos. Cambia o desactiva esos productos primero.',
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

  let unidadActualizada;

  try {
    const { rows } = await query(
      `
        UPDATE unidades_medida
        SET ${sets.join(', ')}
        WHERE id = $${posicion}
        RETURNING ${CAMPOS}
      `,
      valores,
    );

    unidadActualizada = rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ErrorHttp(
        400,
        'Ya existe una unidad con ese nombre o abreviatura.',
      );
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'UNIDAD_ACTUALIZADA',
    entidad: 'unidades_medida',
    entidadId: String(idNumero),
    datosAnteriores: {
      nombre: unidadActual.nombre,
      abreviatura: unidadActual.abreviatura,
      activo: unidadActual.activo,
    },
    datosNuevos: {
      nombre: unidadActualizada.nombre,
      abreviatura: unidadActualizada.abreviatura,
      activo: unidadActualizada.activo,
    },
    ip,
  });

  return unidadActualizada;
}

export async function eliminarUnidad(id, usuarioId, ip) {
  const idNumero = validarId(id);
  const unidad = await obtenerUnidadPorId(idNumero);

  if (!unidad) {
    throw new ErrorHttp(404, 'La unidad no existe.');
  }

  const productosAsociados = await contarProductos(idNumero);

  if (productosAsociados > 0) {
    throw new ErrorHttp(
      409,
      'No se puede eliminar una unidad que tiene productos asociados. Desactívala para conservar el historial.',
    );
  }

  try {
    await query('DELETE FROM unidades_medida WHERE id = $1', [idNumero]);
  } catch (error) {
    if (error.code === '23503') {
      throw new ErrorHttp(
        409,
        'No se puede eliminar una unidad que tiene productos asociados. Desactívala para conservar el historial.',
      );
    }

    throw error;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'UNIDAD_ELIMINADA',
    entidad: 'unidades_medida',
    entidadId: String(idNumero),
    datosAnteriores: {
      nombre: unidad.nombre,
      abreviatura: unidad.abreviatura,
      activo: unidad.activo,
    },
    ip,
  });

  return { id: idNumero, nombre: unidad.nombre };
}
