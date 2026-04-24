import { Usuario } from './usuario.types';

export type EstadoSolicitud = 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Completada';

export interface SolicitudCita {
  idSolicitud: number;
  cliente?: Usuario;
  artista?: Usuario;
  descripcion?: string;
  zonaCuerpo?: string;
  tamano?: string;
  presupuestoAprox?: number;
  fechaPreferida?: string;
  fotoReferencia?: string;
  estado: EstadoSolicitud;
  notasArtista?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface Mensaje {
  idMensaje: number;
  remitente?: Usuario;
  contenido: string;
  leido: boolean;
  creadoEn: string;
}

export interface CrearSolicitudRequest {
  cliente: { idUsuario: number };
  artista: { idUsuario: number };
  descripcion: string;
  zonaCuerpo?: string;
  tamano?: string;
  presupuestoAprox?: number;
  fotoReferencia?: string;
}

export interface EnviarMensajeRequest {
  solicitud: { idSolicitud: number };
  remitente: { idUsuario: number };
  contenido: string;
}
