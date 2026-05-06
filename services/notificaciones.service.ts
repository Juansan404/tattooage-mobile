import api from './api';
import { Notificacion } from '../types/notificacion.types';

export const notificacionesService = {
  async getByUsuario(idUsuario: number): Promise<Notificacion[]> {
    const response = await api.get<Notificacion[]>(`/notificaciones/${idUsuario}`);
    return response.data;
  },

  async countNoLeidas(idUsuario: number): Promise<number> {
    const response = await api.get<{ count: number }>(`/notificaciones/${idUsuario}/no-leidas`);
    return response.data.count;
  },

  async marcarLeida(id: number): Promise<void> {
    await api.put(`/notificaciones/${id}/leer`);
  },

  async marcarTodasLeidas(idUsuario: number): Promise<void> {
    await api.put(`/notificaciones/leer-todas/${idUsuario}`);
  },
};
