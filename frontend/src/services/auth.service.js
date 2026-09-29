import api from './root.service.js';

export const login = async ({ rut, password }) => {
  try {
    const { data } = await api.post('/auth/login', { rut, password });
    return data.data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al iniciar sesión';
    throw new Error(mensajeError);
  }
};
