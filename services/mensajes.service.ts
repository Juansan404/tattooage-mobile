import api from './api';
import { Mensaje, EnviarMensajeRequest } from '../types/solicitud.types';

export const mensajesService = {
  async getMensajesDeSolicitud(idSolicitud: number): Promise<Mensaje[]> {
    const response = await api.get<Mensaje[]>(`/mensajes/solicitud/${idSolicitud}`);
    return response.data;
  },

  async enviar(data: EnviarMensajeRequest): Promise<Mensaje> {
    const response = await api.post<Mensaje>('/mensajes', data);
    return response.data;
  },

  async marcarLeido(idMensaje: number): Promise<void> {
    await api.put(`/mensajes/${idMensaje}/leido`);
  },

  async getConversaciones(): Promise<any[]> {
    const response = await api.get('/mensajes/conversaciones');
    return response.data;
  },
};
