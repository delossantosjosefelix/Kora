import { query } from '../config/db.js';

export async function listarRoles(req, res, next) {
  try {
    const { rows } = await query(
      `
        SELECT id, nombre, descripcion
        FROM roles
        ORDER BY id
      `,
    );

    return res.status(200).json({
      ok: true,
      roles: rows,
    });
  } catch (error) {
    return next(error);
  }
}
