import api from './axios';

export const reportsApi = {
  exportRos: async (alertaId: number): Promise<Blob> => {
    const response = await api.get(`/reportes/ros/${alertaId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
