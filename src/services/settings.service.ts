import api from './api';

export interface LateArrivalThreshold {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface UpdateLateArrivalDTO {
  enabled: boolean;
  hour?: number;
  minute?: number;
}

const settingsService = {
  // Get late arrival threshold
  async getLateArrivalThreshold(): Promise<LateArrivalThreshold> {
    const response = await api.get('/settings/late-arrival');
    return response.data.data;
  },

  // Update late arrival threshold
  async updateLateArrivalThreshold(data: UpdateLateArrivalDTO): Promise<LateArrivalThreshold> {
    const response = await api.put('/settings/late-arrival', data);
    return response.data.data;
  },
};

export default settingsService;
