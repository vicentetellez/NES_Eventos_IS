import { response } from '../helpers/responses.js';
import {
    actualizarPresupuesto,
    crearPresupuesto,
    enviarPresupuestoAValidacion,
    obtenerPrecargaPresupuesto,
    obtenerPresupuesto,
    rechazarPresupuesto,
    validarPresupuesto
} from '../services/presupuesto.service.js';

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
