import api from './axios';
import type { SimuladorRequest, SimuladorResponse } from '../types';

export const simuladorApi = {
  evaluar: async (data: SimuladorRequest): Promise<SimuladorResponse> => {
    const response = await api.post<SimuladorResponse>('/simulador/evaluar', data);
    return response.data;
  },
};
