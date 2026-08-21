import api from './axios';
import type {
  ElementoListaControl,
  ElementoListaControlRequest,
  ImportacionListaControl,
  ListaControl,
  ListaControlRequest,
} from '../types';

export const listasControlApi = {
  async listar(): Promise<ListaControl[]> {
    const response = await api.get<ListaControl[]>('/listas-control');
    return response.data;
  },

  async crear(payload: ListaControlRequest): Promise<ListaControl> {
    const response = await api.post<ListaControl>('/listas-control', payload);
    return response.data;
  },

  async actualizar(id: number, payload: ListaControlRequest): Promise<ListaControl> {
    const response = await api.put<ListaControl>(`/listas-control/${id}`, payload);
    return response.data;
  },

  async elementos(listaId: number): Promise<ElementoListaControl[]> {
    const response = await api.get<ElementoListaControl[]>(`/listas-control/${listaId}/elementos`);
    return response.data;
  },

  async crearElemento(listaId: number, payload: ElementoListaControlRequest): Promise<ElementoListaControl> {
    const response = await api.post<ElementoListaControl>(`/listas-control/${listaId}/elementos`, payload);
    return response.data;
  },

  async importar(listaId: number, file: File): Promise<ImportacionListaControl> {
    const data = new FormData();
    data.append('archivo', file);
    const response = await api.post<ImportacionListaControl>(`/listas-control/${listaId}/importar`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

