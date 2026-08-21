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
  verificarRoles: async (rolCodigo: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/solicitud-roles/verificar', { params: { rolCodigo } });
    return data;
  },
  crearSolicitudRoles: async (datos: { tipoRol: string; cantidad: number; motivo: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/solicitud-roles', {
      rolCodigo: datos.tipoRol,
      cantidad: datos.cantidad,
      observacion: datos.motivo,
    });
    return data;
  },
  pagarSolicitudRoles: async (solicitudId: number, body?: { successUrl?: string; cancelUrl?: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post(`/admin-empresa/solicitud-roles/${solicitudId}/pagar`, body ?? {});
    return data;
  },
  confirmarPagoSolicitudRoles: async (sessionId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/solicitud-roles/stripe-confirmar', { sessionId });
    return data;
  },
};
