import { Router } from 'express';
import { abrirTurno, obtenerEstadoCajas } from '../controllers/caja.controller.js';
import {
  autorizarRoles,
  exigirPasswordActualizada,
  verificarAutenticacion,
} from '../middleware/auth.middleware.js';

export const cajaRouter = Router();

const rolesCaja = autorizarRoles('Administrador', 'Gerente', 'Cajero');

cajaRouter.use(verificarAutenticacion, exigirPasswordActualizada);

cajaRouter.get('/', rolesCaja, obtenerEstadoCajas);
cajaRouter.post('/turnos', rolesCaja, abrirTurno);
