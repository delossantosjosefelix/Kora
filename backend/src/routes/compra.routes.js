import { Router } from 'express';
import {
  crearCompra,
  listarCompras,
  obtenerCompra,
} from '../controllers/compra.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const compraRouter = Router();

const rolesGestionCompras = autorizarRoles('Administrador', 'Gerente');

compraRouter.use(verificarAutenticacion, exigirPasswordActualizada);

compraRouter.get('/', rolesGestionCompras, listarCompras);
compraRouter.get('/:id', rolesGestionCompras, obtenerCompra);
compraRouter.post('/', rolesGestionCompras, crearCompra);
