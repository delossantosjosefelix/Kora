import { Router } from 'express';
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  obtenerUsuario,
  listarUsuarios
} from '../controllers/usuario.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const usuarioRouter = Router();

const rolesGestionUsuarios = autorizarRoles('Administrador', 'Gerente');

usuarioRouter.use(verificarAutenticacion, exigirPasswordActualizada);

usuarioRouter.get('/', rolesGestionUsuarios, listarUsuarios);
usuarioRouter.get('/:id', rolesGestionUsuarios, obtenerUsuario);
usuarioRouter.post('/', rolesGestionUsuarios, crearUsuario);
usuarioRouter.patch('/:id', rolesGestionUsuarios, actualizarUsuario);
usuarioRouter.delete('/:id', rolesGestionUsuarios, eliminarUsuario);

