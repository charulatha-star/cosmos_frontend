import apiClient from './client';
import type { LiveKitTokenResponse } from '../types';

export const livekitApi = {
  /**
   * Request a short-lived WebRTC room access token from the backend
   * (PRD Section 6.3 & 11 Step 3)
   */
  getRoomToken: async (roomId: string): Promise<LiveKitTokenResponse> => {
    const response = await apiClient.post<LiveKitTokenResponse>(`/rooms/${roomId}/token/`);
    return response.data;
  },
};

export default livekitApi;
