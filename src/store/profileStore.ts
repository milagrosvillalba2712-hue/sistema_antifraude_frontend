import { create } from 'zustand';
import { profileApi, availabilityApi } from '../api';
import type { PerfilUsuario, Disponibilidad } from '../types';

interface ProfileState {
  profile: PerfilUsuario | null;
  availability: Disponibilidad[];
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  fetchAvailability: () => Promise<void>;
  updateProfile: (data: { nombreVisible?: string; imagenPerfil?: string }) => Promise<void>;
  updateStatus: (estado: string, estadoPersonalizado?: string) => Promise<void>;
  updateImage: (imagen: string) => Promise<void>;
  createSchedule: (schedule: {
    tipoEstado: string;
    fechaInicio: string;
    fechaFin?: string;
    esProgramado?: boolean;
    motivo?: string;
  }) => Promise<void>;
  cancelSchedule: (id: number) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  availability: [],
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const data = await profileApi.get();
      set({ profile: data, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar perfil', loading: false });
      console.error(err);
    }
  },

  fetchAvailability: async () => {
    try {
      const data = await availabilityApi.list();
      set({ availability: data });
    } catch (err) {
      console.error(err);
    }
  },

  updateProfile: async (data) => {
    try {
      const updated = await profileApi.update(data);
      set({ profile: updated });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateStatus: async (estado, estadoPersonalizado) => {
    try {
      const updated = await profileApi.updateStatus(estado, estadoPersonalizado);
      set({ profile: updated });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateImage: async (imagen) => {
    try {
      const updated = await profileApi.updateImage(imagen);
      set({ profile: updated });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  createSchedule: async (schedule) => {
    try {
      await availabilityApi.create(schedule);
      await get().fetchAvailability();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  cancelSchedule: async (id) => {
    try {
      await availabilityApi.delete(id);
      await get().fetchAvailability();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
}));
