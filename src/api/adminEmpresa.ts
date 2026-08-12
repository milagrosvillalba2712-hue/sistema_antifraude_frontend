import api from './axios';

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
  apis: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get('/admin-empresa/apis');
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
  sincronizarCatalogos: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.post('/admin-empresa/catalogos/sincronizar');
    return data;
  },
  auditoria: async (): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get('/admin-empresa/auditoria');
    return data;
  },
};
