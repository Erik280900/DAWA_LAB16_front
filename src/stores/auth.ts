import { create } from 'zustand';
import api from '@/lib/api';
import { AuthState, ApiResponse, User } from '@/types';
import { toast } from 'react-hot-toast';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ user: User; token: string }> = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, token } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      toast.success('¡Bienvenido de vuelta!');
      
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: { username: string; email: string; password: string }) => {
    try {
      set({ isLoading: true });
      
      const response: ApiResponse<{ user: User; token: string }> = await api.post('/auth/register', data);
      
      const { user, token } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({ user, token, isLoading: false });
      toast.success('¡Cuenta creada exitosamente!');
      
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    set({ user: null, token: null });
    toast.success('Sesión cerrada');
    
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  initializeAuth: () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token });
      }
    } catch (error) {
      console.error('Error al inicializar auth:', error);
      // Limpiar localStorage si hay error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
}));