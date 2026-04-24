import api from './api';
import { Cita, EstadoCita } from '../types/cita.types';

export const citasService = {
  async getMias(): Promise<Cita[]> {
    const response = await api.get<Cita[]>('/citas');
    return response.data;
  },

  async getById(id: number): Promise<Cita> {
    const response = await api.get<Cita>(`/citas/${id}`);
    return response.data;
  },

  async cambiarEstado(id: number, estado: EstadoCita): Promise<Cita> {
    const response = await api.put<Cita>(`/citas/${id}/estado`, { estado });
    return response.data;
  },

  async cancelar(id: number): Promise<void> {
    await api.delete(`/citas/${id}`);
  },
};
