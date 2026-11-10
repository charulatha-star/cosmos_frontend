import apiClient from './client';
import type { SpaceItem, SpaceMember } from '../types';

export const spacesApi = {
  // Get all spaces the user has access to
  getSpaces: async (): Promise<SpaceItem[]> => {
    const response = await apiClient.get<SpaceItem[]>('/spaces/spaces/');
    return response.data;
  },

  // Create a new space
  createSpace: async (name: string): Promise<SpaceItem> => {
    const response = await apiClient.post<SpaceItem>('/spaces/spaces/', { name });
    return response.data;
  },

  // Join a space as member via invite link
  joinSpace: async (spaceId: string): Promise<{ success: boolean; role: string; space_id: string; space_name: string }> => {
    const response = await apiClient.post(`/spaces/spaces/${spaceId}/join/`);
    return response.data;
  },

  // Get members of a space
  getMembers: async (spaceId: string): Promise<SpaceMember[]> => {
    const response = await apiClient.get<SpaceMember[]>(`/spaces/spaces/${spaceId}/members/`);
    return response.data;
  },

  // Invite/add a member to a space
  inviteMember: async (spaceId: string, emailOrUserId: { email?: string; user_id?: string; role?: 'member' | 'admin' }): Promise<SpaceMember> => {
    const response = await apiClient.post<SpaceMember>(`/spaces/spaces/${spaceId}/members/`, emailOrUserId);
    return response.data;
  },

  // Remove a member from a space
  removeMember: async (spaceId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/spaces/spaces/${spaceId}/members/${userId}/`);
  },
};

export default spacesApi;
