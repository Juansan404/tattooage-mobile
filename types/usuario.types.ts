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
  estudio?: Estudio;
  creadoEn?: string;
}

export interface Estudio {
  idEstudio: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  web?: string;
  instagram?: string;
  localizacion?: string;
  fotoPortada?: string;
}

export type EstadoRegistro = 'ACTIVO' | 'PENDIENTE' | 'RECHAZADO';

// Respuesta del login/register
export interface AuthResponse {
  token: string | null;
  idUsuario: number;
  email: string;
  rol: Rol;
  estadoRegistro: EstadoRegistro;
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
