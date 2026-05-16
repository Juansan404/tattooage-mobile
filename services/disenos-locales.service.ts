import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface DisenoLocal {
  id: string;
  nombre: string;
  uri: string;
  creadoEn: string;
}

const KEY = 'disenos_creados';
const DIR = `${FileSystem.documentDirectory}disenos/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

async function getAll(): Promise<DisenoLocal[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveList(list: DisenoLocal[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export const disenosLocalesService = {
  async listar(): Promise<DisenoLocal[]> {
    return getAll();
  },

  async guardar(tempUri: string, nombre: string): Promise<DisenoLocal> {
    await ensureDir();
    const id = `diseno_${Date.now()}`;
    const dest = `${DIR}${id}.png`;
    await FileSystem.copyAsync({ from: tempUri, to: dest });

    const diseno: DisenoLocal = { id, nombre, uri: dest, creadoEn: new Date().toISOString() };
    const lista = await getAll();
    lista.unshift(diseno);
    await saveList(lista);
    return diseno;
  },

  async eliminar(id: string): Promise<void> {
    const lista = await getAll();
    const diseno = lista.find((d) => d.id === id);
    if (diseno) {
      const info = await FileSystem.getInfoAsync(diseno.uri);
      if (info.exists) await FileSystem.deleteAsync(diseno.uri, { idempotent: true });
    }
    await saveList(lista.filter((d) => d.id !== id));
  },
};
