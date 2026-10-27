import { pool } from '../config/db.js';

/**
 * Genera el siguiente codigo secuencial para una entidad.
 * Garantiza prevencion estricta de condiciones de carrera (race conditions)
 * mediante un candado consultivo a nivel de transaccion (pg_advisory_xact_lock).
 * 
 * Funciona de forma transparente con Soft Delete: como los registros inactivos
 * o eliminados logicamente permanecen en la tabla, MAX() siempre considera el
 * historial completo, impidiendo la reasignacion de codigos previamente utilizados.
 *
 * @param {import('pg').PoolClient} client - Cliente en transaccion activa.
 * @param {object} opciones
 * @param {string} opciones.tabla - Nombre de la tabla en base de datos.
 * @param {string} [opciones.columna='codigo'] - Nombre de la columna de codigo.
 * @param {string} opciones.prefijo - Prefijo dinamico (ej. 'PROD-', 'SUP-', 'USR-').
 * @param {number} [opciones.longitud=4] - Cantidad de digitos numericos rellenados con cero.
 * @returns {Promise<string>} Nuevo codigo generado (ej. 'PROD-0001').
 */
export async function generarSiguienteCodigo(
  client,
  { tabla, columna = 'codigo', prefijo, longitud = 4 },
) {
  if (!client) {
    throw new Error('Se requiere un cliente de base de datos en transaccion activa.');
  }

  if (!tabla || !prefijo) {
    throw new Error('La tabla y el prefijo son obligatorios para generar la secuencia.');
  }

  // 1. Candado consultivo a nivel de transaccion:
  // Serializa la generacion de codigos para este prefijo y tabla especificos.
  // Se libera automaticamente cuando la transaccion finaliza (COMMIT o ROLLBACK).
  const claveCandado = `${tabla}_${columna}_${prefijo}`;
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [claveCandado]);

  // 2. Consulta del ultimo numero generado ignorando si esta activo o inactivo (Soft Delete)
  // Se valida que la parte posterior al prefijo contenga exclusivamente digitos.
  const querySql = `
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(${columna} FROM LENGTH($1) + 1) AS INTEGER
        )
      ),
      0
    ) AS ultimo_numero
    FROM ${tabla}
    WHERE ${columna} LIKE $1 || '%'
      AND SUBSTRING(${columna} FROM LENGTH($1) + 1) ~ '^[0-9]+$'
  `;

  const { rows } = await client.query(querySql, [prefijo]);
  const ultimoNumero = Number(rows[0]?.ultimo_numero || 0);
  const siguienteNumero = ultimoNumero + 1;

  // 3. Formateo con ceros a la izquierda
  const secuenciaRellena = String(siguienteNumero).padStart(longitud, '0');
  return `${prefijo}${secuenciaRellena}`;
}

/**
 * Consulta de solo lectura para previsualizar el proximo codigo disponible
 * sin mantener candados transaccionales (ideal para sugerencias en la interfaz).
 *
 * @param {object} opciones
 * @param {string} opciones.tabla - Nombre de la tabla en base de datos.
 * @param {string} [opciones.columna='codigo'] - Nombre de la columna.
 * @param {string} opciones.prefijo - Prefijo dinamico (ej. 'PROD-').
 * @param {number} [opciones.longitud=4] - Longitud del padding numerico.
 * @returns {Promise<string>} Codigo sugerido.
 */
export async function previsualizarSiguienteCodigo({
  tabla,
  columna = 'codigo',
  prefijo,
  longitud = 4,
}) {
  const querySql = `
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(${columna} FROM LENGTH($1) + 1) AS INTEGER
        )
      ),
      0
    ) AS ultimo_numero
    FROM ${tabla}
    WHERE ${columna} LIKE $1 || '%'
      AND SUBSTRING(${columna} FROM LENGTH($1) + 1) ~ '^[0-9]+$'
  `;

  const { rows } = await pool.query(querySql, [prefijo]);
  const ultimoNumero = Number(rows[0]?.ultimo_numero || 0);
  const siguienteNumero = ultimoNumero + 1;

  const secuenciaRellena = String(siguienteNumero).padStart(longitud, '0');
  return `${prefijo}${secuenciaRellena}`;
}
