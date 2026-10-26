import { z } from 'zod';
import { CATEGORIAS_DETALLE } from '../services/calculoPresupuesto.service.js';

// Campos desconocidos (p. ej. subtotal, codigo) se descartan: el servidor recalcula los subtotales
const detallePresupuestoSchema = z.object({
    categoria: z.enum(CATEGORIAS_DETALLE),
    descripcion: z.string().min(1).max(500),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().int().nonnegative(),
    codigoEspecialidad: z.number().int().positive().optional()
});

const porcentajeMargenSchema = z.number().int().min(0).max(100);

export const crearPresupuestoSchema = z.object({
    porcentajeMargen: porcentajeMargenSchema.default(0),
    detalles: z.array(detallePresupuestoSchema).min(1).max(200)
}).strict();

export const actualizarPresupuestoSchema = z.object({
    porcentajeMargen: porcentajeMargenSchema.optional(),
    detalles: z.array(detallePresupuestoSchema).max(200).optional()
}).strict().refine(
    (datos) => datos.porcentajeMargen !== undefined || datos.detalles !== undefined,
    { message: 'Debe enviar porcentajeMargen o detalles para modificar el presupuesto.' }
);

export const rechazarPresupuestoSchema = z.object({
    observacion: z.string().trim().min(1, 'Debe indicar el motivo del rechazo.').max(1000)
}).strict();
