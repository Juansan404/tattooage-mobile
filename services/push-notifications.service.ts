import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export async function registrarPushToken(idUsuario: number): Promise<void> {
  // En Expo Go SDK 53+ las push remotas no están soportadas — saltar silenciosamente
  if (!Device.isDevice || isExpoGo()) return;

  // require() dinámico: el módulo no se carga hasta aquí, evitando el efecto
  // secundario de DevicePushTokenAutoRegistration en Expo Go
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mensajes', {
      name: 'Mensajes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: '01ab27d4-b1b2-4456-aa14-eefed034dc18',
  })).data;

  try {
    await api.put(`/usuarios/${idUsuario}/push-token`, { pushToken: token });
  } catch {}
}
