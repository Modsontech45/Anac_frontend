import api from './api';
import type { StudentPayment, StudentWithPaymentStatus, ApiResponse } from '@/types';

export const studentPaymentService = {
  getAll: async (filters?: { feeStructureId?: string; userId?: string }): Promise<StudentPayment[]> => {
    const params = new URLSearchParams();
    if (filters?.feeStructureId) params.append('feeStructureId', filters.feeStructureId);
    if (filters?.userId) params.append('userId', filters.userId);
    const response = await api.get<ApiResponse<StudentPayment[]>>(`/student-payments?${params.toString()}`);
    return response.data.data;
  },

  getStudentsWithStatus: async (feeStructureId: string): Promise<StudentWithPaymentStatus[]> => {
    const response = await api.get<ApiResponse<StudentWithPaymentStatus[]>>(
      `/student-payments/status/${feeStructureId}`
    );
    return response.data.data;
  },

  getByStudent: async (userId: string): Promise<StudentPayment[]> => {
    const response = await api.get<ApiResponse<StudentPayment[]>>(`/student-payments/student/${userId}`);
    return response.data.data;
  },

  markPaid: async (data: {
    userId: string;
    feeStructureId: string;
    amountPaid?: number;
    notes?: string;
  }): Promise<StudentPayment> => {
    const response = await api.post<ApiResponse<StudentPayment>>('/student-payments', data);
    return response.data.data;
  },

  unmark: async (id: string): Promise<void> => {
    await api.delete(`/student-payments/${id}`);
  },

  unmarkAll: async (userId: string, feeStructureId: string): Promise<void> => {
    await api.delete(`/student-payments/all/${userId}/${feeStructureId}`);
  },
};

export default studentPaymentService;
