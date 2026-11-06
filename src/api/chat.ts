import apiClient from './client';
import type { Message, User } from '../types';

export interface ChatMessagePayload {
  text: string;
}

export const chatApi = {
  // Fetch messages for a specific room
  getRoomMessages: async (roomId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/rooms/${roomId}/messages/`);
    return response.data;
  },

  // Send a message into a room
  sendRoomMessage: async (roomId: string, text: string): Promise<Message> => {
    const response = await apiClient.post<Message>(`/rooms/${roomId}/messages/`, { text });
    return response.data;
  },

  // Fetch direct messages with a specific teammate
  getDirectMessages: async (userId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/chat/direct/${userId}/`);
    return response.data;
  },

  // Send a direct message to a teammate
  sendDirectMessage: async (userId: string, text: string): Promise<Message> => {
    const response = await apiClient.post<Message>(`/chat/direct/${userId}/`, { text });
    return response.data;
  },

  // Get list of contacts in the office
  getContacts: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/chat/contacts/');
    return response.data;
  },
};

export default chatApi;
