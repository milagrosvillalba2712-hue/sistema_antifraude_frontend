import api from './axios';
import type { JobLocalUpdateRequest } from '../types';

export const adminEmpresaApi = {
  resumen: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/resumen');
    return data;
  },
  licencia: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/licencia');
    return data;
  },
  validarLicencia: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/licencia/validar');
    return data;
  },
  consumo: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/consumo');
    return data;
  },
  pagos: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/admin-empresa/pagos');
    return data;
  },
  recibos: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/recibos');
    return data;
  },
  iniciarPagoStripe: async (body?: { successUrl?: string; cancelUrl?: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/pagos/stripe-checkout', body ?? {});
    return data;
  },
  confirmarPagoStripe: async (sessionId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/pagos/stripe-confirmar', { sessionId });
    return data;
  },
  apis: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/apis');
    return data;
  },
  errores: async (params?: { status?: string; origen?: string; desde?: string; hasta?: string }): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/errores', { params });
    return data;
  },
  systemOverview: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/system-overview');
    return data;
  },
  conectividad: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/conectividad');
    return data;
  },
  usuarios: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/admin-empresa/usuarios');
    return data;
  },
  configuracion: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/configuracion');
    return data;
  },
  actualizarParametro: async (codigo: string, detalle: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const { data } = await api.patch(`/admin-empresa/configuracion/parametros/${codigo}`, detalle);
    return data;
  },
  configuracionJobsUpdate: async (codigo: string, body: JobLocalUpdateRequest): Promise<Record<string, unknown>> => {
    const { data } = await api.patch(`/admin-empresa/configuracion/jobs/${codigo}`, body);
    return data;
  },
  configuracionJobsRun: async (codigo: string): Promise<Record<string, unknown>> => {
    const { data } = await api.post(`/admin-empresa/configuracion/jobs/${codigo}/ejecutar`);
    return data;
  },
  auditoria: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/admin-empresa/auditoria');
    return data;
  },
};
