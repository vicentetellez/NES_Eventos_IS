import { z } from 'zod';

export const codigoBanqueteriaSchema = z.object({
    codigo: z
        .coerce.number()
        .int()
        .positive({
            message: "El código debe ser un número positivo"
        })
}).strict();

export const getAllBanqueteriasByFilterStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();

export const createBanqueteriaSchema = z.object({
    banqueteriaData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(200, "El nombre no puede exceder 200 caracteres"),
        descripcion: z
            .string()
            .max(400, "La descripción no puede exceder 400 caracteres")
            .optional(),
        precioPersonaReferencial: z
            .coerce.number()
            .positive({
                message: "El precio por persona referencial debe ser un número positivo"
            })
    })
}).strict();

export const updateBanqueteriaSchema = z.object({
    banqueteriaData: z.object({
        nombre: z
            .string()
            .min(1, "El nombre es obligatorio")
            .max(200, "El nombre no puede exceder 200 caracteres")
            .optional(),
        descripcion: z
            .string()
            .max(400, "La descripción no puede exceder 400 caracteres")
            .optional(),
        precioPersonaReferencial: z
            .coerce.number()
            .positive({
                message: "El precio por persona referencial debe ser un número positivo"
            })
            .optional()
    })
}).strict();

export const changeBanqueteriaStatusSchema = z.object({
    activo: z
        .string()
        .refine((value) => value === 'true' || value === 'false', {
            message: "El valor de activo debe ser 'true' o 'false'",
        })
        .transform((value) => value === 'true')
}).strict();