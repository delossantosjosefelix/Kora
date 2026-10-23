import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth.js';
import { query } from '../config/db.js';

function extraerToken(req) {
  const tokenCookie = req.cookies?.[authConfig.cookieName];

  if (tokenCookie) {
    return tokenCookie;
  }

  const autorizacion = req.get('authorization');

  if (autorizacion?.startsWith('Bearer ')) {
    return autorizacion.slice(7).trim();
  }

  return null;
}

function responderNoAutorizado(res, mensaje) {
  return res.status(401).json({
    ok: false,
    mensaje,
  });
}

export async function verificarAutenticacion(req, res, next) {
  const token = extraerToken(req);

  if (!token) {
    return responderNoAutorizado(res, 'Sesión no iniciada.');
  }

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);

    if (!payload || typeof payload !== 'object' || !payload.sub) {
      return responderNoAutorizado(res, 'Sesión inválida. Inicia sesión nuevamente.');
    }

    const { rows } = await query(
      `
        SELECT
          u.id,
          u.nombre,
          u.apellido,
          u.username,
          u.activo,
          u.debe_cambiar_password,
          u.foto_url,
          r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r ON r.id = u.rol_id
        WHERE u.id = $1
      `,
      [payload.sub],
    );

    const usuario = rows[0];

    if (!usuario || !usuario.activo) {
      return responderNoAutorizado(res, 'Sesión inválida o usuario inactivo.');
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return responderNoAutorizado(res, 'La sesión expiró. Inicia sesión nuevamente.');
    }

    if (error.name === 'JsonWebTokenError') {
      return responderNoAutorizado(res, 'Sesión inválida. Inicia sesión nuevamente.');
    }

    return next(error);
  }
}

export function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return responderNoAutorizado(res, 'Sesión no iniciada.');
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permisos para realizar esta acción.',
      });
    }

    return next();
  };
}
