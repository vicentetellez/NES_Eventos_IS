import { z } from 'zod';
import { rutSchema } from 'rut-kit/zod'

export const loginSchema = z.object({
    rut: rutSchema,
    password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres.")
        .max(100, "La contraseña no puede tener más de 100 caracteres.")
}).strip();