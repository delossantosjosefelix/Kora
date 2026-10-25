import { Router } from 'express';
import { listarRoles } from '../controllers/roles.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const rolesRouter = Router();

rolesRouter.get(
  '/',
  verificarAutenticacion,
  exigirPasswordActualizada,
  autorizarRoles('Administrador', 'Gerente'),
  listarRoles,
);
