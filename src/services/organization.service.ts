import api from './api';

export interface Organization {
  id: string;
  name: string;
  apiKey: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyResponse {
  apiKey: string;
}

export interface LogoUploadResponse {
  logoUrl: string;
  organization: Organization;
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

  // Upload organization logo
  async uploadLogo(file: File): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post<{ success: boolean; data: LogoUploadResponse; message: string }>(
      '/organization/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Delete organization logo
  async deleteLogo(): Promise<Organization> {
    const response = await api.delete<{ success: boolean; data: Organization }>('/organization/logo');
    return response.data.data;
  },
};

export default organizationService;
