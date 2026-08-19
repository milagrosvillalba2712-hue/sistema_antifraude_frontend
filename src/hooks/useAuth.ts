import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authApi, terminosCondicionesApi } from '../api';
import type { LoginRequest, LoginErrorDetails } from '../types';

export interface SignInResult {
  success: boolean;
  error?: string;
  field?: 'email' | 'password';
  codigo?: string;
  detalles?: LoginErrorDetails;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated, user, hasPermission } = useAuthStore();

  const signIn = async (data: LoginRequest): Promise<SignInResult> => {
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
      try {
        const pendientes = await terminosCondicionesApi.getPendientes();
        if (pendientes.requiereAceptacion) {
          useAuthStore.getState().setAceptoTerminos(false);
          navigate('/acepte-terminos');
        } else {
          useAuthStore.getState().setAceptoTerminos(true);
          if (response.rol === 'ADMINISTRADOR') {
            navigate('/admin-empresa');
          } else {
            navigate('/dashboard');
          }
        }
      } catch {
        useAuthStore.getState().setAceptoTerminos(true);
        if (response.rol === 'ADMINISTRADOR') {
          navigate('/admin-empresa');
        } else {
          navigate('/dashboard');
        }
      }
      return { success: true };
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            codigo_error?: string;
            detalles?: LoginErrorDetails;
          };
        };
      };
      const codigo = err.response?.data?.codigo_error;
      const message = err.response?.data?.message || 'Error al iniciar sesion';

      let field: 'email' | 'password' | undefined;
      if (codigo === 'USER_NOT_FOUND' || codigo === 'ACCOUNT_DISABLED') {
        field = 'email';
      } else if (codigo === 'BAD_PASSWORD' || codigo === 'ACCOUNT_LOCKED') {
        field = 'password';
      }

      return {
        success: false,
        error: message,
        field,
        codigo,
        detalles: err.response?.data?.detalles,
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
