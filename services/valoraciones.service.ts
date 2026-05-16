import api from './api';
import { Valoracion, ResumenValoracion } from '../types/valoracion.types';

export const valoracionesService = {
  async getByArtista(idArtista: number): Promise<Valoracion[]> {
    const r = await api.get<Valoracion[]>(`/valoraciones/artista/${idArtista}`);
    return r.data;
  },

  async getResumen(idArtista: number): Promise<ResumenValoracion> {
    const r = await api.get<ResumenValoracion>(`/valoraciones/artista/${idArtista}/resumen`);
    return r.data;
  },

  async getMia(idArtista: number, idCliente: number): Promise<Valoracion | null> {
    try {
      const r = await api.get<Valoracion>(`/valoraciones/artista/${idArtista}/cliente/${idCliente}`);
      return r.data;
    } catch {
      return null;
    }
  },

  async createOrUpdate(
    idArtista: number,
    idCliente: number,
    puntuacion: number,
    comentario?: string,
  ): Promise<Valoracion> {
    const r = await api.post<Valoracion>('/valoraciones', {
      idArtista,
      idCliente,
      puntuacion,
      comentario: comentario?.trim() || null,
    });
    return r.data;
  },

  async eliminar(idValoracion: number): Promise<void> {
    await api.delete(`/valoraciones/${idValoracion}`);
  },
};
