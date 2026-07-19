import api from './axios';
import type { ReglaRiesgo, ReglaRiesgoRequest, ReglaHistorialVersion } from '../types';

export const rulesApi = {
  getAll: async (): Promise<ReglaRiesgo[]> => {
    const response = await api.get<ReglaRiesgo[]>('/reglas');
    return response.data;
  },

  getById: async (id: number): Promise<ReglaRiesgo> => {
    const response = await api.get<ReglaRiesgo>(`/reglas/${id}`);
    return response.data;
  },

  getByEscenario: async (escenarioId: number): Promise<ReglaRiesgo[]> => {
    const response = await api.get<ReglaRiesgo[]>(`/reglas/escenario/${escenarioId}`);
    return response.data;
  },

  getByEstado: async (estado: string): Promise<ReglaRiesgo[]> => {
    const response = await api.get<ReglaRiesgo[]>(`/reglas/estado/${estado}`);
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

  activar: async (id: number): Promise<void> => {
    await api.post(`/reglas/${id}/activar`);
  },

  desactivar: async (id: number): Promise<void> => {
    await api.post(`/reglas/${id}/desactivar`);
  },

  crearNuevaVersion: async (id: number): Promise<ReglaRiesgo> => {
    const response = await api.post<ReglaRiesgo>(`/reglas/${id}/version`);
    return response.data;
  },

  getHistorial: async (id: number): Promise<ReglaHistorialVersion[]> => {
    const response = await api.get<ReglaHistorialVersion[]>(`/reglas/${id}/historial`);
    return response.data;
  },
};
