import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import { query } from '../config/db.js';
import { ErrorHttp } from '../utils/ErrorHttp.js';
import { registrarAuditoria } from './auditoria.service.js';

const CAMPOS_USUARIO = `
  u.id,
  u.nombre,
  u.apellido,
  u.username,
  u.activo,
  u.password_hash,
  u.intentos_fallidos,
  u.bloqueado_hasta,
  u.debe_cambiar_password,
  u.foto_url,
  u.ultimo_login,
  r.nombre AS rol
`;

function aUsuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    username: usuario.username,
    rol: usuario.rol,
    foto_url: usuario.foto_url,
    debe_cambiar_password: usuario.debe_cambiar_password,
    ultimo_login: usuario.ultimo_login,
  };
}

function estaBloqueado(usuario) {
  return Boolean(
    usuario.bloqueado_hasta &&
      new Date(usuario.bloqueado_hasta).getTime() > Date.now(),
  );
}

function mensajeBloqueo(bloqueadoHasta) {
  const minutosRestantes = Math.max(
    1,
    Math.ceil(
      (new Date(bloqueadoHasta).getTime() - Date.now()) / (60 * 1000),
    ),
  );

  return `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minuto(s).`;
}

async function buscarPorUsername(username) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_USUARIO}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(u.username) = LOWER($1)
    `,
    [username],
  );

  return rows[0] ?? null;
}

async function buscarPorId(id) {
  const { rows } = await query(
    `
      SELECT ${CAMPOS_USUARIO}
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.id = $1
    `,
    [id],
  );

  return rows[0] ?? null;
}

async function limpiarBloqueoExpirado(usuario) {
  if (
    !usuario.bloqueado_hasta ||
    new Date(usuario.bloqueado_hasta).getTime() > Date.now()
  ) {
    return;
  }

  await query(
    `
      UPDATE usuarios
      SET intentos_fallidos = 0,
          bloqueado_hasta = NULL
      WHERE id = $1
    `,
    [usuario.id],
  );

  usuario.intentos_fallidos = 0;
  usuario.bloqueado_hasta = null;
}

async function registrarIntentoFallido(usuarioId) {
  const { rows } = await query(
    `
      UPDATE usuarios
      SET intentos_fallidos = intentos_fallidos + 1,
          bloqueado_hasta = CASE
            WHEN intentos_fallidos + 1 >= $2
              THEN CURRENT_TIMESTAMP + ($3::int * INTERVAL '1 minute')
            ELSE bloqueado_hasta
          END
      WHERE id = $1
      RETURNING intentos_fallidos, bloqueado_hasta
    `,
    [usuarioId, authConfig.maxIntentos, authConfig.bloqueoMinutos],
  );

  return rows[0];
}

function crearToken(usuario) {
  return jwt.sign(
    {
      username: usuario.username,
      rol: usuario.rol,
    },
    authConfig.jwtSecret,
    {
      subject: usuario.id,
      expiresIn: authConfig.jwtExpiresIn,
    },
  );
}

export async function iniciarSesion({ username, password, ip }) {
  const nombreUsuario = typeof username === 'string' ? username.trim() : '';

  if (!nombreUsuario || typeof password !== 'string' || password.length === 0) {
    throw new ErrorHttp(400, 'Usuario y contraseña son obligatorios.');
  }

  const usuario = await buscarPorUsername(nombreUsuario);

  if (!usuario || !usuario.activo) {
    await registrarAuditoria({
      usuarioId: usuario?.id ?? null,
      accion: 'LOGIN_FALLIDO',
      entidad: 'usuarios',
      entidadId: usuario?.id ?? null,
      datosNuevos: {
        username: nombreUsuario,
        motivo: usuario ? 'INACTIVO' : 'NO_ENCONTRADO',
      },
      ip,
    });

    throw new ErrorHttp(401, 'Usuario o contraseña incorrectos.');
  }

  if (estaBloqueado(usuario)) {
    await registrarAuditoria({
      usuarioId: usuario.id,
      accion: 'LOGIN_FALLIDO',
      entidad: 'usuarios',
      entidadId: usuario.id,
      datosNuevos: { username: usuario.username, motivo: 'BLOQUEADO' },
      ip,
    });

    throw new ErrorHttp(423, mensajeBloqueo(usuario.bloqueado_hasta));
  }

  await limpiarBloqueoExpirado(usuario);

  const coincide = await bcrypt.compare(password, usuario.password_hash);

  if (!coincide) {
    const resultado = await registrarIntentoFallido(usuario.id);

    await registrarAuditoria({
      usuarioId: usuario.id,
      accion: 'LOGIN_FALLIDO',
      entidad: 'usuarios',
      entidadId: usuario.id,
      datosNuevos: {
        username: usuario.username,
        intentos: resultado?.intentos_fallidos ?? null,
      },
      ip,
    });

    if (resultado?.bloqueado_hasta) {
      throw new ErrorHttp(423, mensajeBloqueo(resultado.bloqueado_hasta));
    }

    throw new ErrorHttp(401, 'Usuario o contraseña incorrectos.');
  }

  const { rows: sesion } = await query(
    `
      UPDATE usuarios
      SET intentos_fallidos = 0,
          bloqueado_hasta = NULL,
          ultimo_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING ultimo_login
    `,
    [usuario.id],
  );

  usuario.ultimo_login = sesion[0]?.ultimo_login ?? usuario.ultimo_login;

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'LOGIN_EXITOSO',
    entidad: 'usuarios',
    entidadId: usuario.id,
    datosNuevos: {
      rol: usuario.rol,
      debe_cambiar_password: usuario.debe_cambiar_password,
    },
    ip,
  });

  return {
    token: crearToken(usuario),
    usuario: aUsuarioPublico(usuario),
  };
}

export async function cambiarPassword({
  usuarioId,
  passwordActual,
  passwordNueva,
  confirmarPassword,
  ip,
}) {
  if (
    typeof passwordActual !== 'string' ||
    typeof passwordNueva !== 'string' ||
    typeof confirmarPassword !== 'string' ||
    !passwordActual ||
    !passwordNueva
  ) {
    throw new ErrorHttp(400, 'La contraseña actual y la nueva son obligatorias.');
  }

  if (passwordNueva.length < 8) {
    throw new ErrorHttp(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
  }

  if (passwordNueva !== confirmarPassword) {
    throw new ErrorHttp(400, 'La nueva contraseña y su confirmación no coinciden.');
  }

  if (passwordNueva === passwordActual) {
    throw new ErrorHttp(400, 'La nueva contraseña debe ser diferente a la actual.');
  }

  const usuario = await buscarPorId(usuarioId);

  if (!usuario || !usuario.activo) {
    throw new ErrorHttp(401, 'Sesión inválida o usuario inactivo.');
  }

  const coincide = await bcrypt.compare(passwordActual, usuario.password_hash);

  if (!coincide) {
    await registrarAuditoria({
      usuarioId: usuario.id,
      accion: 'CAMBIO_PASSWORD_FALLIDO',
      entidad: 'usuarios',
      entidadId: usuario.id,
      ip,
    });

    throw new ErrorHttp(400, 'La contraseña actual no es correcta.');
  }

  const nuevoHash = await bcrypt.hash(passwordNueva, 12);

  await query(
    `
      UPDATE usuarios
      SET password_hash = $1,
          debe_cambiar_password = FALSE,
          intentos_fallidos = 0,
          bloqueado_hasta = NULL
      WHERE id = $2
    `,
    [nuevoHash, usuario.id],
  );

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'CAMBIO_PASSWORD',
    entidad: 'usuarios',
    entidadId: usuario.id,
    datosNuevos: { debe_cambiar_password: false },
    ip,
  });

  return { mensaje: 'Contraseña actualizada correctamente.' };
}
