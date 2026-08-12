import { create } from 'zustand';
import { alertsApi } from '../api';
import type { Alerta, AlertFilters } from '../types';

interface AlertState {
  alerts: Alerta[];
  selectedAlert: Alerta | null;
  filters: AlertFilters;
  currentPage: number;
  itemsPerPage: number;
  loading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  selectAlert: (alert: Alerta | null) => void;
  setFilters: (filters: Partial<AlertFilters>) => void;
  setCurrentPage: (page: number) => void;
  filteredAlerts: () => Alerta[];
  totalPages: () => number;
  paginatedAlerts: () => Alerta[];
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  selectedAlert: null,
  filters: { search: '', estado: '', prioridad: '' },
  currentPage: 1,
  itemsPerPage: 10,
  loading: false,
  error: null,

  fetchAlerts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await alertsApi.getAll();
      set({ alerts: data.content, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar las alertas', loading: false });
      console.error(err);
    }
  },

  selectAlert: (alert) => set({ selectedAlert: alert }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1,
    })),

  setCurrentPage: (page) => set({ currentPage: page }),

  filteredAlerts: () => {
    const { alerts, filters } = get();
    return alerts.filter((alert) => {
      const matchesSearch =
        !filters.search ||
        alert.observacion?.toLowerCase().includes(filters.search.toLowerCase()) ||
        alert.id.toString().includes(filters.search);
      const matchesEstado = !filters.estado || alert.estado === filters.estado;
      const matchesPrioridad = !filters.prioridad || alert.prioridad === filters.prioridad;
      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  },

  totalPages: () => {
    const { itemsPerPage } = get();
    return Math.ceil(get().filteredAlerts().length / itemsPerPage);
  },

  paginatedAlerts: () => {
    const { currentPage, itemsPerPage } = get();
    const filtered = get().filteredAlerts();
    return filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  },
}));
