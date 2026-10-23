import { Router } from 'express';
import {
  actualizarPassword,
  login,
  logout,
  me,
} from '../controllers/auth.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/me', verificarAutenticacion, me);
authRouter.post(
  '/cambiar-password',
  verificarAutenticacion,
  actualizarPassword,
);
