import api from './api';
import type {
  AttendanceRecord,
  AttendanceFilters,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  AttendanceChartData,
} from '@/types';

export const attendanceService = {
  getAll: async (
    filters?: AttendanceFilters
  ): Promise<PaginatedResponse<AttendanceRecord>> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.deviceId) params.append('deviceId', filters.deviceId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<AttendanceRecord>>(
      `/attendance?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get<ApiResponse<AttendanceRecord>>(
      `/attendance/${id}`
    );
    return response.data.data;
  },

  getMyRecords: async (
    filters?: AttendanceFilters
  ): Promise<PaginatedResponse<AttendanceRecord>> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<AttendanceRecord>>(
      `/attendance/me?${params.toString()}`
    );
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>(
      '/attendance/stats/dashboard'
    );
    return response.data.data;
  },

  getChartData: async (
    startDate: string,
    endDate: string
  ): Promise<AttendanceChartData[]> => {
    const response = await api.get<ApiResponse<AttendanceChartData[]>>(
      `/attendance/stats/chart?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },

  exportCSV: async (filters?: AttendanceFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/attendance/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Called by ESP32 devices
  recordAttendance: async (
    rfidTag: string,
    deviceId: string,
    type: 'check_in' | 'check_out'
  ): Promise<AttendanceRecord> => {
    const response = await api.post<ApiResponse<AttendanceRecord>>(
      '/attendance/record',
      { rfidTag, deviceId, type }
    );
    return response.data.data;
  },

  // Manual attendance recording (for admin/manager when device has issues)
  recordManualAttendance: async (
    userId: string,
    type: 'check_in' | 'check_out'
  ): Promise<AttendanceRecord> => {
    const response = await api.post<ApiResponse<AttendanceRecord>>(
      '/attendance/manual',
      { userId, type }
    );
    return response.data.data;
  },
};

export default attendanceService;
