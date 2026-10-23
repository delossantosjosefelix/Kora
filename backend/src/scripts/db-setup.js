import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
const directorioBaseDatos = path.resolve(directorioActual, '../../../database');
const adminUsername = process.env.ADMIN_USERNAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD;

async function ejecutarSql(archivo) {
  const ruta = path.join(directorioBaseDatos, archivo);
  const sql = await fs.readFile(ruta, 'utf8');
  await pool.query(sql);
  console.log(`Ejecutado: ${archivo}`);
}

async function crearAdminInicial() {
  if (!adminUsername || !adminPassword) {
    throw new Error('Faltan ADMIN_USERNAME y ADMIN_PASSWORD en backend/.env');
  }

  if (adminPassword === 'cambia_esta_contrasena') {
    throw new Error('ADMIN_PASSWORD todavía tiene el valor de ejemplo.');
  }

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  }

  const { rowCount: existentes } = await pool.query(
    'SELECT 1 FROM usuarios WHERE username = $1',
    [adminUsername],
  );

  if (existentes > 0) {
    console.log(`Administrador existente: ${adminUsername}`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);
  const { rowCount } = await pool.query(
    `
      INSERT INTO usuarios (
        nombre,
        apellido,
        username,
        password_hash,
        rol_id,
        activo,
        debe_cambiar_password
      )
      SELECT 'Administrador', 'Kora', $1, $2, id, TRUE, TRUE
      FROM roles
      WHERE nombre = 'Administrador'
    `,
    [adminUsername, hash],
  );

  if (rowCount !== 1) {
    throw new Error('No se pudo crear el administrador: falta el rol Administrador.');
  }

  console.log(`Administrador creado: ${adminUsername}`);
}

try {
  await ejecutarSql('schema.sql');
  await ejecutarSql('seed.sql');
  await crearAdminInicial();

  const { rows: tablas } = await pool.query(`
    SELECT COUNT(*)::int AS total
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  const { rows: roles } = await pool.query('SELECT COUNT(*)::int AS total FROM roles');
  const { rows: metodos } = await pool.query('SELECT COUNT(*)::int AS total FROM metodos_pago');
  const { rows: admin } = await pool.query(
    'SELECT username, debe_cambiar_password FROM usuarios WHERE username = $1',
    [adminUsername],
  );

  console.log(`Tablas: ${tablas[0].total}`);
  console.log(`Roles: ${roles[0].total}`);
  console.log(`Métodos de pago: ${metodos[0].total}`);

  if (!admin[0]) {
    throw new Error('No se encontró el usuario administrador inicial.');
  }

  console.log(`Administrador: ${admin[0].username}`);
  console.log(`Cambio de contraseña obligatorio: ${admin[0].debe_cambiar_password}`);
} catch (error) {
  console.error('Error al preparar la base de datos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
