import api from './api';
import type { GymMembership, CreateGymMembershipForm, ApiResponse } from '@/types';

export const membershipService = {
  getAll: async (filters?: { status?: string; planType?: string }): Promise<GymMembership[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.planType) params.append('planType', filters.planType);
    const response = await api.get<ApiResponse<GymMembership[]>>(`/memberships?${params.toString()}`);
    return response.data.data;
  },

  getByMember: async (userId: string): Promise<GymMembership[]> => {
    const response = await api.get<ApiResponse<GymMembership[]>>(`/memberships/member/${userId}`);
    return response.data.data;
  },

  getStats: async (): Promise<{ activeMembers: number; expiringSoon: number; expiredToday: number }> => {
    const response = await api.get<ApiResponse<{ activeMembers: number; expiringSoon: number; expiredToday: number }>>('/memberships/stats');
    return response.data.data;
  },

  getById: async (id: string): Promise<GymMembership> => {
    const response = await api.get<ApiResponse<GymMembership>>(`/memberships/${id}`);
    return response.data.data;
  },

  create: async (data: CreateGymMembershipForm): Promise<GymMembership> => {
    const response = await api.post<ApiResponse<GymMembership>>('/memberships', data);
    return response.data.data;
  },

  update: async (id: string, data: { isActive?: boolean; notes?: string }): Promise<GymMembership> => {
    const response = await api.put<ApiResponse<GymMembership>>(`/memberships/${id}`, data);
    return response.data.data;
  },

  renew: async (id: string, data: { startDate: string; amountPaid?: number; notes?: string }): Promise<GymMembership> => {
    const response = await api.post<ApiResponse<GymMembership>>(`/memberships/${id}/renew`, data);
    return response.data.data;
  },
};

export default membershipService;
