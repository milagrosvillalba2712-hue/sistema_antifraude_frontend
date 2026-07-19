import api from './axios';

export const licensingApi = {
  empresas: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/empresas');
    return data;
  },
  planes: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/planes');
    return data;
  },
  suscripciones: async (empresaId?: number | null): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/suscripciones', { params: empresaId ? { empresaId } : undefined });
    return data;
  },
  pagos: async (empresaId?: number | null): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/pagos', { params: empresaId ? { empresaId } : undefined });
    return data;
  },
  uso: async (empresaId?: number | null): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/uso', { params: empresaId ? { empresaId } : undefined });
    return data;
  },
  roles: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/roles');
    return data;
  },
  permisos: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/permisos');
    return data;
  },
};
