import api from './api';
import { Publicacion, Comentario, CrearPublicacionRequest } from '../types/publicacion.types';

export const publicacionesService = {
  async getFeed(): Promise<Publicacion[]> {
    const response = await api.get<Publicacion[]>('/publicaciones');
    return response.data;
  },

  async getById(id: number): Promise<Publicacion> {
    const response = await api.get<Publicacion>(`/publicaciones/${id}`);
    return response.data;
  },

  async crear(data: CrearPublicacionRequest): Promise<Publicacion> {
    const response = await api.post<Publicacion>('/publicaciones', data);
    return response.data;
  },

  async editar(id: number, data: Partial<CrearPublicacionRequest>): Promise<Publicacion> {
    const response = await api.put<Publicacion>(`/publicaciones/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<void> {
    await api.delete(`/publicaciones/${id}`);
  },

  async toggleLike(idPublicacion: number, idUsuario: number): Promise<{ liked: boolean; likesCount: number }> {
    const response = await api.post(`/publicaciones/${idPublicacion}/like`, { idUsuario });
    return response.data;
  },

  async getLikeStatus(idPublicacion: number, idUsuario: number): Promise<{ liked: boolean; likesCount: number }> {
    const response = await api.get(`/publicaciones/${idPublicacion}/like/${idUsuario}`);
    return response.data;
  },

  async getComentarios(id: number): Promise<Comentario[]> {
    const response = await api.get<Comentario[]>(`/comentarios/publicacion/${id}`);
    return response.data;
  },

  async comentar(idPublicacion: number, idUsuario: number, contenido: string): Promise<Comentario> {
    const response = await api.post<Comentario>('/comentarios', {
      publicacion: { idPublicacion },
      usuario: { idUsuario },
      contenido,
    });
    return response.data;
  },

  async eliminarComentario(idComentario: number): Promise<void> {
    await api.delete(`/comentarios/${idComentario}`);
  },
};
