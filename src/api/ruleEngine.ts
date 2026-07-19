import api from './axios';
import type { CatalogoItem, EntityRecord, EntitySchema, EntitySummary, RuleFactDefinition } from '../types';

export const ruleEngineApi = {
  getCatalog: async (tipo: string): Promise<CatalogoItem[]> => {
    const response = await api.get<CatalogoItem[]>(`/rule-engine/catalogos/${tipo}`);
    return response.data;
  },

  getFacts: async (): Promise<RuleFactDefinition[]> => {
    const response = await api.get<RuleFactDefinition[]>('/rule-engine/facts');
    return response.data;
  },

  createCatalog: async (tipo: string, data: Partial<CatalogoItem>): Promise<CatalogoItem> => {
    const response = await api.post<CatalogoItem>(`/rule-engine/catalogos/${tipo}`, data);
    return response.data;
  },

  updateCatalog: async (tipo: string, id: number, data: Partial<CatalogoItem>): Promise<CatalogoItem> => {
    const response = await api.put<CatalogoItem>(`/rule-engine/catalogos/${tipo}/${id}`, data);
    return response.data;
  },

  getEntities: async (): Promise<EntitySummary[]> => {
    const response = await api.get<EntitySummary[]>('/rule-engine/entities');
    return response.data;
  },

  getEntitySchema: async (entity: string): Promise<EntitySchema> => {
    const response = await api.get<EntitySchema>(`/rule-engine/entities/${entity}/schema`);
    return response.data;
  },

  getEntityRows: async (entity: string): Promise<EntityRecord[]> => {
    const response = await api.get<EntityRecord[]>(`/rule-engine/entities/${entity}`);
    return response.data;
  },

  getEntityDetail: async (entity: string, id: number): Promise<EntityRecord> => {
    const response = await api.get<EntityRecord>(`/rule-engine/entities/${entity}/${id}`);
    return response.data;
  },

  createEntity: async (entity: string, data: EntityRecord): Promise<EntityRecord> => {
    const response = await api.post<EntityRecord>(`/rule-engine/entities/${entity}`, data);
    return response.data;
  },

  updateEntity: async (entity: string, id: number, data: EntityRecord): Promise<EntityRecord> => {
    const response = await api.put<EntityRecord>(`/rule-engine/entities/${entity}/${id}`, data);
    return response.data;
  },

  deleteEntity: async (entity: string, id: number): Promise<void> => {
    await api.delete(`/rule-engine/entities/${entity}/${id}`);
  },
};
