import { response } from '../helpers/responses.js';
import { 
    getAllUsuariosByFilterStatus,
    getUsuarioByRut,
    createUsuario,
    updateUsuario,
    changeUsuarioStatus,
    changeOwnPassword,
    resetUsuarioPassword
} from '../services/usuario.service.js';


export const getAllUsuariosByFilterStatusController = async (req, res, next) => {
    try {
        const { activo } = req.validatedQuery;
        const result = await getAllUsuariosByFilterStatus(activo);
        if (activo === true) response.success(res, 200, 'Busqueda de usuarios activos exitosa', result);
        if (activo === false) response.success(res, 200, 'Busqueda de usuarios inactivos exitosa', result);
    } catch (error) {
        next(error);
    }
};

export const getUsuarioByRutController = async (req, res, next) => {
    try {
        const { rut } = req.params;
        const result = await getUsuarioByRut(rut);
        response.success(res, 200, `Busqueda de usuario ${rut} exitosa`, result);
    } catch (error) {
        next(error);
    }
};

export const createUsuarioController = async (req, res, next) => {
    try {
        const { usuario, persona } = req.body;
        const result = await createUsuario(usuario, persona);
        response.success(res, 201, `Usuario ${usuario.rut} creado exitosamente`, result);
    } catch (error) {
        next(error);
    }
};

export const updateUsuarioController = async (req, res, next) => {
    try {
        const { rut } = req.params;
        const { usuario, persona } = req.body;
        const result = await updateUsuario(rut, usuario, persona);
        response.success(res, 200, `Usuario ${rut} actualizado exitosamente`, result);
    } catch (error) {
        next(error);
    }
};

export const changeUsuarioStatusController = async (req, res, next) => {
    try {
        const { rut } = req.params;
        const { activo } = req.validatedQuery;
        const result = await changeUsuarioStatus(rut, activo);
        if (activo === true) response.success(res, 200, `Estado del usuario ${rut} actualizado a activo exitosamente`, result);
        if (activo === false) response.success(res, 200, `Estado del usuario ${rut} actualizado a inactivo exitosamente`, result);
    } catch (error) {
        next(error);
    }
};

export const changeOwnPasswordController = async (req, res, next) => {
    try {
        const { rut } = req.user;
        const { currentPassword, newPassword } = req.body;
        const result = await changeOwnPassword(rut, currentPassword, newPassword);
        response.success(res, 200, 'Password actualizada exitosamente', result);
    } catch (error) {
        next(error);
    }
};

export const resetUsuarioPasswordController = async (req, res, next) => {
    try {
        const { rut } = req.params;
        const { newPassword } = req.body;
        const result = await resetUsuarioPassword(rut, newPassword, req.user.rut);
        response.success(res, 200, `Password del usuario ${rut} restablecida exitosamente`, result);
    } catch (error) {
        next(error);
    }
};