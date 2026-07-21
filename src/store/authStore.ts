import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Permission, Rol } from '../types';

interface User {
  usuarioId?: number;
  email: string;
  rol: Rol;
  empresaId?: number | null;
  rolId?: number | null;
  permisos?: Permission[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      },
      hasPermission: (permission) => {
        const { user } = get();
        return user?.permisos?.includes(permission) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
