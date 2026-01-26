import api from './api';
import type {
  Department,
  CreateDepartmentForm,
  UpdateDepartmentForm,
  ApiResponse,
  PaginatedResponse,
  DepartmentStats,
} from '@/types';

interface DepartmentFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export const departmentService = {
  getAll: async (filters?: DepartmentFilters): Promise<PaginatedResponse<Department>> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<Department>>(
      `/departments?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<Department> => {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDepartmentForm): Promise<Department> => {
    const response = await api.post<ApiResponse<Department>>(
      '/departments',
      data
    );
    return response.data.data;
  },

  update: async (id: string, data: UpdateDepartmentForm): Promise<Department> => {
    const response = await api.put<ApiResponse<Department>>(
      `/departments/${id}`,
      data
    );
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },

  getStats: async (id: string): Promise<DepartmentStats> => {
    const response = await api.get<ApiResponse<DepartmentStats>>(
      `/departments/${id}/stats`
    );
    return response.data.data;
  },

  getAllStats: async (): Promise<DepartmentStats[]> => {
    const response = await api.get<ApiResponse<DepartmentStats[]>>(
      '/departments/stats'
    );
    return response.data.data;
  },
};

export default departmentService;
