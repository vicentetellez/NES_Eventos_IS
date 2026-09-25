import { z } from 'zod';
import { rutSchema } from 'rut-kit/zod';
import { datosClienteNuevoSchema } from './cliente.schema.js';
import { listaBanqueteriasSchema } from './banqueteria.schema.js';

export const codigoEventoSchema = z.object({
    codigo: z
        .coerce.number()
        .int()
        .positive({
            message: "El código debe ser un número positivo"
        })
}).strict();

export const codigoEvaluacionEventoSchema = z.object({
    codigoEvaluacion: z
        .string({
            required_error: "El código de evaluación del evento es obligatorio."
        })
        .min(1, "El código de evaluación del evento no puede estar vacío.")
        .max(10, "El código de evaluación del evento no puede tener más de 10 caracteres.")
        .regex(/^[a-zA-Z0-9-]*$/, "El código de evaluación del evento solo puede contener letras, números y un '-'")
}).strict();

export const avanzarEstadoEventoSchema = z.object({
    estadoDestino: z.enum([
        'COTIZANDO',
        'PENDIENTE_PAGO_ABONO',
        'ORGANIZANDO',
        'PENDIENTE_PAGO_FINAL',
        'EN_PREPARACION',
        'EN_EJECUCION',
        'FINALIZADO',
        'CANCELADO'
    ], {
        errorMap: () => ({ message: 'El estado destino no es válido.' })
    }),
    fechaLimiteAbono: z.coerce.date().optional(),
    montoAbono: z.coerce.number().int().positive().optional()
}).strict().superRefine((datos, context) => {
    if (datos.estadoDestino === 'PENDIENTE_PAGO_ABONO') {
        if (!datos.fechaLimiteAbono) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['fechaLimiteAbono'],
                message: 'La fecha límite del abono es obligatoria.'
            });
        }
        if (datos.montoAbono === undefined) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['montoAbono'],
                message: 'El monto del abono es obligatorio.'
            });
        }
    }
});

export const getAllEventosByFilterEstadoSchema = z.object({
    estado: z
        .enum([
            'SOLICITADO',
            'COTIZANDO',
            'PENDIENTE_PAGO_ABONO',
            'ORGANIZANDO',
            'PENDIENTE_PAGO_FINAL',
            'EN_PREPARACION',
            'EN_EJECUCION',
            'FINALIZADO',
            'CANCELADO'
        ], {
            errorMap: () => ({ message: "El estado del evento debe ser SOLICITADO, COTIZANDO, PENDIENTE_PAGO_ABONO, ORGANIZANDO, PENDIENTE_PAGO_FINAL, EN_PREPARACION, EN_EJECUCION, FINALIZADO o CANCELADO." })
        })
}).strict();

export const createEventoSchema = z.object({
    eventoData: z.object({

        rutCliente: rutSchema,

        datosClienteNuevo: datosClienteNuevoSchema,

        datosEventoNuevo: z.object({
            fechaEvento: z
                .string({
                    required_error: "La fecha del evento es obligatoria."
                })
                .refine((date) => !isNaN(Date.parse(date)), {
                    message: "Fecha del evento inválida"
                }),
            horaInicio: z
                .string({
                    required_error: "La hora de inicio del evento es obligatoria."
                })
                .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
                    message: "Hora de inicio del evento inválida"
                }),
            horasEvento: z
                .number({
                    required_error: "La cantidad de horas del evento es obligatoria."
                })
                .min(1, "El evento debe durar al menos 1 hora.")
                .int("La cantidad de horas del evento debe ser un número entero.")
                .positive("La cantidad de horas del evento debe ser un número positivo."),
            cantidadPersonas: z
                .number({
                    required_error: "La cantidad de personas del evento es obligatoria."
                })
                .min(1, "El evento debe tener al menos 1 persona.")
                .int("La cantidad de personas del evento debe ser un número entero.")
                .positive("La cantidad de personas del evento debe ser un número positivo."),
            tipoEventoCliente: z
                .string({
                    required_error: "El tipo de evento del cliente es obligatorio."
                })
                .min(1, "El tipo de evento del cliente no puede estar vacío.")
                .max(300, "El tipo de evento del cliente no puede exceder los 300 caracteres.")
                .optional(),
            centroEventoCliente: z
                .string({
                    required_error: "El centro del evento del cliente es obligatorio."
                })
                .min(1, "El centro del evento del cliente no puede estar vacío.")
                .max(300, "El centro del evento del cliente no puede exceder los 300 caracteres.")
                .optional(),
            restriccionesAlimentarias: z
                .string({
                    required_error: "Las restricciones alimentarias del cliente son obligatorias."
                })
                .min(1, "Las restricciones alimentarias del cliente no pueden estar vacías.")
                .max(400, "Las restricciones alimentarias del cliente no pueden exceder los 400 caracteres.")
                .optional(),
            comentariosAlcohol: z
                .string({
                    required_error: "Los comentarios sobre el alcohol del cliente son obligatorios."
                })
                .min(1, "Los comentarios sobre el alcohol del cliente no pueden estar vacíos.")
                .max(400, "Los comentarios sobre el alcohol del cliente no pueden exceder los 400 caracteres.")
                .optional(),
            comentariosAdicionales: z
                .string({
                    required_error: "Los comentarios adicionales del cliente son obligatorios."
                })
                .min(1, "Los comentarios adicionales del cliente no pueden estar vacíos.")
                .max(500, "Los comentarios adicionales del cliente no pueden exceder los 500 caracteres.")
                .optional(),
            codigoTipoEvento: z
                .number({
                    required_error: "El código del tipo de evento es obligatorio."
                })
                .int("El código del tipo de evento debe ser un número entero.")
                .positive("El código del tipo de evento debe ser un número positivo.")
                .optional(),
            codigoCentroEvento: z
                .number({
                    required_error: "El código del centro de evento es obligatorio."
                })
                .int("El código del centro de evento debe ser un número entero.")
                .positive("El código del centro de evento debe ser un número positivo.")
                .optional(),
        }).strict().superRefine((datosEventoNuevo, context) => {
            const tieneTipoCatalogo = datosEventoNuevo.codigoTipoEvento !== undefined;
            const tieneTipoCliente = datosEventoNuevo.tipoEventoCliente !== undefined;
            const tieneCentroCatalogo = datosEventoNuevo.codigoCentroEvento !== undefined;
            const tieneCentroCliente = datosEventoNuevo.centroEventoCliente !== undefined;

            if (tieneTipoCatalogo === tieneTipoCliente) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['codigoTipoEvento'],
                    message: 'Debe indicar exactamente un tipo de evento: catálogo o descripción del cliente.'
                });
            }

            if (tieneCentroCatalogo === tieneCentroCliente) {
                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['codigoCentroEvento'],
                    message: 'Debe indicar exactamente un centro de evento: catálogo o descripción del cliente.'
                });
            }
        })

    }).strict(),
}).strict();

export const solicitudEventoSchema = z.object({
    eventoData: createEventoSchema.shape.eventoData,
    banqueterias: listaBanqueteriasSchema.shape.banqueterias
}).strict();

export const updateEventoSchema = z.object({
    eventoData: z.object({
        fechaEvento: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), {
                message: "Fecha del evento inválida"
            })
            .optional(),
        horaInicio: z
            .string()
            .refine((time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time), {
                message: "Hora de inicio inválida"
            })
            .optional(),
        horasEvento: z
            .number()
            .int("Las horas del evento deben ser un número entero.")
            .positive("Las horas del evento deben ser un número positivo.")
            .optional(),
        horasMontajeDesmontaje: z
            .number()
            .int("Las horas de montaje/desmontaje deben ser un número entero.")
            .positive("Las horas de montaje/desmontaje deben ser un número positivo.")
            .optional(),
        cantidadPersonas: z
            .number()
            .int("La cantidad de personas debe ser un número entero.")
            .positive("La cantidad de personas debe ser un número positivo.")
            .optional(),
        tipoEventoCliente: z
            .string()
            .min(1, "El tipo de evento del cliente no puede estar vacío.")
            .max(150, "El tipo de evento del cliente no puede exceder los 150 caracteres.")
            .optional(),
        centroEventoCliente: z
            .string()
            .min(1, "El centro de evento del cliente no puede estar vacío.")
            .max(300, "El centro de evento del cliente no puede exceder los 300 caracteres.")
            .optional(),
        codigoTipoEvento: z
            .number()
            .int("El código del tipo de evento debe ser un número entero.")
            .positive("El código del tipo de evento debe ser un número positivo.")
            .optional(),
        codigoCentroEvento: z
            .number()
            .int("El código del centro de evento debe ser un número entero.")
            .positive("El código del centro de evento debe ser un número positivo.")
            .optional(),
    }).strict()
}).strict();

export const getAlertasPagoPendienteSchema = z.object({
    diasAnticipacion: z.coerce.number().int().min(0).max(30).default(3)
}).strict();