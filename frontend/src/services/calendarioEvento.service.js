import api from './root.service.js';

export const getCalendarioEventos = async () => {
  try {
    const { data } = await api.get('/calendario-evento');
    return Array.isArray(data?.data?.calendario)
      ? data.data.calendario
      : Array.isArray(data?.calendario)
        ? data.calendario
        : [];
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener el calendario';
    throw new Error(mensajeError);
  }
};
