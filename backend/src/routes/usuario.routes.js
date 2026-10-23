import { Router } from 'express';
import {
  actualizarUsuario,
  crearUsuario,
  obtenerUsuario,
  listarUsuarios
} from '../controllers/usuario.controller.js';
import { autorizarRoles, verificarAutenticacion } from '../middleware/auth.middleware.js';

export const usuarioRouter = Router();

usuarioRouter.get('/', verificarAutenticacion, autorizarRoles('Administrador'), listarUsuarios);
usuarioRouter.get('/:id', verificarAutenticacion, autorizarRoles('Administrador'), obtenerUsuario);
usuarioRouter.post('/', verificarAutenticacion, autorizarRoles('Administrador'), crearUsuario);
usuarioRouter.patch('/:id', verificarAutenticacion, autorizarRoles('Administrador'), actualizarUsuario);
