import { query } from '../config/db.js';

export async function listarRoles(req, res, next) {
  try {
    const rolFiltrado = req.usuario?.rol === 'Gerente' ? 'Cajero' : null;

    const { rows } = await query(
      `
        SELECT id, nombre, descripcion
        FROM roles
        WHERE ($1::text IS NULL OR nombre = $1)
        ORDER BY id
      `,
      [rolFiltrado],
    );

    return res.status(200).json({
      ok: true,
      roles: rows,
    });
  } catch (error) {
    return next(error);
  }
}
