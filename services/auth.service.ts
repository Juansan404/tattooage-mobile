import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { STORAGE_KEYS } from '../constants/config';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/usuario.types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    const { token } = response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    const { token } = response.data;
    await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.JWT_TOKEN, STORAGE_KEYS.USER_DATA]);
  },

  async getStoredSession(): Promise<AuthResponse | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  },
};
