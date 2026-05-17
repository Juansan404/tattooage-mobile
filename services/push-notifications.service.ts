import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Solo funciona en development builds y producción, no en Expo Go (SDK 53+)
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export async function registrarPushToken(idUsuario: number): Promise<void> {
  if (!Device.isDevice || isExpoGo()) return;

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
