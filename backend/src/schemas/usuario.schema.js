import { z } from 'zod';
import { rutSchema } from 'rut-kit/zod';

export const rutUsuarioSchema = z.object({
    rut: rutSchema
}).strict();

export const getAllUsuariosByFilterStatusSchema = z.object({
    activo: z
        .string({
            required_error: "El estado activo es obligatorio."
        })
        // 1. Validamos que el string sea exactamente "true" o "false"
        .refine((value) => value === "true" || value === "false", {
            message: "El estado activo debe ser 'true' o 'false'."
        })
        // 2. Transformamos el string validado en un Boolean real
        .transform((value) => value === "true")
}).strict();


export const getUsuarioByRutSchema = z.object({
    rut: rutSchema
}).strict();

export const createUsuarioSchema = z.object({
    usuario: z.object({
        rut: rutSchema,
        password: z
            .string({
                required_error: "La contraseña es obligatoria."
            })
            .min(8, "La contraseña debe tener al menos 8 caracteres.")
            .max(100, "La contraseña no puede tener más de 100 caracteres."),
        rol: z
            .enum(["ADMIN", "STAFF"], {
                errorMap: () => ({ message: "El rol debe ser ADMIN o STAFF." })
            }),
    }).strict(),
    persona: z.object({
        rut: rutSchema,
        nombre: z
            .string({
                required_error: "El nombre es obligatorio."
            })
            .min(1, "El nombre no puede estar vacío.")
            .max(200, "El nombre no puede tener más de 200 caracteres."),
        primerApellido: z
            .string({
                required_error: "El primer apellido es obligatorio."
            })
            .min(1, "El primer apellido no puede estar vacío.")
            .max(200, "El primer apellido no puede tener más de 200 caracteres."),
        segundoApellido: z
            .string()
            .min(1, "El segundo apellido no puede estar vacío.")
            .max(200, "El segundo apellido no puede tener más de 200 caracteres.")
            .optional(),
        fechaNacimiento: z
            .string({
                required_error: "La fecha de nacimiento es obligatoria."
            })
            .refine((date) => !isNaN(Date.parse(date)), {
                message: "Fecha de nacimiento inválida"
            }),
        telefono: z
            .string({
                required_error: "El teléfono es obligatorio."
            })
            .min(8, "El teléfono debe tener al menos 8 caracteres.")
            .max(15, "El teléfono no puede tener más de 15 caracteres.")
            .regex(/^[0-9]*$/, "El teléfono debe contener solo números."),
        email: z
            .string({
                required_error: "El email es obligatorio."
            })
            .min(1, "El email no puede estar vacío.")
            .email("El email debe ser válido."),
        codigoComuna: z
            .number({
                required_error: "El código de comuna es obligatorio."
            })
            .min(1, "El código de comuna debe ser al menos 1.")
            .max(346, "El código de comuna no puede ser mayor a 346.")
            .int("El código de comuna debe ser un número entero.")
            .positive("El código de comuna debe ser un número positivo.")
    }).optional()
}).strict();

export const updateUsuarioSchema = z.object({
    usuario: z.object({
    rol: z
        .enum(["ADMIN", "STAFF"], {
            errorMap: () => ({ message: "El rol debe ser ADMIN o STAFF." })
        })
        .optional(),  
    }).optional(),
    persona: z.object({
        nombre: z
            .string()
            .min(1, "El nombre no puede estar vacío.")
            .max(200, "El nombre no puede tener más de 200 caracteres.")
            .optional(),
        primerApellido: z
            .string()
            .min(1, "El primer apellido no puede estar vacío.")
            .max(200, "El primer apellido no puede tener más de 200 caracteres.")
            .optional(),
        segundoApellido: z
            .string()
            .min(1, "El segundo apellido no puede estar vacío.")
            .max(200, "El segundo apellido no puede tener más de 200 caracteres.")
            .optional(),
        fechaNacimiento: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
                message: "Fecha de nacimiento inválida"
            })
            .optional(),
        telefono: z
            .string()
            .min(8, "El teléfono debe tener al menos 8 caracteres.")
            .max(15, "El teléfono no puede tener más de 15 caracteres.")
            .regex(/^[0-9]*$/, "El teléfono debe contener solo números.")
            .optional(),
        email: z
            .string()
            .min(1, "El email no puede estar vacío.")
            .email("El email debe ser válido.")
            .optional(),
        codigoComuna: z
            .number()
            .min(1, "El código de comuna debe ser al menos 1.")
            .max(346, "El código de comuna no puede ser mayor a 346.")
            .int("El código de comuna debe ser un número entero.")
            .positive("El código de comuna debe ser un número positivo.")
            .optional()
    }).optional()
}).strict();

export const changeUsuarioStatusSchema = z.object({
    activo: z
        .string({
            required_error: "El status es obligatorio."
        })
        .refine((value) => value === "true" || value === "false", {
            message: "El estado activo debe ser 'true' o 'false'."
        })
        .transform((value) => value === "true")
}).strict();

export const changeOwnPasswordSchema = z.object({
    currentPassword: z
        .string({
            required_error: "La contraseña actual es obligatoria."
        })
        .min(8, "La contraseña actual debe tener al menos 8 caracteres.")
        .max(100, "La contraseña actual no puede tener más de 100 caracteres."),
    newPassword: z
        .string({
            required_error: "La nueva contraseña es obligatoria."
        })
        .min(8, "La contraseña nueva debe tener al menos 8 caracteres.")
        .max(100, "La contraseña nueva no puede tener más de 100 caracteres.")
}).strict();

export const resetUsuarioPasswordSchema = z.object({
    newPassword: z
        .string({
            required_error: "La nueva contraseña es obligatoria."
        })
        .min(8, "La contraseña nueva debe tener al menos 8 caracteres.")
        .max(100, "La contraseña nueva no puede tener más de 100 caracteres.")
}).strict();