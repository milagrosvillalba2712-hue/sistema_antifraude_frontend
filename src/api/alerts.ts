import api from './axios';
import type { Alerta } from '../types';

export const alertsApi = {
  getAll: async (): Promise<Alerta[]> => {
    const response = await api.get<Alerta[]>('/alertas');
    return response.data;
  },

  getById: async (id: number): Promise<Alerta> => {
    const response = await api.get<Alerta>(`/alertas/${id}`);
    return response.data;
  },

  getByEstado: async (estado: string): Promise<Alerta[]> => {
    const response = await api.get<Alerta[]>(`/alertas/estado/${estado}`);
    return response.data;
  },

  asignar: async (id: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/asignar`);
    return response.data;
  },

  resolver: async (id: number, observacion: string): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/resolver`, { observacion });
    return response.data;
  },
};
