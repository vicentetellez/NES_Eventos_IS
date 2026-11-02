import { response } from '../helpers/responses.js';
import {
    actualizarPresupuesto,
    ajustarEventoYPresupuesto,
    crearPresupuesto,
    enviarPresupuestoAValidacion,
    listarPresupuestos,
    obtenerPrecargaPresupuesto,
    obtenerPresupuesto,
    obtenerVistaPreviaCantidadPersonas,
    rechazarPresupuesto,
    validarPresupuesto
} from '../services/presupuesto.service.js';
import { generarPdfSegundoAbono } from '../services/presupuestoPdf.service.js';

export async function descargarPdfSegundoAbonoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const { buffer, nombreArchivo } = await generarPdfSegundoAbono(codigo);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
            'Content-Length': buffer.length
        });
        res.status(200).send(buffer);
    } catch (error) {
        next(error);
    }
}

export async function listarPresupuestosController(req, res, next) {
    try {
        const { estado } = req.validatedQuery;
        const resultado = await listarPresupuestos(estado);
        response.success(res, 200, 'Presupuestos obtenidos correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function ajustarEventoYPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await ajustarEventoYPresupuesto(codigo, req.body);
        response.success(res, 200, 'Evento y presupuesto actualizados correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function obtenerVistaPreviaCantidadPersonasController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const { cantidadPersonas } = req.validatedQuery;
        const resultado = await obtenerVistaPreviaCantidadPersonas(codigo, cantidadPersonas);
        response.success(res, 200, 'Vista previa del presupuesto obtenida correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function obtenerPrecargaPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await obtenerPrecargaPresupuesto(codigo);
        response.success(res, 200, 'Precarga de presupuesto obtenida correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function obtenerPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await obtenerPresupuesto(codigo);
        response.success(res, 200, 'Presupuesto obtenido correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function crearPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await crearPresupuesto(codigo, req.body);
        response.success(res, 201, 'Presupuesto creado correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function actualizarPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await actualizarPresupuesto(codigo, req.body);
        response.success(res, 200, 'Presupuesto actualizado correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function enviarPresupuestoAValidacionController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await enviarPresupuestoAValidacion(codigo);
        response.success(res, 200, 'Presupuesto enviado a validación correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function validarPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await validarPresupuesto(codigo, req.user.rut);
        response.success(res, 200, 'Presupuesto validado correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function rechazarPresupuestoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await rechazarPresupuesto(codigo, req.user.rut, req.body.observacion);
        response.success(res, 200, 'Presupuesto rechazado correctamente', resultado);
    } catch (error) {
        next(error);
    }
}
