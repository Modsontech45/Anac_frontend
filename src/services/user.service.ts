import api from './api';
import type {
  User,
  CreateUserForm,
  UpdateUserForm,
  ApiResponse,
  PaginatedResponse,
  UserFilters,
} from '@/types';

export const userService = {
  getAll: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.isActive !== undefined)
      params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<User>>(
      `/users?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserForm): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateUserForm): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  assignRfid: async (userId: string, rfidTag: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(
      `/users/${userId}/rfid`,
      { rfidTag }
    );
    return response.data.data;
  },

  removeRfid: async (userId: string): Promise<User> => {
    const response = await api.delete<ApiResponse<User>>(
      `/users/${userId}/rfid`
    );
    return response.data.data;
  },
};

export default userService;
