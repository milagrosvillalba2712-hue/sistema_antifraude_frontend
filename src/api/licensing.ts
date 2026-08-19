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
  suscripciones: async (empresaId?: string | null): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/suscripciones', { params: empresaId ? { empresaId } : undefined });
    return data;
  },
  pagos: async (empresaId?: string | null): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/licensing/pagos', { params: empresaId ? { empresaId } : undefined });
    return data;
  },
  uso: async (empresaId?: string | null): Promise<Record<string, unknown>[]> => {
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
  limites: async (empresaId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/licensing/limites', { params: { empresaId } });
    return data;
  },
  preciosRol: async (planId: number): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get(`/licensing/planes/${planId}/precios-rol`);
    return data;
  },

  // Solicitud de roles adicionales
  verificarRoles: async (empresaId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/licensing/solicitud-roles/verificar', { params: { empresaId } });
    return data;
  },
  crearSolicitudRoles: async (datos: { empresaId: string; tipoRol: string; cantidad: number; motivo: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/licensing/solicitud-roles', datos);
    return data;
  },
  pagarSolicitudRoles: async (solicitudId: number): Promise<Record<string, unknown>> => {
    const { data } = await api.post(`/licensing/solicitud-roles/${solicitudId}/pagar`);
    return data;
  },
};
