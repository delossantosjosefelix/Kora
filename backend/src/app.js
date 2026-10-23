import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

const origenesPermitidos = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origen) => origen.trim())
  : false;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: origenesPermitidos }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRouter);

app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    mensaje: 'Ruta no encontrada',
  });
});

app.use((error, req, res, _next) => {
  console.error('Error no controlado:', error);

  return res.status(500).json({
    ok: false,
    mensaje: 'Error interno del servidor',
  });
});
