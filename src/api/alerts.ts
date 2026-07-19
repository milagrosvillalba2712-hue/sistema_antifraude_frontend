import api from './axios';
import type { Alerta, HistorialAsignacion, TimelineEvent } from '../types';

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

  countUnassigned: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/alertas/sin-asignar/count');
    return response.data.count;
  },

  asignar: async (id: number, analistaId?: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/asignar`, { analistaId });
    return response.data;
  },

  reasignar: async (id: number, analistaId: number, motivo?: string): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/reassign`, { analistaId, motivo });
    return response.data;
  },

  resolver: async (id: number, observacion: string): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/resolver`, { observacion });
    return response.data;
  },

  cerrar: async (id: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/cerrar`);
    return response.data;
  },

  getHistory: async (id: number): Promise<HistorialAsignacion[]> => {
    const response = await api.get<HistorialAsignacion[]>(`/alertas/${id}/history`);
    return response.data;
  },

  getTimeline: async (id: number): Promise<TimelineEvent[]> => {
    const response = await api.get<TimelineEvent[]>(`/alertas/${id}/timeline`);
    return response.data;
  },
};
