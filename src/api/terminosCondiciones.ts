import api from './axios';
import type { TipoDocumentoLegal } from '../types';

export interface DocumentoLegal {
  id: number;
  tipo: TipoDocumentoLegal;
  version: number;
  titulo: string;
  contenido: string;
  urlDocumento: string | null;
  fechaPublicacion: string | null;
}

export interface PendienteAceptacionResponse {
  requiereAceptacion: boolean;
  documentosPendientes: DocumentoLegal[];
}

export const terminosCondicionesApi = {
  getPendientes: async (): Promise<PendienteAceptacionResponse> => {
    const response = await api.get<PendienteAceptacionResponse>('/terminos-condiciones/pendientes');
    return response.data;
  },

  aceptarDocumento: async (documentoLegalId: number, acepto: boolean): Promise<{ mensaje: string }> => {
    const response = await api.post<{ mensaje: string }>('/terminos-condiciones/aceptar', {
      documentoLegalId,
      acepto,
    });
    return response.data;
  },

  getDocumentos: async (): Promise<DocumentoLegal[]> => {
    const response = await api.get<DocumentoLegal[]>('/terminos-condiciones/documentos');
    return response.data;
  },
};
