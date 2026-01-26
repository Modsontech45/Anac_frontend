import api from './api';

export interface Organization {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyResponse {
  apiKey: string;
}

const organizationService = {
  // Get current user's organization
  async getMyOrganization(): Promise<Organization> {
    const response = await api.get<{ success: boolean; data: Organization }>('/organization');
    return response.data.data;
  },

  // Get API key only
  async getApiKey(): Promise<string> {
    const response = await api.get<{ success: boolean; data: ApiKeyResponse }>('/organization/api-key');
    return response.data.data.apiKey;
  },

  // Regenerate API key
  async regenerateApiKey(): Promise<string> {
    const response = await api.post<{ success: boolean; data: ApiKeyResponse; message: string }>('/organization/regenerate-api-key');
    return response.data.data.apiKey;
  },

  // Update organization name
  async updateName(name: string): Promise<Organization> {
    const response = await api.patch<{ success: boolean; data: Organization }>('/organization/name', { name });
    return response.data.data;
  },
};

export default organizationService;
