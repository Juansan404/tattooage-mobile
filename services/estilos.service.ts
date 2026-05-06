import api from './api';
import { Estilo } from '../types/estilo.types';

export const estilosService = {
  async getTop(): Promise<Estilo[]> {
    const res = await api.get<Estilo[]>('/estilos');
    return res.data;
  },

  async getByArtista(idUsuario: number): Promise<Estilo[]> {
    const res = await api.get<Estilo[]>(`/estilos/artista/${idUsuario}`);
    return res.data;
  },

  async updateArtista(idUsuario: number, nombres: string[]): Promise<Estilo[]> {
    const res = await api.put<Estilo[]>(`/estilos/artista/${idUsuario}`, nombres);
    return res.data;
  },
};
