import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface ARCaptura {
  id: string;
  uri: string;
  creadoEn: string;
}

const KEY = 'ar_capturas';
const DIR = `${FileSystem.documentDirectory}ar_capturas/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

async function getAll(): Promise<ARCaptura[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveList(list: ARCaptura[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export const arCapturasService = {
  async listar(): Promise<ARCaptura[]> {
    return getAll();
  },

  async guardar(tempUri: string): Promise<ARCaptura> {
    await ensureDir();
    const id = `ar_${Date.now()}`;
    const dest = `${DIR}${id}.jpg`;
    await FileSystem.copyAsync({ from: tempUri, to: dest });
    const captura: ARCaptura = { id, uri: dest, creadoEn: new Date().toISOString() };
    const lista = await getAll();
    lista.unshift(captura);
    await saveList(lista);
    return captura;
  },

  async eliminar(id: string): Promise<void> {
    const lista = await getAll();
    const item = lista.find((c) => c.id === id);
    if (item) {
      const info = await FileSystem.getInfoAsync(item.uri);
      if (info.exists) await FileSystem.deleteAsync(item.uri, { idempotent: true });
    }
    await saveList(lista.filter((c) => c.id !== id));
  },
};
