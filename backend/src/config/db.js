import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const { Pool } = pg;

const variablesRequeridas = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const variablesFaltantes = variablesRequeridas.filter((variable) => !process.env[variable]);

if (variablesFaltantes.length > 0) {
  throw new Error(
    `Configuración incompleta: faltan ${variablesFaltantes.join(', ')} en backend/.env`,
  );
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message);
});

export async function query(texto, parametros = []) {
  return pool.query(texto, parametros);
}

export async function probarConexion() {
  const { rows } = await pool.query(
    'SELECT NOW() AS hora, current_database() AS base_datos',
  );
  return rows[0];
}
