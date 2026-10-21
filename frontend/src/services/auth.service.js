import api from './root.service.js';

const createAuthError = (error, fallbackMessage) => {
  const authError = new Error(error.response?.data?.message || fallbackMessage);
  authError.status = error.response?.status;
  return authError;
};

export const login = async ({ rut, password }) => {
  try {
    const { data } = await api.post('/auth/login', { rut, password });
    return data.data;
  } catch (error) {
    throw createAuthError(error, 'Error al iniciar sesión');
  }
};

export const me = async () => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (error) {
    throw createAuthError(error, 'Error al restaurar la sesión');
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    throw createAuthError(error, 'Error al cerrar sesión');
  }
};
