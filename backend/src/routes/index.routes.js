import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import tipoEventoRoutes from './tipoEvento.routes.js';
import centroEventoRoutes from './centroEvento.routes.js';
import banqueteriaRoutes from './banqueteria.routes.js';
import eventoRoutes from './evento.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuario', usuarioRoutes);
router.use('/tipo-evento', tipoEventoRoutes);
router.use('/centro-evento', centroEventoRoutes);
router.use('/banqueteria', banqueteriaRoutes);
router.use('/evento', eventoRoutes);

export default router;