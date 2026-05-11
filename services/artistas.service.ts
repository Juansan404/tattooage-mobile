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

  async toggleSeguir(idSeguido: number, idSeguidor: number): Promise<{ siguiendo: boolean; seguidores: number }> {
    const res = await api.post(`/usuarios/${idSeguido}/seguir`, { idUsuario: idSeguidor });
    return res.data;
  },

  async getEstadoSeguir(idSeguido: number, idSeguidor: number): Promise<{ siguiendo: boolean; seguidores: number; seguidos: number }> {
    const res = await api.get(`/usuarios/${idSeguido}/seguir/${idSeguidor}`);
    return res.data;
  },

  async getContadores(idUsuario: number): Promise<{ seguidores: number; seguidos: number }> {
    const res = await api.get(`/usuarios/${idUsuario}/contadores`);
    return res.data;
  },

  async buscarUsuarios(nombre: string): Promise<Usuario[]> {
    const res = await api.get<Usuario[]>(`/usuarios/buscar?nombre=${encodeURIComponent(nombre)}`);
    return res.data;
  },

  async getSeguidores(idUsuario: number): Promise<Usuario[]> {
    const res = await api.get<Usuario[]>(`/usuarios/${idUsuario}/seguidores`);
    return res.data;
  },

  async getSeguidos(idUsuario: number): Promise<Usuario[]> {
    const res = await api.get<Usuario[]>(`/usuarios/${idUsuario}/seguidos`);
    return res.data;
  },
};
