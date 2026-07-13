import api from './axios';
import type { Escenario } from '../types';

export const escenariosApi = {
  getAll: async (): Promise<Escenario[]> => {
    const response = await api.get<Escenario[]>('/escenarios');
    return response.data;
  },

  getById: async (id: number): Promise<Escenario> => {
    const response = await api.get<Escenario>(`/escenarios/${id}`);
    return response.data;
  },

  create: async (data: Partial<Escenario>): Promise<Escenario> => {
    const response = await api.post<Escenario>('/escenarios', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Escenario>): Promise<Escenario> => {
    const response = await api.put<Escenario>(`/escenarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/escenarios/${id}`);
  },
};
