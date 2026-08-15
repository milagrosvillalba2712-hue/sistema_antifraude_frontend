import api from './axios';
import type { Usuario, UsuarioRequest } from '../types';

export const usersApi = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/admin/users');
    return response.data;
  },

  getById: async (id: string): Promise<Usuario> => {
    const response = await api.get<Usuario>(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data: UsuarioRequest): Promise<Usuario> => {
    const response = await api.post<Usuario>('/admin/users', toApiPayload(data));
    return response.data;
  },

  update: async (id: string, data: UsuarioRequest): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/admin/users/${id}`, toApiPayload(data));
    return response.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  crearInvitacion: async (payload: { rol: string; empresaId: string; email?: string }): Promise<Record<string, unknown>> => {
    const response = await api.post('/admin/invitaciones', payload);
    return response.data;
  },
};

const toApiPayload = (data: UsuarioRequest) => ({
  nombre: data.nombreCompleto,
  email: data.email,
  password: data.password,
  rol: data.rol,
  empresaId: data.empresaId === '' || data.empresaId == null
    ? null
    : data.empresaId,
});
