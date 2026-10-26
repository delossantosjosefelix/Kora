import { Router } from 'express';
import {
  listarExistencias,
  listarMovimientos,
  obtenerAlertasStock,
  registrarAjuste,
} from '../controllers/inventario.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const inventarioRouter = Router();

const rolesGestionInventario = autorizarRoles('Administrador', 'Gerente');

inventarioRouter.use(verificarAutenticacion, exigirPasswordActualizada);

inventarioRouter.get('/existencias', listarExistencias);
inventarioRouter.get('/movimientos', rolesGestionInventario, listarMovimientos);
inventarioRouter.get('/alertas', rolesGestionInventario, obtenerAlertasStock);
inventarioRouter.post('/ajuste', rolesGestionInventario, registrarAjuste);
