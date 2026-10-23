import { probarConexion } from '../config/db.js';

export async function health(req, res) {
  try {
    const { hora, base_datos } = await probarConexion();

    return res.status(200).json({
      ok: true,
      servicio: 'Kora API',
      mensaje: 'API conectada',
      baseDatos: base_datos,
      horaBaseDatos: hora,
    });
  } catch (error) {
    console.error('Health check falló:', error.message);

    return res.status(503).json({
      ok: false,
      servicio: 'Kora API',
      mensaje: 'No se pudo conectar con PostgreSQL',
      error:
        'Verifica que PostgreSQL esté encendido y que las credenciales de backend/.env sean correctas.',
    });
  }
}
