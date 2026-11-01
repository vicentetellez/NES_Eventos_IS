import { response } from '../helpers/responses.js';
import {
    asignarTrabajador,
    desasignarTrabajador,
    listarCatalogoTrabajadores,
    listarTrabajadoresAsignados
} from '../services/asignacionTrabajador.service.js';

export async function listarCatalogoTrabajadoresController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await listarCatalogoTrabajadores(codigo, req.validatedQuery);
        response.success(res, 200, 'Catálogo de trabajadores obtenido correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function listarTrabajadoresAsignadosController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await listarTrabajadoresAsignados(codigo);
        response.success(res, 200, 'Trabajadores asignados obtenidos correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function asignarTrabajadorController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await asignarTrabajador(codigo, req.body);
        response.success(res, 201, 'Trabajador asignado al evento correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function desasignarTrabajadorController(req, res, next) {
    try {
        const { codigo, rut, codigoEspecialidad } = req.validatedParams;
        const resultado = await desasignarTrabajador(codigo, rut, codigoEspecialidad);
        response.success(res, 200, 'Trabajador desasignado del evento correctamente', resultado);
    } catch (error) {
        next(error);
    }
}
