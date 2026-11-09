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

export const listarEquiposEvento = (codigoEvento) =>
  ejecutar(
    () => api.get(`/evento/${codigoEvento}/equipos`),
    'Error al obtener los equipos del evento'
  );

export const listarCatalogoEquipos = (codigoEvento) =>
  ejecutar(
    () => api.get(`/evento/${codigoEvento}/equipos/catalogo`),
    'Error al obtener el catálogo de equipos'
  );

export const actualizarEquiposEvento = (codigoEvento, equipos) =>
  ejecutar(
    () => api.put(`/evento/${codigoEvento}/equipos`, { equipos }),
    'Error al guardar los equipos del evento'
  );
