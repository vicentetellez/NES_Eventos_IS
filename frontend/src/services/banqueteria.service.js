import api from './root.service.js';

export const getBanqueteriasPublicas = async () => {
  try {
    const { data } = await api.get('/banqueteria/publicos');
    // Tu backend devuelve: { status: "Success", message: "...", data: [...] }
    return data.data.banqueterias; 
  } catch (error) {
    // Si el backend lanzó un AppError o error de Prisma:
    // error.response.data.message contendrá la cadena exacta enviada por tu errorHandler
    const mensajeError = error.response?.data?.message || 'Error de conexión con el servidor';
    throw new Error(mensajeError);
  }
};