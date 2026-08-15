import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi } from '../api';
import type { LoginRequest } from '../types';

export const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, hasPermission } = useAuthStore();

  const signIn = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      login(response.token, {
        usuarioId: response.usuarioId,
        email: response.email,
        rol: response.rol,
        empresaId: response.empresaId,
        rolId: response.rolId,
        permisos: response.permisos || [],
      });
      if (response.rol === 'ADMINISTRADOR') {
        navigate('/admin-empresa');
      } else {
        navigate('/dashboard');
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return {
    signIn,
    signOut,
    isAuthenticated,
    user,
    hasPermission,
  };
};
