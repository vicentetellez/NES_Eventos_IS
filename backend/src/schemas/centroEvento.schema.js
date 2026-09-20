import { z } from 'zod';

export const codigoCentroEventoSchema = z.object({
    codigo: z
        .coerce.number()
        .int()
        .positive({
            message: "El código debe ser un número positivo"
        })
}).strict();

export const getAllCentroEventosByFilterStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();

export const createCentroEventoSchema = z.object({
    centroEventoData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(150, "El nombre no puede exceder 150 caracteres"),
        direccionExacta: z
            .string()
            .min(1, "La dirección exacta es obligatoria")
            .max(250, "La dirección exacta no puede exceder 250 caracteres")
            .optional(),
        capacidadPersonas: z
            .coerce.number()
            .int()
            .positive({
                message: "La capacidad debe ser un número positivo"
            }),
        nombreDueno: z
            .string()
            .min(1, "El nombre del dueño es obligatorio")
            .max(100, "El nombre del dueño no puede exceder 100 caracteres")
            .optional(),
        telefonoDueno: z
            .string()
            .min(1, "El teléfono de contacto es obligatorio")
            .max(15, "El teléfono de contacto no puede exceder 15 caracteres")
            .optional()
            
    })
}).strict();

export const updateCentroEventoSchema = z.object({
    centroEventoData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(150, "El nombre no puede exceder 150 caracteres")
            .optional(),
        direccionExacta: z
            .string()
            .min(1, "La dirección exacta es obligatoria")
            .max(250, "La dirección exacta no puede exceder 250 caracteres")
            .optional(),
        capacidadPersonas: z
            .coerce.number()
            .int()
            .positive({
                message: "La capacidad debe ser un número positivo"
            })
            .optional(),
        nombreDueno: z
            .string()
            .min(1, "El nombre del dueño es obligatorio")
            .max(100, "El nombre del dueño no puede exceder 100 caracteres")
            .optional(),
        telefonoDueno: z
            .string()
            .min(1, "El teléfono de contacto es obligatorio")
            .max(15, "El teléfono de contacto no puede exceder 15 caracteres")
            .optional()
    })
}).strict();

export const changeCentroEventoStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();