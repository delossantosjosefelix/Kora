import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const SECRETO_EJEMPLO = 'cambia_este_secreto_largo_de_al_menos_32_caracteres';
const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === SECRETO_EJEMPLO) {
  throw new Error(
    'JWT_SECRET debe existir en backend/.env, no ser el valor de ejemplo y tener al menos 32 caracteres.',
  );
}

function duracionAMilisegundos(valor) {
  const coincidencia = /^(\d+)([smhd])$/i.exec(valor);

  if (!coincidencia) {
    throw new Error('JWT_EXPIRES_IN inválido. Usa un formato como 8h, 30m o 7d.');
  }

  const cantidad = Number(coincidencia[1]);
  const factores = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return cantidad * factores[coincidencia[2].toLowerCase()];
}

function enteroPositivo(valor, porDefecto) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : porDefecto;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN?.trim() || '8h';

export const authConfig = Object.freeze({
  jwtSecret,
  jwtExpiresIn,
  cookieName: process.env.AUTH_COOKIE_NAME?.trim() || 'kora_sesion',
  cookieMaxAgeMs: duracionAMilisegundos(jwtExpiresIn),
  maxIntentos: enteroPositivo(process.env.LOGIN_MAX_INTENTOS, 5),
  bloqueoMinutos: enteroPositivo(process.env.LOGIN_BLOQUEO_MINUTOS, 15),
  esProduccion: process.env.NODE_ENV === 'production',
});
