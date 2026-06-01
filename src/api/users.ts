import api from './axios';
import type { Usuario, UsuarioRequest } from '../types';

export const usersApi = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/admin/users');
    return response.data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const response = await api.get<Usuario>(`/admin/users/${id}`);
    return response.data;
  },

  create: async (data: UsuarioRequest): Promise<Usuario> => {
    const response = await api.post<Usuario>('/admin/users', data);
    return response.data;
  },

  update: async (id: number, data: UsuarioRequest): Promise<Usuario> => {
    const response = await api.put<Usuario>(`/admin/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },
};
