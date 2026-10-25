import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

const CAMPOS_PUBLICOS = `
  u.id,
  u.nombre,
  u.apellido,
  u.username,
  u.activo,
  u.debe_cambiar_password,
  u.foto_url,
  u.ultimo_login,
  u.created_at,
  r.id AS rol_id,
  r.nombre AS rol
`;

const CAMPOS_CON_HASH = `
  ${CAMPOS_PUBLICOS},
  u.password_hash
`;

const adminUsername = (process.env.ADMIN_USERNAME?.trim() || 'admin').toLowerCase();

export function esUsuarioSistema(username) {
  return typeof username === 'string' && username.trim().toLowerCase() === adminUsername;
}

function aUsuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    username: usuario.username,
    rol_id: usuario.rol_id,
    rol: usuario.rol,
    activo: usuario.activo,
    debe_cambiar_password: usuario.debe_cambiar_password,
    foto_url: usuario.foto_url,
    ultimo_login: usuario.ultimo_login,
    created_at: usuario.created_at,
    es_sistema: esUsuarioSistema(usuario.username),
  };
}

async function obtenerRolPorId(rolId) {
  const { rows } = await query('SELECT id, nombre FROM roles WHERE id = $1', [rolId]);
  return rows[0] ?? null;
}

function esGerente(rolSolicitante) {
  return rolSolicitante === 'Gerente';
}

function validarAlcanceGerente(rolSolicitante, rolObjetivo) {
  if (esGerente(rolSolicitante) && rolObjetivo !== 'Cajero') {
    throw new ErrorHttp(403, 'Como gerente solo puedes administrar usuarios cajeros.');
  }
}

async function usernameExiste(username, excluirId = null) {
  const { rows } = excluirId
    ? await query(
        'SELECT 1 FROM usuarios WHERE LOWER(username) = LOWER($1) AND id <> $2',
        [username, excluirId]
      )
    : await query('SELECT 1 FROM usuarios WHERE LOWER(username) = LOWER($1)', [username]);
  return rows.length > 0;
}

async function buscarUsuarioConHashPorId(id) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_CON_HASH}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function listarUsuarios({ rolSolicitante } = {}) {
  const filtroRol = esGerente(rolSolicitante) ? 'Cajero' : null;

  const { rows } = await query(
    `
      SELECT ${CAMPOS_PUBLICOS}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE ($1::text IS NULL OR r.nombre = $1)
      ORDER BY u.created_at DESC
    `,
    [filtroRol]
  );
  return rows.map(aUsuarioPublico);
}

export async function obtenerUsuarioPorId(id, { rolSolicitante } = {}) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_PUBLICOS}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1
    `,
    [id]
  );

  if (!rows[0]) {
    return null;
  }

  const usuario = aUsuarioPublico(rows[0]);
  validarAlcanceGerente(rolSolicitante, usuario.rol);
  return usuario;
}

export async function crearUsuario({
  nombre,
  apellido,
  username,
  password,
  rolId,
  creadoPor,
  ip,
  rolSolicitante,
}) {
  if (
    typeof nombre !== 'string' ||
    typeof apellido !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !nombre.trim() ||
    !apellido.trim() ||
    !username.trim() ||
    !password.trim()
  ) {
    throw new ErrorHttp(400, 'Nombre, apellido, nombre de usuario y contraseña son obligatorios.');
  }

  if (password.trim().length < 8) {
    throw new ErrorHttp(400, 'La contraseña debe tener al menos 8 caracteres.');
  }

  const rol_id = Number(rolId);
  const rol = Number.isInteger(rol_id) ? await obtenerRolPorId(rol_id) : null;

  if (!rol) {
    throw new ErrorHttp(400, 'Debe seleccionar un rol válido.');
  }

  validarAlcanceGerente(rolSolicitante, rol.nombre);

  if (await usernameExiste(username.trim())) {
    throw new ErrorHttp(400, 'Ya existe un usuario con ese nombre de usuario.');
  }

  const passwordHash = await bcrypt.hash(password.trim(), 12);

  let rows;

  try {
    ({ rows } = await query(
      `
        INSERT INTO usuarios (
          nombre,
          apellido,
          username,
          password_hash,
          rol_id,
          activo,
          creado_por,
          debe_cambiar_password
        )
        VALUES ($1, $2, $3, $4, $5, TRUE, $6, TRUE)
        RETURNING id
      `,
      [nombre.trim(), apellido.trim(), username.trim(), passwordHash, rol_id, creadoPor]
    ));
  } catch (error) {
    if (error.code === '23505') {
      throw new ErrorHttp(400, 'Ya existe un usuario con ese nombre de usuario.');
    }

    throw error;
  }

  const usuario = await obtenerUsuarioPorId(rows[0].id, { rolSolicitante });
  if (!usuario) {
    throw new ErrorHttp(500, 'No se pudo recuperar el usuario creado.');
  }

  await registrarAuditoria({
    usuarioId: creadoPor,
    accion: 'USUARIO_CREADO',
    entidad: 'usuarios',
    entidadId: usuario.id,
    datosNuevos: {
      username: usuario.username,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
    },
    ip,
  });

  return usuario;
}

export async function actualizarUsuario(
  id,
  cambios,
  usuarioAutenticadoId,
  ip,
  rolSolicitante,
) {
  const {
    nombre,
    apellido,
    username,
    rolId,
    activo,
    password
  } = cambios ?? {};

  const usuario = await buscarUsuarioConHashPorId(id);
  if (!usuario) {
    throw new ErrorHttp(404, 'Usuario no encontrado.');
  }

  validarAlcanceGerente(rolSolicitante, usuario.rol);

  const esSistema = esUsuarioSistema(usuario.username);

  if (esSistema) {
    if (typeof activo === 'boolean' && !activo) {
      throw new ErrorHttp(400, 'La cuenta de seguridad del sistema no se puede desactivar.');
    }
    if (typeof rolId !== 'undefined') {
      const nuevoRol = await obtenerRolPorId(Number(rolId));
      if (nuevoRol?.nombre !== 'Administrador') {
        throw new ErrorHttp(400, 'El rol de la cuenta de seguridad del sistema debe permanecer como Administrador.');
      }
    }
    if (typeof username === 'string' && username.trim().toLowerCase() !== adminUsername) {
      throw new ErrorHttp(400, 'El nombre de usuario de la cuenta de seguridad del sistema no se puede modificar.');
    }
  }

  if (id === usuarioAutenticadoId && activo === false) {
    throw new ErrorHttp(400, 'No puedes desactivar tu propio usuario.');
  }

  const sets = [];
  const valores = [];
  let posicion = 1;

  if (typeof nombre === 'string' && nombre.trim()) {
    sets.push(`nombre = $${posicion++}`);
    valores.push(nombre.trim());
  }

  if (typeof apellido === 'string' && apellido.trim()) {
    sets.push(`apellido = $${posicion++}`);
    valores.push(apellido.trim());
  }

  if (typeof username === 'string' && username.trim()) {
    if (await usernameExiste(username.trim(), id)) {
      throw new ErrorHttp(400, 'Ya existe un usuario con ese nombre de usuario.');
    }
    sets.push(`username = $${posicion++}`);
    valores.push(username.trim());
  }

  if (typeof rolId !== 'undefined') {
    const rol_id = Number(rolId);
    const rol = Number.isInteger(rol_id) ? await obtenerRolPorId(rol_id) : null;

    if (!rol) {
      throw new ErrorHttp(400, 'Debe seleccionar un rol válido.');
    }

    validarAlcanceGerente(rolSolicitante, rol.nombre);

    sets.push(`rol_id = $${posicion++}`);
    valores.push(rol_id);
  }

  if (typeof activo === 'boolean') {
    sets.push(`activo = $${posicion++}`);
    valores.push(activo);
  }

  if (typeof password === 'string' && password.trim()) {
    if (password.trim().length < 8) {
      throw new ErrorHttp(400, 'La contraseña debe tener al menos 8 caracteres.');
    }

    sets.push(`password_hash = $${posicion++}`);
    valores.push(await bcrypt.hash(password.trim(), 12));

    // Si un administrador o gerente restablece la contraseña de otra persona,
    // esa persona deberá cambiarla en su próximo inicio de sesión.
    sets.push(`debe_cambiar_password = $${posicion++}`);
    valores.push(id !== usuarioAutenticadoId);
  }

  if (sets.length === 0) {
    throw new ErrorHttp(400, 'No hay campos para actualizar.');
  }

  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  valores.push(id);

  await query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${posicion}`, valores);

  const actualizado = await obtenerUsuarioPorId(id, { rolSolicitante });

  if (!actualizado) {
    throw new ErrorHttp(500, 'No se pudo recuperar el usuario actualizado.');
  }

  await registrarAuditoria({
    usuarioId: usuarioAutenticadoId,
    accion: 'USUARIO_ACTUALIZADO',
    entidad: 'usuarios',
    entidadId: id,
    datosAnteriores: {
      username: usuario.username,
      rol: usuario.rol,
      activo: usuario.activo,
      debe_cambiar_password: usuario.debe_cambiar_password,
    },
    datosNuevos: {
      username: actualizado.username,
      rol: actualizado.rol,
      activo: actualizado.activo,
      debe_cambiar_password: actualizado.debe_cambiar_password,
    },
    ip,
  });

  return actualizado;
}

export async function eliminarUsuario(id, usuarioAutenticadoId, ip, rolSolicitante) {
  const usuario = await buscarUsuarioConHashPorId(id);
  if (!usuario) {
    throw new ErrorHttp(404, 'Usuario no encontrado.');
  }

  validarAlcanceGerente(rolSolicitante, usuario.rol);

  if (esUsuarioSistema(usuario.username)) {
    throw new ErrorHttp(400, 'La cuenta de seguridad del sistema no se puede eliminar.');
  }

  if (id === usuarioAutenticadoId) {
    throw new ErrorHttp(400, 'No puedes eliminar tu propia cuenta.');
  }

  // Comprobar si tiene registros historicos o financieros en el sistema
  const { rows: conteos } = await query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM ventas WHERE usuario_id = $1) AS ventas_count,
        (SELECT COUNT(*)::int FROM turnos_caja WHERE usuario_id = $1) AS turnos_count,
        (SELECT COUNT(*)::int FROM movimientos_caja WHERE usuario_id = $1) AS movimientos_caja_count,
        (SELECT COUNT(*)::int FROM movimientos_inventario WHERE usuario_id = $1) AS inventario_count,
        (SELECT COUNT(*)::int FROM historial_precios WHERE usuario_id = $1) AS precios_count,
        (SELECT COUNT(*)::int FROM gastos WHERE usuario_id = $1) AS gastos_count,
        (SELECT COUNT(*)::int FROM devoluciones WHERE usuario_id = $1 OR autorizado_por = $1) AS devoluciones_count,
        (SELECT COUNT(*)::int FROM ventas WHERE anulada_por = $1) AS anulaciones_count
    `,
    [id]
  );

  const row = conteos[0] || {};
  const totalActividad =
    (row.ventas_count || 0) +
    (row.turnos_count || 0) +
    (row.movimientos_caja_count || 0) +
    (row.inventario_count || 0) +
    (row.precios_count || 0) +
    (row.gastos_count || 0) +
    (row.devoluciones_count || 0) +
    (row.anulaciones_count || 0);

  if (totalActividad > 0) {
    throw new ErrorHttp(
      409,
      'Este usuario tiene registros históricos de ventas o movimientos de caja en el sistema y no se puede eliminar. Desactívalo para revocar su acceso sin alterar la contabilidad.',
    );
  }

  // Desvincular referencias secundarias en auditoria o usuarios antes de borrar
  await query('UPDATE usuarios SET creado_por = NULL WHERE creado_por = $1', [id]);
  await query('UPDATE auditoria SET usuario_id = NULL WHERE usuario_id = $1', [id]);

  await query('DELETE FROM usuarios WHERE id = $1', [id]);

  await registrarAuditoria({
    usuarioId: usuarioAutenticadoId,
    accion: 'USUARIO_ELIMINADO',
    entidad: 'usuarios',
    entidadId: id,
    datosAnteriores: {
      username: usuario.username,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
    },
    ip,
  });

  return { id, username: usuario.username };
}
