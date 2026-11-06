import apiClient from './client';
import type { PresenceUpdate } from '../types';

export const presenceApi = {
  // Get all active presences in space
  getPresences: async (space: string = 'billion'): Promise<PresenceUpdate[]> => {
    const response = await apiClient.get<PresenceUpdate[]>(`/presence/?space=${space}`);
    return response.data;
  },

  // Update own live position, desk, and status
  updatePresence: async (data: Partial<PresenceUpdate> & { desk?: string; space?: string }): Promise<PresenceUpdate> => {
    const response = await apiClient.post<PresenceUpdate>('/presence/update/', data);
    return response.data;
  },
};

export default presenceApi;
