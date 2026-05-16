import * as FileSystem from 'expo-file-system/legacy';
import api from './api';

export interface DisenoLocal {
  id: string;
  nombre: string;
  uri: string;
  creadoEn: string;
}

interface DisenoBackend {
  idDiseno: number;
  nombre: string;
  fotoUrl: string;
  creadoEn: string;
}

function toLocal(d: DisenoBackend): DisenoLocal {
  return {
    id: String(d.idDiseno),
    nombre: d.nombre,
    uri: d.fotoUrl,
    creadoEn: d.creadoEn,
  };
}

export const disenosLocalesService = {
  async listar(idUsuario: number): Promise<DisenoLocal[]> {
    const res = await api.get<DisenoBackend[]>(`/disenos-creados/usuario/${idUsuario}`);
    return res.data.map(toLocal);
  },

  async guardar(tempUri: string, nombre: string, idUsuario: number): Promise<DisenoLocal> {
    const b64 = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fotoUrl = `data:image/png;base64,${b64}`;
    const res = await api.post<DisenoBackend>('/disenos-creados', { idUsuario, nombre, fotoUrl });
    return toLocal(res.data);
  },

  async eliminar(id: string): Promise<void> {
    await api.delete(`/disenos-creados/${id}`);
  },
};
