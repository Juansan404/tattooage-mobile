import api from './api';
import { Publicacion, Comentario, CrearPublicacionRequest, PageResponse } from '../types/publicacion.types';

export const publicacionesService = {
  async getFeed(): Promise<Publicacion[]> {
    const response = await api.get<Publicacion[]>('/publicaciones');
    return response.data;
  },

  async getFeedPage(page: number, size = 15): Promise<PageResponse<Publicacion>> {
    const response = await api.get<PageResponse<Publicacion>>(
      `/publicaciones?page=${page}&size=${size}`
    );
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

  async getComentariosCount(id: number): Promise<number> {
    const response = await api.get<number>(`/comentarios/publicacion/${id}/count`);
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

  async toggleGuardar(idPublicacion: number, idUsuario: number): Promise<{ guardado: boolean }> {
    const response = await api.post(`/publicaciones/${idPublicacion}/guardar`, { idUsuario });
    return response.data;
  },

  async getGuardadoStatus(idPublicacion: number, idUsuario: number): Promise<{ guardado: boolean }> {
    const response = await api.get(`/publicaciones/${idPublicacion}/guardado/${idUsuario}`);
    return response.data;
  },

  async getGuardadas(idUsuario: number): Promise<Publicacion[]> {
    const response = await api.get<Publicacion[]>(`/publicaciones/guardadas/${idUsuario}`);
    return response.data;
  },
};
