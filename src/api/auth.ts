import api from './axios';
import type { LoginRequest, LoginResponse } from '../types';

interface Mensaje {
  mensaje: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: { email: string; nombre: string; password: string; codigoInvitacion: string }): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (codigo: string): Promise<Mensaje> => {
    const response = await api.get<Mensaje>('/auth/verify-email', { params: { codigo } });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (codigo: string, nuevaPassword: string): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/reset-password', { codigo, nuevaPassword });
    return response.data;
  },

  changePassword: async (passwordActual: string, nuevaPassword: string): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/change-password', { passwordActual, nuevaPassword });
    return response.data;
  },
};
