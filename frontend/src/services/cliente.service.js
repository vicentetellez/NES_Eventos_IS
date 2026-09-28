import api from './root.service.js';

export const clienteExisteParaSolicitud = async (rut) => {
  try {
    const rutLimpio = encodeURIComponent(rut.trim());
    const { data } = await api.get(`/cliente/existe-para-solicitud/${rutLimpio}`);
    return data.data; // Devuelve { existe: boolean, activo: boolean }
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al verificar la existencia del cliente';
    throw new Error(mensajeError);
  }
};