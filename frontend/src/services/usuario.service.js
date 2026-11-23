import api from './root.service.js';

export async function getUsuariosByStatus(activo) {
  try {
    const { data } = await api.get('/usuario', { params: { activo } });
    return data.data.usuarios;
  } catch (error) {
    const message = error.response?.data?.message;
    const emptyMessage = activo ? 'No hay usuarios activos registrados' : 'No hay usuarios inactivos registrados';
    if (error.response?.status === 404 && message === emptyMessage) return [];
    throw new Error(message || 'No se pudieron cargar los usuarios.', { cause: error });
  }
}

export async function resetUsuarioPassword(rut, newPassword) {
  try {
    await api.patch(`/usuario/${encodeURIComponent(rut)}/password`, { newPassword });
  } catch (error) {
    const details = error.response?.data?.detalles;
    const message = error.response?.data?.message || details?.[0]?.mensaje;
    throw new Error(message || 'No se pudo restablecer la contraseña.', { cause: error });
  }
}

export async function changeUsuarioStatus(rut, activo) {
  try {
    await api.patch(`/usuario/${encodeURIComponent(rut)}/status`, {}, { params: { activo } });
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.detalles?.[0]?.mensaje;
    throw new Error(message || 'No se pudo cambiar el estado del usuario.', { cause: error });
  }
}
