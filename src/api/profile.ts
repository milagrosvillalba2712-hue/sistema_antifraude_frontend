import api from './axios';
import type { PerfilUsuario, Disponibilidad } from '../types';

export const profileApi = {
  get: async (): Promise<PerfilUsuario> => {
    const { data } = await api.get('/profile');
    return data;
  },

  update: async (payload: { nombreVisible?: string; imagenPerfil?: string }): Promise<PerfilUsuario> => {
    const { data } = await api.put('/profile', payload);
    return data;
  },

  updateStatus: async (estado: string, estadoPersonalizado?: string): Promise<PerfilUsuario> => {
    const { data } = await api.put('/profile/status', { estado, estadoPersonalizado });
    return data;
  },

  updateImage: async (imagen: string): Promise<PerfilUsuario> => {
    const { data } = await api.put('/profile/image', { imagen });
    return data;
  },

  schedule: async (schedule: {
    tipoEstado: string;
    fechaInicio: string;
    fechaFin?: string;
    esProgramado?: boolean;
    motivo?: string;
  }): Promise<Disponibilidad> => {
    const { data } = await api.post('/profile/schedule', schedule);
    return data;
  },
};

export const availabilityApi = {
  list: async (): Promise<Disponibilidad[]> => {
    const { data } = await api.get('/availability');
    return data;
  },

  create: async (payload: {
    tipoEstado: string;
    fechaInicio: string;
    fechaFin?: string;
    esProgramado?: boolean;
    motivo?: string;
  }): Promise<Disponibilidad> => {
    const { data } = await api.post('/availability', payload);
    return data;
  },

  update: async (id: number, payload: {
    tipoEstado: string;
    fechaInicio: string;
    fechaFin?: string;
    motivo?: string;
  }): Promise<Disponibilidad> => {
    const { data } = await api.put(`/availability/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/availability/${id}`);
  },
};
