import api from './axios';
import type { KycResponse } from '../types';

export const kycApi = {
  consultar: async (identificadorDocumento: string): Promise<KycResponse> => {
    const response = await api.post<KycResponse>('/kyc/consultar', {
      identificadorDocumento,
    });
    return response.data;
  },
};
