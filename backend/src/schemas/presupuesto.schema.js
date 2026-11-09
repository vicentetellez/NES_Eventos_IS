import { z } from 'zod';
import { CATEGORIAS_EDITABLES } from '../services/calculoPresupuesto.service.js';

// Campos desconocidos (p. ej. subtotal, codigo) se descartan: el servidor recalcula los subtotales
const detallePresupuestoSchema = z.object({
    categoria: z.enum(CATEGORIAS_EDITABLES),
    descripcion: z.string().min(1).max(500),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().int().nonnegative(),
    codigoEspecialidad: z.number().int().positive().optional(),
    codigoEquipo: z.number().int().positive().optional(),
    esArriendoTercero: z.boolean().optional()
}).superRefine((detalle, context) => {
    if (detalle.codigoEquipo && detalle.categoria !== 'EQUIPAMIENTO') {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['codigoEquipo'],
            message: 'El equipo solo se puede asociar a una línea de EQUIPAMIENTO.'
        });
    }
});

export const crearPresupuestoSchema = z.object({
    detalles: z.array(detallePresupuestoSchema).min(1).max(200)
}).strict();

export const actualizarPresupuestoSchema = z.object({
    detalles: z.array(detallePresupuestoSchema).max(200)
}).strict();

export const ajustarEventoSchema = z.object({
    cantidadPersonas: z.number().int().positive().max(100000).optional(),
    horasEvento: z.number().int().positive().max(1000).optional(),
    horasMontajeDesmontaje: z.number().int().positive().max(1000).optional()
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    { message: 'Debe enviar cantidadPersonas, horasEvento o horasMontajeDesmontaje.' }
);

export const listarPresupuestosSchema = z.object({
    estado: z.enum(['BORRADOR', 'PENDIENTE_VALIDACION', 'VALIDADO', 'RECHAZADO']).optional()
}).strict();

export const vistaPreviaCantidadPersonasSchema = z.object({
    cantidadPersonas: z.coerce.number().int().positive().max(100000)
}).strict();

export const rechazarPresupuestoSchema = z.object({
    observacion: z.string().trim().min(1, 'Debe indicar el motivo del rechazo.').max(1000)
}).strict();
