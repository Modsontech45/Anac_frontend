import api from './api';
import type { ApiResponse, DepartmentRate, PayrollSummary } from '@/types';

export const payrollService = {
  // Get all department rates
  async getAllRates(): Promise<DepartmentRate[]> {
    const response = await api.get<ApiResponse<DepartmentRate[]>>('/payroll/rates');
    return response.data.data;
  },

  // Get rate for specific department
  async getRateByDepartment(departmentId: string): Promise<DepartmentRate> {
    const response = await api.get<ApiResponse<DepartmentRate>>(`/payroll/rates/${departmentId}`);
    return response.data.data;
  },

  // Create or update rate
  async upsertRate(data: {
    departmentId: string;
    hourlyRate: number;
    currency?: string;
  }): Promise<DepartmentRate> {
    const response = await api.post<ApiResponse<DepartmentRate>>('/payroll/rates', data);
    return response.data.data;
  },

  // Bulk update rates
  async bulkUpdateRates(rates: {
    departmentId: string;
    hourlyRate: number;
    currency?: string;
  }[]): Promise<DepartmentRate[]> {
    const response = await api.put<ApiResponse<DepartmentRate[]>>('/payroll/rates/bulk', { rates });
    return response.data.data;
  },

  // Calculate payroll for a month
  async calculatePayroll(month: string): Promise<PayrollSummary> {
    const response = await api.get<ApiResponse<PayrollSummary>>('/payroll/calculate', {
      params: { month },
    });
    return response.data.data;
  },

  // Export attendance to CSV
  async exportCSV(filters: {
    startDate: string;
    endDate: string;
    userId?: string;
    departmentId?: string;
  }): Promise<Blob> {
    const response = await api.get('/payroll/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default payrollService;
