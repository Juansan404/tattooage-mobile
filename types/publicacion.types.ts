import { Usuario } from './usuario.types';
import { Estilo } from './estilo.types';

export interface Publicacion {
  idPublicacion: number;
  usuario?: Usuario;
  fotoUrl: string;
  descripcion?: string;
  estilo?: string;
  estilos?: Estilo[];
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
  usuario?: { idUsuario: number };
  fotoUrl: string;
  descripcion?: string;
  estilos?: string[];
  zonaCuerpo?: string;
}
