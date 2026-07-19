import api from './axios';
import type {
  Alerta,
  AlertaDetalle,
  AnalistaDisponible,
  HistorialAsignacion,
  ResolucionAlerta,
  ResolucionAlertaRequest,
  TimelineEvent,
} from '../types';

export const alertsApi = {
  getAll: async (): Promise<Alerta[]> => {
    const response = await api.get<Alerta[]>('/alertas');
    return response.data;
  },

  getById: async (id: number): Promise<Alerta> => {
    const response = await api.get<Alerta>(`/alertas/${id}`);
    return response.data;
  },

  getDetail: async (id: number): Promise<AlertaDetalle> => {
    const response = await api.get<AlertaDetalle>(`/alertas/${id}/detalle`);
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

  autoasignarme: async (id: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/autoasignarme`);
    return response.data;
  },

  getAnalistasDisponibles: async (): Promise<AnalistaDisponible[]> => {
    const response = await api.get<AnalistaDisponible[]>('/alertas/analistas-disponibles');
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

  resolverFormal: async (id: number, data: ResolucionAlertaRequest): Promise<ResolucionAlerta> => {
    const response = await api.post<ResolucionAlerta>(`/alertas/${id}/resolver-formal`, data);
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
