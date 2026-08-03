import api from './axios';
import type { WorkloadData } from '../types';

export const assignmentApi = {
  run: async (alertaId: number): Promise<{ message: string; alertaId: number; asignadoA: string }> => {
    const { data } = await api.post('/assignment/run', { alertaId });
    return data;
  },

  rebalance: async (usuarioId?: string): Promise<{ message: string }> => {
    const { data } = await api.post('/assignment/rebalance', { usuarioId });
    return data;
  },

  workload: async (): Promise<WorkloadData[]> => {
    const { data } = await api.get('/assignment/workload');
    return data;
  },
};
