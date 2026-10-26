import { Router } from 'express';
import {
  actualizarSuplidor,
  crearSuplidor,
  eliminarSuplidor,
  listarSuplidores,
  obtenerSuplidor,
} from '../controllers/suplidor.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const suplidorRouter = Router();

const rolesGestionSuplidores = autorizarRoles('Administrador', 'Gerente');

suplidorRouter.use(verificarAutenticacion, exigirPasswordActualizada);

suplidorRouter.get('/', rolesGestionSuplidores, listarSuplidores);
suplidorRouter.get('/:id', rolesGestionSuplidores, obtenerSuplidor);
suplidorRouter.post('/', rolesGestionSuplidores, crearSuplidor);
suplidorRouter.patch('/:id', rolesGestionSuplidores, actualizarSuplidor);
suplidorRouter.delete('/:id', rolesGestionSuplidores, eliminarSuplidor);
