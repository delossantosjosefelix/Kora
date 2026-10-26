import { app } from './app.js';
import { pool, probarConexion } from './config/db.js';

const PUERTO = Number(process.env.PORT) || 3000;

const servidor = app.listen(PUERTO, '0.0.0.0', () => {
  console.log(`Kora API escuchando en http://localhost:${PUERTO}`);
  console.log(`Salud del sistema: http://localhost:${PUERTO}/api/health`);
});

probarConexion()
  .then(({ base_datos, hora }) => {
    console.log(`PostgreSQL conectado: ${base_datos}`);
    console.log(`Hora de la base de datos: ${hora.toISOString()}`);
  })
  .catch((error) => {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
    console.error('Revisa backend/.env y que la base de datos kora exista.');
  });

async function cerrar(senal) {
  console.log(`\n${senal} recibido. Cerrando Kora API...`);

  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => cerrar('SIGINT'));
process.on('SIGTERM', () => cerrar('SIGTERM'));

