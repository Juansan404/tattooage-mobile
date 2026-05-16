export interface Valoracion {
  idValoracion: number;
  puntuacion: number;
  comentario?: string;
  creadoEn: string;
  cliente: {
    idUsuario: number;
    nombre: string;
    apellidos?: string;
    avatar?: string;
  };
}

export interface ResumenValoracion {
  media: number;
  total: number;
}
