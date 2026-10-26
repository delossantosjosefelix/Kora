import { Router } from 'express';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  obtenerCategoria,
} from '../controllers/categoria.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const categoriaRouter = Router();

const rolesGestionCatalogo = autorizarRoles('Administrador', 'Gerente');

categoriaRouter.use(verificarAutenticacion, exigirPasswordActualizada);

categoriaRouter.get('/', listarCategorias);
categoriaRouter.get('/:id', obtenerCategoria);
categoriaRouter.post('/', rolesGestionCatalogo, crearCategoria);
categoriaRouter.patch('/:id', rolesGestionCatalogo, actualizarCategoria);
categoriaRouter.delete('/:id', rolesGestionCatalogo, eliminarCategoria);
