import { Usuario } from './usuario.types';

export interface Conversacion {
  idConversacion: number;
  usuario1: Usuario;
  usuario2: Usuario;
  creadoEn: string;
  ultimoMensaje?: MensajeDirecto;
  noLeidos?: number;
}

export interface MensajeDirecto {
  idMensaje: number;
  conversacion?: { idConversacion: number };
  remitente: Usuario;
  contenido: string;
  leido: boolean;
  creadoEn: string;
}
