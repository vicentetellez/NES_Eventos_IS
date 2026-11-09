import api from './root.service.js';

async function ejecutar(peticion, mensajePorDefecto) {
  try {
    const { data } = await peticion();
    return data.data;
  } catch (error) {
    const errorServicio = new Error(error.response?.data?.message || mensajePorDefecto);
    errorServicio.status = error.response?.status;
    throw errorServicio;
  }
}

export const listarTrabajadoresAsignados = (codigoEvento) =>
  ejecutar(
    () => api.get(`/evento/${codigoEvento}/trabajadores`),
    'Error al obtener los trabajadores asignados'
  );

export const listarCatalogoTrabajadores = (codigoEvento) =>
  ejecutar(
    () => api.get(`/evento/${codigoEvento}/trabajadores/catalogo`),
    'Error al obtener el catálogo de trabajadores'
  );

export const asignarTrabajador = (codigoEvento, asignacion) =>
  ejecutar(
    () => api.post(`/evento/${codigoEvento}/trabajadores`, asignacion),
    'Error al asignar el trabajador'
  );

export const desasignarTrabajador = (codigoEvento, rutTrabajador, codigoEspecialidad) =>
  ejecutar(
    () => api.delete(`/evento/${codigoEvento}/trabajadores/${encodeURIComponent(rutTrabajador)}/${codigoEspecialidad}`),
    'Error al desasignar el trabajador'
  );
