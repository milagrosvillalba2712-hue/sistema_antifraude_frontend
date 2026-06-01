import api from './axios';
import type { ReglaRiesgo, ReglaRiesgoRequest } from '../types';

export const rulesApi = {
  getAll: async (): Promise<ReglaRiesgo[]> => {
    const response = await api.get<ReglaRiesgo[]>('/reglas');
    return response.data;
  },

  getById: async (id: number): Promise<ReglaRiesgo> => {
    const response = await api.get<ReglaRiesgo>(`/reglas/${id}`);
    return response.data;
  },

  create: async (data: ReglaRiesgoRequest): Promise<ReglaRiesgo> => {
    const response = await api.post<ReglaRiesgo>('/reglas', data);
    return response.data;
  },

  update: async (id: number, data: ReglaRiesgoRequest): Promise<ReglaRiesgo> => {
    const response = await api.put<ReglaRiesgo>(`/reglas/${id}`, data);
    return response.data;
  },

  toggle: async (id: number): Promise<void> => {
    await api.post(`/reglas/${id}/toggle`);
  },
};
