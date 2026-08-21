import api from './axios';
import type { LoginRequest, LoginResponse } from '../types';

interface Mensaje {
  mensaje: string;
}

interface InvitacionInfo {
  valido: boolean;
  email?: string;
  rol?: string;
  empresa?: string;
  mensaje?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: {
    email: string;
    nombre: string;
    password: string;
    codigoInvitacion: string;
    aceptoTerminos: boolean;
    aceptoPrivacidad: boolean;
    recaptchaToken?: string;
    fotoPerfilUrl?: string;
  }): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/register', data);
    return response.data;
  },

  validarInvitacion: async (codigo: string): Promise<InvitacionInfo> => {
    const response = await api.get<InvitacionInfo>('/auth/invitacion/validar', { params: { codigo } });
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

  resetPassword: async (codigo: string, nuevaPassword: string, recaptchaToken: string): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/reset-password', { codigo, nuevaPassword, recaptchaToken });
    return response.data;
  },

  changePassword: async (passwordActual: string, nuevaPassword: string): Promise<Mensaje> => {
    const response = await api.post<Mensaje>('/auth/change-password', { passwordActual, nuevaPassword });
    return response.data;
  },
};
