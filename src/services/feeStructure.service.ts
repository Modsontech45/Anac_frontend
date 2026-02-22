import api from './api';
import type { FeeStructure, CreateFeeStructureForm, ApiResponse } from '@/types';

export const feeStructureService = {
  getAll: async (): Promise<FeeStructure[]> => {
    const response = await api.get<ApiResponse<FeeStructure[]>>('/fee-structures');
    return response.data.data;
  },

  getActive: async (): Promise<FeeStructure | null> => {
    const response = await api.get<ApiResponse<FeeStructure | null>>('/fee-structures/active');
    return response.data.data;
  },

  getById: async (id: string): Promise<FeeStructure> => {
    const response = await api.get<ApiResponse<FeeStructure>>(`/fee-structures/${id}`);
    return response.data.data;
  },

  create: async (data: CreateFeeStructureForm): Promise<FeeStructure> => {
    const response = await api.post<ApiResponse<FeeStructure>>('/fee-structures', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateFeeStructureForm & { isForcedActive: boolean }>): Promise<FeeStructure> => {
    const response = await api.put<ApiResponse<FeeStructure>>(`/fee-structures/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/fee-structures/${id}`);
  },

  forceActivate: async (id: string): Promise<FeeStructure> => {
    const response = await api.put<ApiResponse<FeeStructure>>(`/fee-structures/${id}/activate`, {});
    return response.data.data;
  },

  getPaymentCount: async (id: string): Promise<{ paid: number; total: number }> => {
    const response = await api.get<ApiResponse<{ paid: number; total: number }>>(`/fee-structures/${id}/payment-count`);
    return response.data.data;
  },
};

export default feeStructureService;
