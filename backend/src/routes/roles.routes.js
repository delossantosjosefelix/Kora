import { Router } from 'express';
import { listarRoles } from '../controllers/roles.controller.js';
import {
  autorizarRoles,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const rolesRouter = Router();

rolesRouter.get(
  '/',
  verificarAutenticacion,
  autorizarRoles('Administrador'),
  listarRoles,
);
