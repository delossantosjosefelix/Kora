import { authConfig } from '../config/auth.js';
import {
  cambiarPassword,
  iniciarSesion,
} from '../services/auth.service.js';

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: authConfig.esProduccion,
    maxAge: authConfig.cookieMaxAgeMs,
    path: '/',
  };
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body ?? {};
    const { token, usuario } = await iniciarSesion({
      username,
      password,
      ip: req.ip,
    });

    res.cookie(authConfig.cookieName, token, opcionesCookie());
    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      ok: true,
      mensaje: 'Sesión iniciada.',
      usuario,
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res) {
  res.clearCookie(authConfig.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: authConfig.esProduccion,
    path: '/',
  });

  return res.status(200).json({
    ok: true,
    mensaje: 'Sesión cerrada.',
  });
}

export function me(req, res) {
  res.set('Cache-Control', 'no-store');

  return res.status(200).json({
    ok: true,
    usuario: req.usuario,
  });
}

export async function actualizarPassword(req, res, next) {
  try {
    const { passwordActual, passwordNueva, confirmarPassword } = req.body ?? {};
    const resultado = await cambiarPassword({
      usuarioId: req.usuario.id,
      passwordActual,
      passwordNueva,
      confirmarPassword,
      ip: req.ip,
    });

    return res.status(200).json({
      ok: true,
      ...resultado,
    });
  } catch (error) {
    return next(error);
  }
}
