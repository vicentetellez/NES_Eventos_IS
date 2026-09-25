import { z } from 'zod';

export const datosClienteNuevoCompletoSchema = z.object({
    nombre: z.string()
        .min(1, "El nombre es obligatorio.")
        .max(200, "El nombre no puede tener más de 200 caracteres."),
    primerApellido: z.string()
        .min(1, "El primer apellido es obligatorio.")
        .max(200, "El primer apellido no puede tener más de 200 caracteres."),
    segundoApellido: z.string()
        .min(1, "El segundo apellido no puede estar vacío.")
        .max(200, "El segundo apellido no puede tener más de 200 caracteres.")
        .optional(),
    fechaNacimiento: z.string()
        .refine((date) => !isNaN(Date.parse(date)), {
            message: "Fecha de nacimiento inválida"
        })
        .optional(),
    telefono: z.string()
        .min(8, "El teléfono debe tener al menos 8 caracteres.")
        .max(15, "El teléfono no puede tener más de 15 caracteres.")
        .regex(/^[0-9]*$/, "El teléfono debe contener solo números."),
    email: z.string()
        .min(1, "El email es obligatorio.")
        .email("El email debe ser válido."),
    codigoComuna: z.number()
        .min(1, "El código de comuna debe ser al menos 1.")
        .max(346, "El código de comuna no puede ser mayor a 346.")
        .int("El código de comuna debe ser un número entero.")
        .positive("El código de comuna debe ser un número positivo.")
}).strict();

export const datosClienteNuevoSchema = datosClienteNuevoCompletoSchema.partial({
    nombre: true,
    primerApellido: true,
    telefono: true,
    email: true,
    codigoComuna: true
});