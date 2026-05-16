import { create } from 'zustand';
import { AuthResponse, Rol } from '../types/usuario.types';
import { authService } from '../services/auth.service';
import api from '../services/api';

interface AuthState {
  token: string | null;
  idUsuario: number | null;
  email: string | null;
  rol: Rol | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; nombre: string; apellidos?: string; rol: Rol }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setSession: (data: AuthResponse) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  idUsuario: null,
  email: null,
  rol: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (data: AuthResponse) => {
    set({
      token: data.token,
      idUsuario: data.idUsuario,
      email: data.email,
      rol: data.rol,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const data = await authService.login({ email, password });
    set({
      token: data.token,
      idUsuario: data.idUsuario,
      email: data.email,
      rol: data.rol,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (formData) => {
    const data = await authService.register(formData);
    if (data.estadoRegistro === 'ACTIVO') {
      set({
        token: data.token,
        idUsuario: data.idUsuario,
        email: data.email,
        rol: data.rol,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // PENDIENTE: guardar email para polling, no autenticar
      set({ email: data.email, idUsuario: data.idUsuario, isLoading: false });
    }
    return data;
  },

  logout: async () => {
    await authService.logout();
    set({
      token: null,
      idUsuario: null,
      email: null,
      rol: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    const session = await authService.getStoredSession();
    if (session && session.token) {
      set({
        token: session.token,
        idUsuario: session.idUsuario,
        email: session.email,
        rol: session.rol,
        isAuthenticated: true,
        isLoading: false,
      });
      try {
        const res = await api.get<{ rol: string }>(`/usuarios/${session.idUsuario}`);
        const rolServidor = res.data?.rol as Rol | undefined;
        if (rolServidor && rolServidor !== session.rol) {
          const updatedSession = { ...session, rol: rolServidor };
          await authService.saveSession(updatedSession);
          set({ rol: rolServidor });
        }
      } catch {
        // Si falla la red, seguimos con el rol guardado
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
