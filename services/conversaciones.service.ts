import api from './api';
import { Conversacion, MensajeDirecto } from '../types/conversacion.types';

export const conversacionesService = {
  async getByUsuario(idUsuario: number): Promise<Conversacion[]> {
    const r = await api.get<Conversacion[]>(`/conversaciones/usuario/${idUsuario}`);
    return r.data;
  },

  async findOrCreate(idUsuario1: number, idUsuario2: number): Promise<Conversacion> {
    const r = await api.post<Conversacion>('/conversaciones/find-or-create', {
      idUsuario1,
      idUsuario2,
    });
    return r.data;
  },

  async getMensajes(idConversacion: number, idUsuario?: number): Promise<MensajeDirecto[]> {
    const params = idUsuario ? `?idUsuario=${idUsuario}` : '';
    const r = await api.get<MensajeDirecto[]>(`/conversaciones/${idConversacion}/mensajes${params}`);
    return r.data;
  },

  async enviarMensaje(idConversacion: number, idRemitente: number, contenido: string): Promise<MensajeDirecto> {
    const r = await api.post<MensajeDirecto>(`/conversaciones/${idConversacion}/mensajes`, {
      idRemitente,
      contenido,
    });
    return r.data;
  },

  async countNoLeidos(idUsuario: number): Promise<number> {
    const r = await api.get<{ count: number }>(`/conversaciones/no-leidos/${idUsuario}`);
    return r.data.count;
  },
};
