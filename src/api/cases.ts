import api from './axios';
import type { Caso } from '../types';

export const casesApi = {
  getAll: async (): Promise<Caso[]> => {
    const response = await api.get<Caso[]>('/casos');
    return response.data;
  },

  getById: async (id: number): Promise<Caso> => {
    const response = await api.get<Caso>(`/casos/${id}`);
    return response.data;
  },

  getByEstado: async (estado: string): Promise<Caso[]> => {
    const response = await api.get<Caso[]>(`/casos/estado/${estado}`);
    return response.data;
  },

  create: async (data: Partial<Caso>): Promise<Caso> => {
    const response = await api.post<Caso>('/casos', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Caso>): Promise<Caso> => {
    const response = await api.put<Caso>(`/casos/${id}`, data);
    return response.data;
  },

  cambiarEstado: async (id: number, estado: string): Promise<Caso> => {
    const response = await api.patch<Caso>(`/casos/${id}/estado?estado=${estado}`);
    return response.data;
  },

  asignarAnalista: async (id: number, analistaId: string): Promise<Caso> => {
    const response = await api.patch<Caso>(`/casos/${id}/asignar?analistaId=${analistaId}`);
    return response.data;
  },
};
