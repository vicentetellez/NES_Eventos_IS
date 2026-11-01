import { z } from 'zod';

export const codigoEvaluacionEventoIdSchema = z.object({
    codigo: z
        .coerce.number()
        .int({ message: 'El código de la evaluación debe ser un entero' })
        .positive({ message: 'El código de la evaluación debe ser positivo' })
}).strict();

export const createEvaluacionEventoSchema = z.object({
    evaluacionEventoData: z.object({
        calidadPuntualidad: z.boolean({
            required_error: 'La evaluación de puntualidad es obligatoria'
        }),
        calidadTecnica: z.boolean({
            required_error: 'La evaluación de calidad técnica es obligatoria'
        }),
        calidadAtencion: z.boolean({
            required_error: 'La evaluación de calidad de atención es obligatoria'
        }),
        fidelidadPresupuesto: z.boolean({
            required_error: 'La evaluación de fidelidad al presupuesto es obligatoria'
        }),
        satisfaccion: z.boolean({
            required_error: 'La evaluación de satisfacción es obligatoria'
        }),
        recomendacion: z.boolean({
            required_error: 'La evaluación de recomendación es obligatoria'
        }),
        puntajeTotal: z
            .number({
                required_error: 'El puntaje total es obligatorio'
            })
            .min(0, 'El puntaje total no puede ser negativo')
            .max(99.99, 'El puntaje total no puede exceder 99.99'),
        comentarioAdicional: z.string().optional(),
        codigoEvento: z
            .number({
                required_error: 'El código del evento es obligatorio'
            })
            .int('El código del evento debe ser un entero')
            .positive('El código del evento debe ser positivo')
    }).strict()
}).strict();
