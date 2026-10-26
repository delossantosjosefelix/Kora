import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const adminUsername = process.env.ADMIN_USERNAME?.trim();
const nuevaPassword = process.env.NUEVA_PASSWORD_ADMIN;

try {
  if (!adminUsername) {
    throw new Error('Falta ADMIN_USERNAME en backend/.env');
  }

  if (!nuevaPassword) {
    throw new Error('Define la variable NUEVA_PASSWORD_ADMIN con la nueva contrasena.');
  }

  if (nuevaPassword === 'cambia_esta_contrasena') {
    throw new Error('La nueva contrasena no puede ser el valor de ejemplo.');
  }

  if (nuevaPassword.length < 8) {
    throw new Error('La nueva contrasena debe tener al menos 8 caracteres.');
  }

  const hash = await bcrypt.hash(nuevaPassword, 12);
  const { rowCount } = await pool.query(
    `
      UPDATE usuarios
      SET password_hash = $1,
          debe_cambiar_password = TRUE,
          activo = TRUE,
          intentos_fallidos = 0,
          bloqueado_hasta = NULL
      WHERE username = $2
        AND rol_id = (SELECT id FROM roles WHERE nombre = 'Administrador')
    `,
    [hash, adminUsername],
  );

  if (rowCount !== 1) {
    throw new Error(`No se encontro un administrador con usuario "${adminUsername}".`);
  }

  console.log(`Contrasena restablecida para ${adminUsername}.`);
  console.log('Al iniciar sesion se pedira cambiarla.');
} catch (error) {
  console.error('Error al restablecer la contrasena:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
