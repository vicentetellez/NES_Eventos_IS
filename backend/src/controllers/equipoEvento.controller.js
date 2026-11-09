import { response } from '../helpers/responses.js';
import {
    actualizarEquiposEvento,
    listarCatalogoEquipos,
    listarEquiposEvento
} from '../services/equipoEvento.service.js';

export async function listarCatalogoEquiposController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await listarCatalogoEquipos(codigo);
        response.success(res, 200, 'Catálogo de equipos obtenido correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function listarEquiposEventoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await listarEquiposEvento(codigo);
        response.success(res, 200, 'Equipos del evento obtenidos correctamente', resultado);
    } catch (error) {
        next(error);
    }
}

export async function actualizarEquiposEventoController(req, res, next) {
    try {
        const { codigo } = req.validatedParams;
        const resultado = await actualizarEquiposEvento(codigo, req.body);
        response.success(res, 200, 'Equipos del evento actualizados correctamente', resultado);
    } catch (error) {
        next(error);
    }
}
