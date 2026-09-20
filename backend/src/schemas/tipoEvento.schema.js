import { z } from 'zod';

export const codigoTipoEventoSchema = z.object({
    codigo: z
        .coerce.number()
        .int()
        .positive({
            message: "El código debe ser un número positivo"
        })
}).strict();

export const getAllTipoEventosByFilterStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();

export const createTipoEventoSchema = z.object({
    tipoEventoData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(100, "El nombre no puede exceder 100 caracteres"),
        descripcion: z
            .string()
            .max(300, "La descripción no puede exceder 300 caracteres")
            .optional(),
        tarifaHoraBaseReferencial: z
            .number()
            .positive({
                message: "La tarifa por hora base referencial debe ser un número positivo"
            })
    })
}).strict();

export const updateTipoEventoSchema = z.object({
    tipoEventoData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(100, "El nombre no puede exceder 100 caracteres")
            .optional(),
        descripcion: z
            .string()
            .max(300, "La descripción no puede exceder 300 caracteres")
            .optional(),
        tarifaHoraBaseReferencial: z
            .number()
            .positive({
                message: "La tarifa por hora base referencial debe ser un número positivo"
            })
            .optional()
    })
}).strict();

export const changeTipoEventoStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();