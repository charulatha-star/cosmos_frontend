export interface OfficeZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'desk' | 'cowork_table' | 'focus_desk' | 'meeting_room' | 'stage' | 'lounge';
  capacity?: number;
  roomId?: string; // Links to WebRTC room if it's a meeting zone
}

export interface OfficeAvatar {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  isLocal: boolean;
  deskLabel?: string;
  status: 'online' | 'busy' | 'away';
  isMuted?: boolean;
  isSpeaking?: boolean;
  avatarColor?: string;
}
