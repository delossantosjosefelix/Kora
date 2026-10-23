import { query } from '../config/db.js';

export async function registrarAuditoria({
  usuarioId = null,
  accion,
  entidad = null,
  entidadId = null,
  datosAnteriores = null,
  datosNuevos = null,
  ip = null,
} = {}) {
  try {
    await query(
      `
        INSERT INTO auditoria (
          usuario_id,
          accion,
          entidad,
          entidad_id,
          datos_anteriores,
          datos_nuevos,
          ip
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        usuarioId,
        accion,
        entidad,
        entidadId,
        datosAnteriores,
        datosNuevos,
        ip,
      ],
    );
  } catch (error) {
    console.error('No se pudo registrar la auditoría:', error.message);
  }
}
