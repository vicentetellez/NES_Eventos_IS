import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import { blockIfNotActive, blockIfPasswordChangeRequired, verifyRoles } from '../middlewares/authorization.middleware.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { codigoEventoSchema } from '../schemas/evento.schema.js';
import { AppError, response } from '../helpers/responses.js';
import { obtenerArchivoComprobante, rechazarComprobante, subirComprobante } from '../services/comprobanteAbono.service.js';

const router = Router();
const autenticado = [authenticateJwt, blockIfPasswordChangeRequired, blockIfNotActive];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }).single('comprobante');
const rechazoSchema = z.object({ observacion: z.string().trim().min(1).max(1000) }).strict();

function recibirArchivo(req, res, next) {
    upload(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return next(new AppError(error.code === 'LIMIT_FILE_SIZE'
                ? 'El comprobante no puede superar los 10 MB'
                : 'No se pudo recibir el comprobante', error.code === 'LIMIT_FILE_SIZE' ? 413 : 400));
        }
        if (error) return next(error);
        next();
    });
}

router.post('/:codigo/comprobante-abono', ...autenticado, verifyRoles('STAFF'),
    validate(codigoEventoSchema, 'params'), recibirArchivo, async (req, res) => {
        const resultado = await subirComprobante(req.validatedParams.codigo, req.file, req.user.rut);
        response.success(res, 201, 'Comprobante enviado para revisión', resultado);
    });

router.get('/:codigo/comprobante-abono/archivo', ...autenticado, verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'), async (req, res) => {
        const archivo = await obtenerArchivoComprobante(req.validatedParams.codigo);
        const extension = archivo.tipo === 'image/png' ? 'png' : 'pdf';
        res.set({
            'Content-Type': archivo.tipo,
            'Content-Disposition': `attachment; filename="comprobante.${extension}"`,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-store'
        });
        res.send(Buffer.from(archivo.contenido));
    });

router.patch('/:codigo/comprobante-abono/rechazar', ...autenticado, verifyRoles('GERENTE'),
    validate(codigoEventoSchema, 'params'), validate(rechazoSchema), async (req, res) => {
        const resultado = await rechazarComprobante(req.validatedParams.codigo, req.body.observacion, req.user.rut);
        response.success(res, 200, 'Comprobante rechazado', resultado);
    });

export default router;
