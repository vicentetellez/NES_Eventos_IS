import { z } from 'zod';
import { rutSchema } from 'rut-kit/zod';

export const codigoEvaluacionTrabajadorSchema = z.object({
    codigoEvento: z
        .coerce.number()
        .int({ message: 'El código del evento debe ser un entero' })
        .positive({ message: 'El código del evento debe ser positivo' })
}).strict();

export const createEvaluacionTrabajadorSchema = z.object({
    evaluacionesTrabajadores: z.array(z.object({
            calificacion: z
                .number({
                    required_error: 'La calificación es obligatoria'
                })
                .min(0, 'La calificación no puede ser negativa')
                .max(5, 'La calificación no puede exceder 5'),
            comentarioEspecifico: z.string().optional(),
            esAutogenerado: z.boolean().optional(),
            codigoEvento: z
                .number({
                    required_error: 'El código del evento es obligatorio'
                })
                .int('El código del evento debe ser un entero')
                .positive('El código del evento debe ser positivo'),
            codigoEspecialidad: z
                .number({
                    required_error: 'El código de la especialidad es obligatorio'
                })
                .int('El código de la especialidad debe ser un entero')
                .positive('El código de la especialidad debe ser positivo'),
            rutTrabajador: rutSchema
        }).strict())
        .min(1, 'Debe entregar al menos una evaluación de trabajador')
}).strict();
