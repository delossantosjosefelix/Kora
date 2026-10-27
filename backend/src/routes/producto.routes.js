import { Router } from 'express';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarProductos,
  obtenerProducto,
  obtenerSiguienteCodigo,
} from '../controllers/producto.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';
import { procesarImagenProducto } from '../middleware/upload.middleware.js';

export const productoRouter = Router();

const rolesGestionCatalogo = autorizarRoles('Administrador', 'Gerente');

productoRouter.use(verificarAutenticacion, exigirPasswordActualizada);

productoRouter.get('/', listarProductos);
productoRouter.get(
  '/siguiente-codigo',
  rolesGestionCatalogo,
  obtenerSiguienteCodigo,
);
productoRouter.get('/:id', obtenerProducto);

productoRouter.post(
  '/',
  rolesGestionCatalogo,
  procesarImagenProducto('imagen'),
  crearProducto,
);

productoRouter.patch(
  '/:id',
  rolesGestionCatalogo,
  procesarImagenProducto('imagen'),
  actualizarProducto,
);

productoRouter.delete('/:id', rolesGestionCatalogo, eliminarProducto);
