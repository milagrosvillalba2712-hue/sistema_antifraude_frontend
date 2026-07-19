import { create } from 'zustand';
import { assignmentApi } from '../api';
import type { WorkloadData } from '../types';

interface AssignmentState {
  workload: WorkloadData[];
  loading: boolean;
  error: string | null;
  fetchWorkload: () => Promise<void>;
  rebalance: (usuarioId?: number) => Promise<void>;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  workload: [],
  loading: false,
  error: null,

  fetchWorkload: async () => {
    set({ loading: true, error: null });
    try {
      const data = await assignmentApi.workload();
      set({ workload: data, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar carga de trabajo', loading: false });
      console.error(err);
    }
  },

  rebalance: async (usuarioId) => {
    try {
      await assignmentApi.rebalance(usuarioId);
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
}));
