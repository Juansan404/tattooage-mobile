import api from './api';
import { Cita, EstadoCita } from '../types/cita.types';

export interface CrearCitaPayload {
  cliente: { idUsuario: number };
  artista: { idUsuario: number };
  fechaCita: string;
  horaInicio?: string;
  duracionAproximada?: number;
  precio?: number;
  sala?: string;
  notas?: string;
}

export interface ActualizarCitaPayload {
  fechaCita?: string;
  horaInicio?: string;
  duracionAproximada?: number;
  precio?: number;
  sala?: string;
  notas?: string;
  estado?: EstadoCita;
}

export const citasService = {
  async getMias(idUsuario: number, rol: string): Promise<Cita[]> {
    const segmento = rol === 'ARTISTA' ? 'artista' : 'cliente';
    const response = await api.get<Cita[]>(`/citas/${segmento}/${idUsuario}`);
    return response.data;
  },

  async getById(id: number): Promise<Cita> {
    const response = await api.get<Cita>(`/citas/${id}`);
    return response.data;
  },

  async crear(payload: CrearCitaPayload): Promise<Cita> {
    const response = await api.post<Cita>('/citas', payload);
    return response.data;
  },

  async actualizar(id: number, datos: ActualizarCitaPayload): Promise<Cita> {
    const response = await api.put<Cita>(`/citas/${id}`, datos);
    return response.data;
  },

  async cambiarEstado(id: number, estado: EstadoCita): Promise<Cita> {
    const response = await api.put<Cita>(`/citas/${id}/estado`, { estado });
    return response.data;
  },

  async cancelar(id: number): Promise<void> {
    await api.delete(`/citas/${id}`);
  },
};
