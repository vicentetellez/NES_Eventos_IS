import api from './root.service.js';

export const getTrabajadoresParaEvaluacion = async (codigoEvento) => {
  try {
    const { data } = await api.get(`/evaluacion-trabajador/evento/${codigoEvento}`);
    const especialidades = data?.data?.especialidades;
    if (!Array.isArray(especialidades)) {
      throw new Error('El servidor no entregó las especialidades del evento.');
    }
    return especialidades;
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error al obtener los trabajadores del evento';
    throw new Error(mensajeError);
  }
};

export const createEvaluacionesTrabajadores = async (evaluacionesTrabajadores) => {
  try {
    const { data } = await api.post('/evaluacion-trabajador', { evaluacionesTrabajadores });
    const evaluacionesGuardadas = data?.data?.evaluacionesTrabajadores;
    if (!Array.isArray(evaluacionesGuardadas) || evaluacionesGuardadas.length !== evaluacionesTrabajadores.length) {
      throw new Error('El servidor no confirmó el registro de todas las evaluaciones de trabajadores.');
    }
    return evaluacionesGuardadas;
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error al guardar las evaluaciones de trabajadores';
    throw new Error(mensajeError);
  }
};
