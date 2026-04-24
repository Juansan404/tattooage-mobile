export type Rol = 'CLIENTE' | 'ARTISTA' | 'ADMIN';

export interface Usuario {
  idUsuario: number;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: Rol;
  avatar?: string;
  bio?: string;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface PerfilArtista {
  idPerfil: number;
  usuario?: Usuario;
  especialidades?: string;
  anosExperiencia?: number;
  portfolioUrl?: string;
  disponible: boolean;
  precioHora?: number;
  instagram?: string;
  creadoEn?: string;
}

export interface Estudio {
  idEstudio: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  web?: string;
  instagram?: string;
  logoUrl?: string;
}

// Respuesta del login/register
export interface AuthResponse {
  token: string;
  idUsuario: number;
  email: string;
  rol: Rol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  rol: Rol;
}
