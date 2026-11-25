/**
 * Cosmos Core Data Models (per PRD Section 3 & Section 5)
 */

export type UserRole = 'Admin' | 'Employee' | 'Guest';

export type UserPresenceStatus = 'online' | 'busy' | 'in_room' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserPresenceStatus;
  avatar_url?: string;
  avatar_seed?: string;
  avatar_style?: string;
  custom_status?: string;
  status_mode?: 'Available' | 'Listening' | 'Focus' | 'Away';
  country?: string;
  city?: string;
  time_zone?: string;
  language?: string;
  community_groups?: string;
  about?: string;
  interests?: string;
  current_room_id?: string | null;
  current_space?: string;
}

export interface SpaceItem {
  id: string;
  name: string;
  admin_access: boolean;
  is_free: boolean;
  team_size?: string;
  style?: string;
  allow_link_join?: boolean;
  invite_code?: string;
  members_count?: number;
  user_role?: SpaceRole;
  is_admin?: boolean;
  created_at?: string;
}

export type SpaceRole = 'Owner' | 'Admin' | 'Member' | 'Guest';

export interface SpaceMemberItem {
  id: string;
  space: string;
  user?: string;
  name: string;
  email?: string | null;
  guest_name?: string | null;
  role: SpaceRole;
  access: 'all_offices' | 'specific_room';
  created_at?: string;
}

export interface SpaceInvitationItem {
  id: string;
  space: string;
  space_name?: string;
  email: string;
  role: 'Admin' | 'Member';
  token: string;
  invited_by?: string;
  invited_by_name?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at?: string;
  created_at: string;
}


export interface SpaceSetupPayload {
  name: string;
  team_size: string;
  style: string;
  emails?: string[];
}

export type RoomType = 'permanent' | 'temporary';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  created_by: string; // User ID
  active_participants_count?: number;
  description?: string;
  created_at?: string;
}

export type MeetingStatus = 'scheduled' | 'live' | 'ended' | 'cancelled' | 'archived';

export interface Meeting {
  id: string;
  room_id: string;
  title: string;
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  host_id: string;
  host_name?: string;
  status: MeetingStatus;
  guest_token?: string;
  guest_link?: string;
  invitees?: string[]; // emails or user IDs
}

export interface Participant {
  id: string;
  meeting_id: string;
  user_id?: string;
  name: string;
  role: UserRole;
  is_guest: boolean;
  joined_at: string;
  left_at?: string;
}

export interface Message {
  id: string;
  room_id?: string;
  meeting_id?: string;
  sender_id: string;
  sender_name: string;
  text: string;
  timestamp: string;
  is_direct?: boolean;
  recipient_id?: string;
}

export interface PresenceUpdate {
  user_id: string;
  user_name?: string;
  status: UserPresenceStatus;
  current_space?: string;
  current_desk?: string | null;
  x?: number;
  y?: number;
  is_camera_on?: boolean;
  is_muted?: boolean;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
  is_guest?: boolean;
}

export interface LiveKitTokenResponse {
  token: string;
  server_url: string;
  room_name: string;
  participant_identity: string;
}
