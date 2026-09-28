import { z } from 'zod';

export const codigoCalendarioEventoSchema = z.object({
    codigo: z
        .coerce.number()
        .int({ message: 'El código del calendario debe ser un entero' })
        .positive({ message: 'El código del calendario debe ser positivo' })
}).strict();

export const normalizarFechaSchema = z.object({
    fecha: z
        .string({ required_error: 'La fecha es obligatoria' })
        .refine((value) => !Number.isNaN(Date.parse(value)), {
            message: 'La fecha no es válida'
        })
}).strict();

export const createCalendarioEventoSchema = z.object({
    calendarioEventoData: z.object({
        codigoEvento: z
            .coerce.number()
            .int({ message: 'El código del evento debe ser un entero' })
            .positive({ message: 'El código del evento debe ser positivo' }),
        fechaEvento: z
            .string({ required_error: 'La fecha del evento es obligatoria' })
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: 'La fecha del evento no es válida'
            }),
        fechaPagoFinal: z
            .string()
            .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), {
                message: 'La fecha del abono final no es válida'
            })
            .optional()
            .or(z.literal('')),
        estadoCalendario: z
            .string()
            .min(1, 'El estado del calendario es obligatorio')
            .max(50, 'El estado del calendario no puede exceder 50 caracteres')
            .optional()
    })
}).strict();

export const updateCalendarioEventoSchema = z.object({
    calendarioEventoData: z.object({
        codigoEvento: z
            .coerce.number()
            .int({ message: 'El código del evento debe ser un entero' })
            .positive({ message: 'El código del evento debe ser positivo' })
            .optional(),
        fechaEvento: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: 'La fecha del evento no es válida'
            })
            .optional(),
        fechaPagoFinal: z
            .string()
            .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), {
                message: 'La fecha del abono final no es válida'
            })
            .optional()
            .or(z.literal('')),
        estadoCalendario: z
            .string()
            .min(1, 'El estado del calendario es obligatorio')
            .max(50, 'El estado del calendario no puede exceder 50 caracteres')
            .optional()
    })
}).strict();

export const getEstadoCalendarioEventoSchema = z.object({
    evento: z.object({
        fechaEvento: z.string().optional(),
        fechaPagoFinal: z.string().optional(),
        estado: z.string().optional()
    }).strict()
}).strict();