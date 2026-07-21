import api from './axios';
import type {
  Alerta,
  AlertaDetalle,
  AlertaFiltros,
  AnalistaDisponible,
  AprobacionSupervisor,
  EvidenciaAlerta,
  EvidenciaAlertaRequest,
  HistorialAsignacion,
  PageResponse,
  ReglaAlerta,
  ResolucionAlerta,
  ResolucionAlertaRequest,
  TimelineEvent,
} from '../types';

export interface AlertListParams {
  page?: number;
  size?: number;
  search?: string;
  severidad?: string;
  estado?: string;
  escenarioId?: number | string;
  analistaId?: number | string;
  rangoFecha?: string;
  desde?: string;
  hasta?: string;
  sort?: string;
}

export const alertsApi = {
  getAll: async (params?: AlertListParams): Promise<PageResponse<Alerta>> => {
    const response = await api.get<PageResponse<Alerta> | Alerta[]>('/alertas', { params });
    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        page: params?.page || 0,
        size: params?.size || response.data.length,
        totalElements: response.data.length,
        totalPages: 1,
        first: true,
        last: true,
      };
    }
    return response.data;
  },

  getById: async (id: number): Promise<Alerta> => {
    const response = await api.get<Alerta>(`/alertas/${id}`);
    return response.data;
  },

  getDetail: async (id: number): Promise<AlertaDetalle> => {
    const response = await api.get<AlertaDetalle>(`/alertas/${id}/detalle`);
    return {
      ...response.data,
      historialTransaccional: response.data.historialTransaccional || [],
      serviciosExternos: response.data.serviciosExternos || [],
      timeline: response.data.timeline || [],
      accionesTimeline: response.data.accionesTimeline || response.data.timeline || [],
      evidencias: response.data.evidencias || [],
      reglasDisparadas: response.data.reglasDisparadas || (response.data.regla ? [response.data.regla] : []),
      hallazgosRegulatorios: response.data.hallazgosRegulatorios || [],
      aprobacion: response.data.aprobacion || null,
      accionesDisponibles: response.data.accionesDisponibles || [],
    };
  },

  getFiltros: async (): Promise<AlertaFiltros> => {
    const response = await api.get<AlertaFiltros>('/alertas/filtros');
    return response.data;
  },

  getReglasDisparadas: async (id: number): Promise<ReglaAlerta[]> => {
    const response = await api.get<ReglaAlerta[]>(`/alertas/${id}/reglas-disparadas`);
    return response.data;
  },

  getEvidencias: async (id: number): Promise<EvidenciaAlerta[]> => {
    const response = await api.get<EvidenciaAlerta[]>(`/alertas/${id}/evidencias`);
    return response.data;
  },

  crearEvidencia: async (id: number, data: EvidenciaAlertaRequest): Promise<EvidenciaAlerta> => {
    const response = await api.post<EvidenciaAlerta>(`/alertas/${id}/evidencias`, data);
    return response.data;
  },

  actualizarEvidencia: async (id: number, evidenciaId: number, data: EvidenciaAlertaRequest): Promise<EvidenciaAlerta> => {
    const response = await api.put<EvidenciaAlerta>(`/alertas/${id}/evidencias/${evidenciaId}`, data);
    return response.data;
  },

  eliminarEvidencia: async (id: number, evidenciaId: number): Promise<void> => {
    await api.delete(`/alertas/${id}/evidencias/${evidenciaId}`);
  },

  getByEstado: async (estado: string): Promise<Alerta[]> => {
    const response = await api.get<Alerta[]>(`/alertas/estado/${estado}`);
    return response.data;
  },

  countUnassigned: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/alertas/sin-asignar/count');
    return response.data.count;
  },

  asignar: async (id: number, analistaId?: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/asignar`, { analistaId });
    return response.data;
  },

  autoasignarme: async (id: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/autoasignarme`);
    return response.data;
  },

  getAnalistasDisponibles: async (): Promise<AnalistaDisponible[]> => {
    const response = await api.get<AnalistaDisponible[]>('/alertas/analistas-disponibles');
    return response.data;
  },

  reasignar: async (id: number, analistaId: number, motivo: string, observacion?: string): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/reassign`, { analistaId, motivo, observacion });
    return response.data;
  },

  resolver: async (id: number, observacion: string): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/resolver`, { observacion });
    return response.data;
  },

  resolverFormal: async (id: number, data: ResolucionAlertaRequest): Promise<ResolucionAlerta> => {
    const response = await api.post<ResolucionAlerta>(`/alertas/${id}/resolver-formal`, data);
    return response.data;
  },

  aprobarResolucion: async (id: number, observacion: string): Promise<AprobacionSupervisor> => {
    const response = await api.post<AprobacionSupervisor>(`/alertas/${id}/aprobar-resolucion`, { observacion });
    return response.data;
  },

  rechazarResolucion: async (id: number, motivo: string, faltantes: string): Promise<AprobacionSupervisor> => {
    const response = await api.post<AprobacionSupervisor>(`/alertas/${id}/rechazar-resolucion`, { motivo, faltantes });
    return response.data;
  },

  cerrar: async (id: number): Promise<Alerta> => {
    const response = await api.post<Alerta>(`/alertas/${id}/cerrar`);
    return response.data;
  },

  getHistory: async (id: number): Promise<HistorialAsignacion[]> => {
    const response = await api.get<HistorialAsignacion[]>(`/alertas/${id}/history`);
    return response.data;
  },

  getTimeline: async (id: number): Promise<TimelineEvent[]> => {
    const response = await api.get<TimelineEvent[]>(`/alertas/${id}/timeline`);
    return response.data;
  },
};
