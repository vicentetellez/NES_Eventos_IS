import { z } from 'zod';
import { rutSchema } from 'rut-kit/zod';

export const asignarTrabajadorSchema = z.object({
    rutTrabajador: rutSchema,
    codigoEspecialidad: z.number().int().positive(),
    // Solo aplica a trabajadores externos. Si se omite se usa la tarifa referencial de la especialidad.
    tarifaHoraAcordada: z.number().int().positive().optional()
}).strict();

export const desasignarTrabajadorParamsSchema = z.object({
    codigo: z.coerce.number().int().positive(),
    rut: rutSchema,
    codigoEspecialidad: z.coerce.number().int().positive()
}).strict();

export const catalogoTrabajadoresQuerySchema = z.object({
    codigoEspecialidad: z.coerce.number().int().positive().optional(),
    nombre: z.string().trim().min(1).max(200).optional(),
    soloDisponibles: z
        .enum(['true', 'false'])
        .transform((valor) => valor === 'true')
        .optional()
}).strict();
