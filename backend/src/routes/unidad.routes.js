import { Router } from 'express';
import {
  actualizarUnidad,
  crearUnidad,
  eliminarUnidad,
  listarUnidades,
  obtenerUnidad,
} from '../controllers/unidad.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const unidadRouter = Router();

const rolesGestionCatalogo = autorizarRoles('Administrador', 'Gerente');

unidadRouter.use(verificarAutenticacion, exigirPasswordActualizada);

unidadRouter.get('/', listarUnidades);
unidadRouter.get('/:id', obtenerUnidad);
unidadRouter.post('/', rolesGestionCatalogo, crearUnidad);
unidadRouter.patch('/:id', rolesGestionCatalogo, actualizarUnidad);
unidadRouter.delete('/:id', rolesGestionCatalogo, eliminarUnidad);
