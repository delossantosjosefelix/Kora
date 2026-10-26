import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth.routes.js';
import { categoriaRouter } from './routes/categoria.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { rolesRouter } from './routes/roles.routes.js';
import { unidadRouter } from './routes/unidad.routes.js';
import { usuarioRouter } from './routes/usuario.routes.js';
import { ErrorHttp } from './utils/ErrorHttp.js';

export const app = express();

const origenesPermitidos = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origen) => origen.trim())
  : false;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: origenesPermitidos, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categorias', categoriaRouter);
app.use('/api/unidades', unidadRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/usuarios', usuarioRouter);

app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    mensaje: 'Ruta no encontrada',
  });
});

app.use((error, req, res, _next) => {
  if (error instanceof ErrorHttp) {
    return res.status(error.status).json({
      ok: false,
      mensaje: error.message,
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      mensaje: 'El cuerpo de la solicitud no contiene un JSON válido.',
    });
  }

  console.error('Error no controlado:', error);

  return res.status(500).json({
    ok: false,
    mensaje: 'Error interno del servidor',
  });
});
