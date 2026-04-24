import api from './api';
import { PerfilArtista, Usuario } from '../types/usuario.types';
import { Publicacion } from '../types/publicacion.types';

export const artistasService = {
  async getAll(): Promise<PerfilArtista[]> {
    const response = await api.get<PerfilArtista[]>('/artistas');
    return response.data;
  },

  async getUsuarioById(id: number): Promise<Usuario> {
    const response = await api.get<Usuario>(`/artistas/${id}`);
    return response.data;
  },

  async getPerfilById(id: number): Promise<PerfilArtista | null> {
    try {
      const response = await api.get<PerfilArtista>(`/artistas/${id}/perfil`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getPortfolio(idUsuario: number): Promise<Publicacion[]> {
    const response = await api.get<Publicacion[]>('/publicaciones');
    return response.data.filter((p) => p.usuario?.idUsuario === idUsuario);
  },

  async seguir(idUsuario: number): Promise<void> {
    await api.post(`/usuarios/${idUsuario}/seguir`);
  },

  async dejarDeSeguir(idUsuario: number): Promise<void> {
    await api.delete(`/usuarios/${idUsuario}/seguir`);
  },
};
