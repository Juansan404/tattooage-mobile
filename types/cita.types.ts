import { Usuario } from './usuario.types';

export type EstadoCita = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';

export interface Cita {
  idCita: number;
  cliente?: Usuario;
  artista?: Usuario;
  fechaCita: string;
  horaInicio?: string;
  duracionAproximada?: number;
  precio?: number;
  estado: EstadoCita;
  sala?: string;
  fotoDiseno?: string;
  notas?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}
