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
  };
}

async function rolExiste(rolId) {
  const { rows } = await query('SELECT 1 FROM roles WHERE id = $1', [rolId]);
  return rows.length > 0;
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

export async function listarUsuarios() {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_PUBLICOS}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      ORDER BY u.created_at DESC
    `
  );
  return rows.map(aUsuarioPublico);
}

export async function obtenerUsuarioPorId(id) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_PUBLICOS}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1
    `,
    [id]
  );
  return rows[0] ? aUsuarioPublico(rows[0]) : null;
}

export async function crearUsuario({ nombre, apellido, username, password, rolId, creadoPor, ip }) {
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
  if (!Number.isInteger(rol_id) || !(await rolExiste(rol_id))) {
    throw new ErrorHttp(400, 'Debe seleccionar un rol válido.');
  }

  if (await usernameExiste(username.trim())) {
    throw new ErrorHttp(400, 'Ya existe un usuario con ese nombre de usuario.');
  }

  const passwordHash = await bcrypt.hash(password.trim(), 12);
  const { rows } = await query(
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
      VALUES ($1, $2, $3, $4, $5, TRUE, $6, FALSE)
      RETURNING id
    `,
    [nombre.trim(), apellido.trim(), username.trim(), passwordHash, rol_id, creadoPor]
  );

  const usuario = await obtenerUsuarioPorId(rows[0].id);
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

export async function actualizarUsuario(id, cambios, usuarioAutenticadoId, ip) {
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
    if (!Number.isInteger(rol_id) || !(await rolExiste(rol_id))) {
      throw new ErrorHttp(400, 'Debe seleccionar un rol válido.');
    }
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
  }

  if (sets.length === 0) {
    throw new ErrorHttp(400, 'No hay campos para actualizar.');
  }

  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  valores.push(id);

  await query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${posicion}`, valores);

  const actualizado = await obtenerUsuarioPorId(id);

  await registrarAuditoria({
    usuarioId: usuarioAutenticadoId,
    accion: 'USUARIO_ACTUALIZADO',
    entidad: 'usuarios',
    entidadId: id,
    datosAnteriores: {
      username: usuario.username,
      rol: usuario.rol,
      activo: usuario.activo,
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
