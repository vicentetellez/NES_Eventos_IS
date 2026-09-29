import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import tipoEventoRoutes from './tipoEvento.routes.js';
import centroEventoRoutes from './centroEvento.routes.js';
import banqueteriaRoutes from './banqueteria.routes.js';
import eventoRoutes from './evento.routes.js';
import trabajadorRoutes from './trabajador.routes.js';
import calendarioEventoRoutes from './calendarioEvento.routes.js';
import clienteRoutes from './cliente.routes.js';
import presupuestoRoutes from './presupuesto.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuario', usuarioRoutes);
router.use('/tipo-evento', tipoEventoRoutes);
router.use('/centro-evento', centroEventoRoutes);
router.use('/banqueteria', banqueteriaRoutes);
router.use('/evento', eventoRoutes);
router.use('/trabajador', trabajadorRoutes);
router.use('/calendario-evento', calendarioEventoRoutes);
router.use('/cliente', clienteRoutes);
router.use('/presupuestos', presupuestoRoutes);

export default router;