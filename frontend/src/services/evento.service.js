import api from './root.service.js';

export const solicitudEvento = async (payload) => {
  try {
    const { data } = await api.post('/evento/solicitud', payload);
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al enviar la solicitud de evento';
    throw new Error(mensajeError);
  }
};