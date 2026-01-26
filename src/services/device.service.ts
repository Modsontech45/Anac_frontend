import api from './api';
import type {
  Device,
  CreateDeviceForm,
  UpdateDeviceForm,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface DeviceFilters {
  departmentId?: string;
  isOnline?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export const deviceService = {
  getAll: async (filters?: DeviceFilters): Promise<PaginatedResponse<Device>> => {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.isOnline !== undefined)
      params.append('isOnline', String(filters.isOnline));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<Device>>(
      `/devices?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<Device> => {
    const response = await api.get<ApiResponse<Device>>(`/devices/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDeviceForm): Promise<Device> => {
    const response = await api.post<ApiResponse<Device>>('/devices', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateDeviceForm): Promise<Device> => {
    const response = await api.put<ApiResponse<Device>>(`/devices/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/devices/${id}`);
  },

  ping: async (id: string): Promise<Device> => {
    const response = await api.post<ApiResponse<Device>>(`/devices/${id}/ping`);
    return response.data.data;
  },

  register: async (serialNumber: string): Promise<Device> => {
    const response = await api.post<ApiResponse<Device>>('/devices/register', {
      serialNumber,
    });
    return response.data.data;
  },
};

export default deviceService;
