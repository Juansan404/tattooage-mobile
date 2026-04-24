import api from './api';
import { SolicitudCita, CrearSolicitudRequest, EstadoSolicitud } from '../types/solicitud.types';

export const solicitudesService = {
  async getMias(): Promise<SolicitudCita[]> {
    const response = await api.get<SolicitudCita[]>('/solicitudes');
    return response.data;
  },

  async getById(id: number): Promise<SolicitudCita> {
    const response = await api.get<SolicitudCita>(`/solicitudes/${id}`);
    return response.data;
  },

  async crear(data: CrearSolicitudRequest): Promise<SolicitudCita> {
    const response = await api.post<SolicitudCita>('/solicitudes', data);
    return response.data;
  },

  async cambiarEstado(id: number, estado: EstadoSolicitud): Promise<SolicitudCita> {
    const response = await api.put<SolicitudCita>(`/solicitudes/${id}/estado`, { estado });
    return response.data;
  },
};
