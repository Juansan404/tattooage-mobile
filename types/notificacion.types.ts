import { Usuario } from './usuario.types';

export type TipoNotificacion = 'LIKE' | 'COMENTARIO' | 'SEGUIDOR' | 'SOLICITUD' | 'VERIFICACION' | 'REVISION_ADMIN' | 'APROBADA' | 'RECHAZADA';

export interface Notificacion {
  idNotificacion: number;
  receptor?: Usuario;
  emisor?: Usuario;
  tipo: TipoNotificacion;
  idReferencia?: number;
  leida: boolean;
  creadoEn: string;
}
