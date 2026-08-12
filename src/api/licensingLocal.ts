import api from './axios';

export const licensingLocalApi = {
  instalar: async (payload: { empresaId: string; identidadMaquina: string; versionProducto?: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/licensing-local/install', payload);
    return data;
  },
  activar: async (payload: { instalacionId: string; suscripcionId: number }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/licensing-local/activate', payload);
    return data;
  },
  heartbeat: async (payload: { instalacionId: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/licensing-local/heartbeat', payload);
    return data;
  },
  validar: async (instalacionId: string, online = true): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/licensing-local/validate', { params: { instalacionId, online } });
    return data;
  },
  estado: async (instalacionId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get(`/licensing-local/status/${instalacionId}`);
    return data;
  },
  eventos: async (instalacionId: string): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get(`/licensing-local/events/${instalacionId}`);
    return data;
  },
};