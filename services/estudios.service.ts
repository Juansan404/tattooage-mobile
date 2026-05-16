import api from './api';
import { Estudio, PerfilArtista } from '../types/usuario.types';

export const estudiosService = {
  async getAll(): Promise<Estudio[]> {
    const r = await api.get<Estudio[]>('/estudios');
    return r.data;
  },

  async getById(id: number): Promise<Estudio> {
    const r = await api.get<Estudio>(`/estudios/${id}`);
    return r.data;
  },

  async getArtistas(id: number): Promise<PerfilArtista[]> {
    const r = await api.get<PerfilArtista[]>(`/estudios/${id}/artistas`);
    return r.data;
  },

  async unirse(idUsuario: number, idEstudio: number): Promise<PerfilArtista> {
    const r = await api.put<PerfilArtista>(`/artistas/${idUsuario}/perfil`, { idEstudio });
    return r.data;
  },

  async abandonar(idUsuario: number): Promise<PerfilArtista> {
    const r = await api.put<PerfilArtista>(`/artistas/${idUsuario}/perfil`, { idEstudio: null });
    return r.data;
  },
};
