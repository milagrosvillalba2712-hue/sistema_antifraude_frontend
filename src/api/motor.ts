import api from './axios';
import type { EjecucionRegla } from '../types';

export const motorApi = {
  getHistorial: async (): Promise<EjecucionRegla[]> => {
    const response = await api.get<EjecucionRegla[]>('/motor/historial');
    return response.data;
  },

  getHistorialByTransaccion: async (transaccionId: number): Promise<EjecucionRegla[]> => {
    const response = await api.get<EjecucionRegla[]>(`/motor/historial/transaccion/${transaccionId}`);
    return response.data;
  },

  getHistorialByRegla: async (reglaId: number): Promise<EjecucionRegla[]> => {
    const response = await api.get<EjecucionRegla[]>(`/motor/historial/regla/${reglaId}`);
    return response.data;
  },
};
