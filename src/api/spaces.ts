import apiClient from './client';
import type { SpaceItem, SpaceMemberItem, SpaceInvitationItem, SpaceSetupPayload, SpaceRole } from '../types';

export const spacesApi = {
  // Get all spaces the user has access to
  getSpaces: async (): Promise<SpaceItem[]> => {
    const response = await apiClient.get<SpaceItem[]>('/spaces/');
    return response.data;
  },

  // Get single space
  getSpace: async (spaceId: string): Promise<SpaceItem> => {
    const response = await apiClient.get<SpaceItem>(`/spaces/${spaceId}/`);
    return response.data;
  },

  // Simple create
  createSpace: async (name: string): Promise<SpaceItem> => {
    const response = await apiClient.post<SpaceItem>('/spaces/', { name });
    return response.data;
  },

  // Setup team space wizard (Screenshot 3)
  setupSpace: async (payload: SpaceSetupPayload): Promise<{ space: SpaceItem; invite_code: string; invitations?: SpaceInvitationItem[] }> => {
    const response = await apiClient.post<{ space: SpaceItem; invite_code: string; invitations?: SpaceInvitationItem[] }>('/spaces/setup/', payload);
    return response.data;
  },

  // Delete organization (Primary Owner only, requires exact name confirmation)
  deleteSpace: async (spaceId: string, confirmName: string): Promise<{ detail: string }> => {
    const response = await apiClient.delete<{ detail: string }>(`/spaces/${spaceId}/`, {
      data: { confirm_name: confirmName },
    });
    return response.data;
  },

  // Get members of a space (Screenshot 5)
  getMembers: async (spaceId: string): Promise<SpaceMemberItem[]> => {
    const response = await apiClient.get<SpaceMemberItem[]>(`/spaces/${spaceId}/members/`);
    return response.data;
  },

  // Invite / Add members (Screenshot 7)
  addMembers: async (spaceId: string, emails: string[] | string, role: string = 'Member'): Promise<{ invitations: SpaceInvitationItem[]; already_members?: string[]; detail?: string }> => {
    const response = await apiClient.post<{ invitations: SpaceInvitationItem[]; already_members?: string[]; detail?: string }>(`/spaces/${spaceId}/members/`, { emails, role });
    return response.data;
  },

  // Get invitations for a space
  getInvitations: async (spaceId: string, status?: string): Promise<SpaceInvitationItem[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get<SpaceInvitationItem[]>(`/spaces/${spaceId}/invitations/`, { params });
    return response.data;
  },

  // Resend invitation
  resendInvitation: async (spaceId: string, inviteId: string): Promise<SpaceInvitationItem> => {
    const response = await apiClient.post<SpaceInvitationItem>(`/spaces/${spaceId}/invitations/${inviteId}/resend/`);
    return response.data;
  },

  // Cancel invitation
  cancelInvitation: async (spaceId: string, inviteId: string): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>(`/spaces/${spaceId}/invitations/${inviteId}/cancel/`);
    return response.data;
  },

  // Validate email invitation token
  validateEmailInvitation: async (token: string): Promise<{ valid: boolean; token: string; space_id: string; space_name: string; email: string; role: SpaceRole; invited_by?: string }> => {
    const response = await apiClient.get(`/invitations/${token}/`);
    return response.data;
  },

  // Accept email invitation (Authenticated user)
  acceptEmailInvitation: async (token: string): Promise<{ status: string; space_id: string; space_name: string; role: string; user: any }> => {
    const response = await apiClient.post(`/invitations/${token}/accept/`);
    return response.data;
  },

  // Edit member role or access (Screenshot 6)
  updateMember: async (spaceId: string, memberId: string, data: { role?: SpaceRole; access?: string }): Promise<SpaceMemberItem> => {
    const response = await apiClient.patch<SpaceMemberItem>(`/spaces/${spaceId}/members/${memberId}/`, data);
    return response.data;
  },

  // Remove a member
  removeMember: async (spaceId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/spaces/${spaceId}/members/${memberId}/`);
  },

  // Get space invite settings & code (Screenshot 4 & 5)
  getInviteInfo: async (spaceId: string): Promise<{ space_id: string; space_name: string; invite_code: string; allow_link_join: boolean }> => {
    const response = await apiClient.get<{ space_id: string; space_name: string; invite_code: string; allow_link_join: boolean }>(`/spaces/${spaceId}/invite/`);
    return response.data;
  },

  // Toggle link invite allowed
  updateInviteSettings: async (spaceId: string, allow_link_join: boolean): Promise<{ space_id?: string; space_name?: string; invite_code: string; allow_link_join: boolean }> => {
    const response = await apiClient.patch<{ space_id?: string; space_name?: string; invite_code: string; allow_link_join: boolean }>(`/spaces/${spaceId}/invite/`, { allow_link_join });
    return response.data;
  },

  // Regenerate unique invite link (Revokes previous link)
  regenerateInviteCode: async (spaceId: string): Promise<{ space_id?: string; space_name?: string; invite_code: string; allow_link_join: boolean }> => {
    const response = await apiClient.patch<{ space_id?: string; space_name?: string; invite_code: string; allow_link_join: boolean }>(`/spaces/${spaceId}/invite/`, { regenerate: true });
    return response.data;
  },

  // Public: Validate invite link code
  validateInvite: async (inviteCode: string): Promise<{ valid: boolean; space_id: string; space_name: string; team_size: string; style: string; members_count: number }> => {
    const response = await apiClient.get(`/invite/${inviteCode}/`);
    return response.data;
  },

  // Public: Join office via office invite link (Authenticated Teammates)
  joinViaInvite: async (inviteCode: string): Promise<{ status: string; space_id: string; role: string; user: any }> => {
    const response = await apiClient.post(`/invite/${inviteCode}/join/`);
    return response.data;
  },

  // Public: Validate guest room invite link
  validateGuestRoomInvite: async (inviteCode: string, room: string = 'meeting-1'): Promise<{ valid: boolean; type: string; space_id: string; space_name: string; room_id: string; room_name: string }> => {
    const response = await apiClient.get(`/invite/${inviteCode}/guest-validate/`, { params: { room } });
    return response.data;
  },

  // Public: Join specific guest room via guest invite link
  joinGuestRoom: async (inviteCode: string, roomId: string, guestName?: string): Promise<{ status: string; space_id: string; room_id: string; role: string; access: string; allowed_rooms?: string[]; tokens: { access: string; refresh: string }; user: any }> => {
    const response = await apiClient.post(`/invite/${inviteCode}/guest-join/`, { room_id: roomId, guest_name: guestName });
    return response.data;
  },

  // Guest requests access to a room/cabin
  requestGuestRoomAccess: async (spaceId: string, roomId: string, roomName: string): Promise<{ id: string; status: string; requested_room: string; requested_room_name: string; detail?: string }> => {
    const response = await apiClient.post(`/spaces/${spaceId}/guest-access/request/`, { room_id: roomId, room_name: roomName });
    return response.data;
  },

  // Guest polls access and allowed rooms status
  getGuestAccessStatus: async (spaceId: string): Promise<{ role: string; access: string; allowed_rooms: string[]; latest_request: any | null }> => {
    const response = await apiClient.get(`/spaces/${spaceId}/guest-access/status/`);
    return response.data;
  },

  // Admin / Primary Owner fetches all pending guest requests
  getPendingGuestAccessRequests: async (spaceId: string): Promise<Array<{ id: string; guest_name: string; guest_email: string; requested_room: string; requested_room_name: string; status: string; created_at: string }>> => {
    const response = await apiClient.get(`/spaces/${spaceId}/guest-access/pending/`);
    return response.data;
  },

  // Admin / Primary Owner responds: approve_room, approve_all, or reject
  respondGuestAccessRequest: async (spaceId: string, requestId: string, action: 'approve_room' | 'approve_all' | 'reject'): Promise<{ status: string; action: string; guest_name: string; requested_room: string; requested_room_name?: string; allowed_rooms: string[]; access: string }> => {
    const response = await apiClient.post(`/spaces/${spaceId}/guest-access/${requestId}/respond/`, { action });
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

