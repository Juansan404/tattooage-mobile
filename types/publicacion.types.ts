import { Usuario } from './usuario.types';

export interface Publicacion {
  idPublicacion: number;
  usuario?: Usuario;
  fotoUrl: string;
  descripcion?: string;
  estilo?: string;
  zonaCuerpo?: string;
  likesCount?: number;
  creadoEn: string;
  actualizadoEn?: string;
}

export interface Comentario {
  idComentario: number;
  usuario?: Usuario;
  contenido: string;
  creadoEn: string;
}

export interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface CrearPublicacionRequest {
  fotoUrl: string;
  descripcion?: string;
  estilo?: string;
  zonaCuerpo?: string;
}
