import api from './api';

export interface DepartmentRate {
  id: string;
  departmentId: string;
  departmentName?: string;
  hourlyRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SetRateDTO {
  hourlyRate: number;
  currency?: string;
}

export interface BulkSetRatesDTO {
  rates: Array<{
    departmentId: string;
    hourlyRate: number;
    currency?: string;
  }>;
}

export const departmentRateService = {
  // Get all rates for the organization
  async getAllRates(): Promise<DepartmentRate[]> {
    const response = await api.get<{ success: boolean; data: DepartmentRate[] }>(
      '/department-rates'
    );
    return response.data.data;
  },

  // Get rate for a specific department
  async getRateByDepartment(departmentId: string): Promise<DepartmentRate> {
    const response = await api.get<{ success: boolean; data: DepartmentRate }>(
      `/department-rates/${departmentId}`
    );
    return response.data.data;
  },

  // Set rate for a department
  async setRate(departmentId: string, data: SetRateDTO): Promise<DepartmentRate> {
    const response = await api.put<{ success: boolean; data: DepartmentRate }>(
      `/department-rates/${departmentId}`,
      data
    );
    return response.data.data;
  },

  // Bulk update rates
  async bulkSetRates(data: BulkSetRatesDTO): Promise<DepartmentRate[]> {
    const response = await api.post<{ success: boolean; data: DepartmentRate[] }>(
      '/department-rates/bulk',
      data
    );
    return response.data.data;
  },
};

export default departmentRateService;
