import apiClient from './client';
import type { SpaceItem } from '../types';

export const spacesApi = {
  // Get all spaces
  getSpaces: async (): Promise<SpaceItem[]> => {
    const response = await apiClient.get<SpaceItem[]>('/spaces/spaces/');
    return response.data;
  },

  // Create a new space
  createSpace: async (name: string): Promise<SpaceItem> => {
    const response = await apiClient.post<SpaceItem>('/spaces/spaces/', { name });
    return response.data;
  },
};

export default spacesApi;
