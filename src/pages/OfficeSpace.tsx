import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Tooltip,
  Dropdown,
  Space,
  message,
  Avatar,
  Badge,
  Modal,
  Input,
  Select,
  Tag,
  Switch,
  Checkbox,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  UserAddOutlined,
  EllipsisOutlined,
  MessageOutlined,
  AppstoreOutlined,
  AimOutlined,
  PlusOutlined,
  MinusOutlined,
  DownOutlined,
  FullscreenOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  LogoutOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  BarChartOutlined,
  HomeOutlined,
  CopyOutlined,
  BellOutlined,
  PushpinOutlined,
  FolderOutlined,
  CloseOutlined,
  SendOutlined,
  SmileOutlined,
  PaperClipOutlined,
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import {
  Room,
  RoomEvent,
  Track,
  type VideoTrack,
  type AudioTrack,
  RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  VideoPresets,
} from 'livekit-client';
import { useAuth } from '../context/AuthContext';
import { presenceApi } from '../api/presence';
import { livekitApi } from '../api/livekit';
import { spacesApi } from '../api/spaces';
import { chatApi } from '../api/chat';
import DirectChatDrawer from '../components/DirectChatDrawer';
import CosmosPipCard from '../components/CosmosPipCard';
import CosmosCallSection, { type CallParticipant, EmptyOfficeChairView } from '../components/CosmosCallSection';
import CosmosProfileStatusModal, { getAvatarUrl } from '../components/CosmosProfileStatusModal';
import type { PresenceUpdate, User, Message as ChatMessageType } from '../types';

// Exact floor plan zones matching user recommendation
const OFFICE_ZONES = [
  // 1. Cabin 2 (Top Left)
  { id: 'cabin-2', name: 'Cabin 2', x: 80, y: 60, width: 380, height: 230, type: 'cabin' },

  // 2. Cabin 3 (Top Center)
  { id: 'cabin-3', name: 'Cabin 3', x: 500, y: 60, width: 400, height: 220, type: 'cabin' },

  // 3. War Room (Top Right)
  { id: 'war-room', name: 'War Room', x: 940, y: 60, width: 370, height: 390, type: 'cabin' },

  // 4. Cabin 1 (Middle Left)
  { id: 'cabin-1', name: 'Cabin 1', x: 80, y: 320, width: 380, height: 240, type: 'cabin' },

  // 5. Cabin 4 (Bottom Right - Upper Room, strictly separate)
  { id: 'cabin-4', name: 'Cabin 4', x: 960, y: 480, width: 350, height: 185, type: 'cabin' },

  // 6. Cabin 5 (Bottom Right - Lower Room, strictly separate)
  { id: 'cabin-5', name: 'Cabin 5', x: 960, y: 690, width: 350, height: 185, type: 'cabin' },

  // 7. Reception Area / Default Spawn Point (Bottom Left Lounge)
  { id: 'reception', name: 'Reception Area', x: 80, y: 590, width: 380, height: 270, type: 'reception' },

  // 8. 30 Individual Workstation Desks (6 Rows x 5 Seats) extending into Central Floor
  // Row 1 (y: 315)
  { id: 'desk-1', name: 'Desk 1', x: 500, y: 315, width: 72, height: 50, type: 'desk' },
  { id: 'desk-2', name: 'Desk 2', x: 585, y: 315, width: 72, height: 50, type: 'desk' },
  { id: 'desk-3', name: 'Desk 3', x: 670, y: 315, width: 72, height: 50, type: 'desk' },
  { id: 'desk-4', name: 'Desk 4', x: 755, y: 315, width: 72, height: 50, type: 'desk' },
  { id: 'desk-5', name: 'Desk 5', x: 840, y: 315, width: 72, height: 50, type: 'desk' },

  // Row 2 (y: 415)
  { id: 'desk-6', name: 'Desk 6', x: 500, y: 415, width: 72, height: 50, type: 'desk' },
  { id: 'desk-7', name: 'Desk 7', x: 585, y: 415, width: 72, height: 50, type: 'desk' },
  { id: 'desk-8', name: 'Desk 8', x: 670, y: 415, width: 72, height: 50, type: 'desk' },
  { id: 'desk-9', name: 'Desk 9', x: 755, y: 415, width: 72, height: 50, type: 'desk' },
  { id: 'desk-10', name: 'Desk 10', x: 840, y: 415, width: 72, height: 50, type: 'desk' },

  // Row 3 (y: 515)
  { id: 'desk-11', name: 'Desk 11', x: 500, y: 515, width: 72, height: 50, type: 'desk' },
  { id: 'desk-12', name: 'Desk 12', x: 585, y: 515, width: 72, height: 50, type: 'desk' },
  { id: 'desk-13', name: 'Desk 13', x: 670, y: 515, width: 72, height: 50, type: 'desk' },
  { id: 'desk-14', name: 'Desk 14', x: 755, y: 515, width: 72, height: 50, type: 'desk' },
  { id: 'desk-15', name: 'Desk 15', x: 840, y: 515, width: 72, height: 50, type: 'desk' },

  // Row 4 (y: 615)
  { id: 'desk-16', name: 'Desk 16', x: 500, y: 615, width: 72, height: 50, type: 'desk' },
  { id: 'desk-17', name: 'Desk 17', x: 585, y: 615, width: 72, height: 50, type: 'desk' },
  { id: 'desk-18', name: 'Desk 18', x: 670, y: 615, width: 72, height: 50, type: 'desk' },
  { id: 'desk-19', name: 'Desk 19', x: 755, y: 615, width: 72, height: 50, type: 'desk' },
  { id: 'desk-20', name: 'Desk 20', x: 840, y: 615, width: 72, height: 50, type: 'desk' },

  // Row 5 (y: 715)
  { id: 'desk-21', name: 'Desk 21', x: 500, y: 715, width: 72, height: 50, type: 'desk' },
  { id: 'desk-22', name: 'Desk 22', x: 585, y: 715, width: 72, height: 50, type: 'desk' },
  { id: 'desk-23', name: 'Desk 23', x: 670, y: 715, width: 72, height: 50, type: 'desk' },
  { id: 'desk-24', name: 'Desk 24', x: 755, y: 715, width: 72, height: 50, type: 'desk' },
  { id: 'desk-25', name: 'Desk 25', x: 840, y: 715, width: 72, height: 50, type: 'desk' },

  // Row 6 (y: 815)
  { id: 'desk-26', name: 'Desk 26', x: 500, y: 815, width: 72, height: 50, type: 'desk' },
  { id: 'desk-27', name: 'Desk 27', x: 585, y: 815, width: 72, height: 50, type: 'desk' },
  { id: 'desk-28', name: 'Desk 28', x: 670, y: 815, width: 72, height: 50, type: 'desk' },
  { id: 'desk-29', name: 'Desk 29', x: 755, y: 815, width: 72, height: 50, type: 'desk' },
  { id: 'desk-30', name: 'Desk 30', x: 840, y: 815, width: 72, height: 50, type: 'desk' },
];

const MicSlashIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const CamSlashIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
  </svg>
);

const ScreenIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const HandSvgIcon = ({ size = 20, active }: { size?: number; active?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M6 14v-2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" />
  </svg>
);

// Realistic Virtual Camera Stream Generator for multi-window testing on a single laptop
const createVirtualCameraStream = (userName: string, _avatarSeed: string): MediaStream => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new MediaStream();

  let frame = 0;
  let animId: number;

  function render() {
    frame++;
    if (!ctx) return;

    // 1. Realistic modern office background with warm lighting & acoustic panels
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#1e2430');
    bgGrad.addColorStop(0.5, '#283142');
    bgGrad.addColorStop(1, '#1a202c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Warm ceiling spotlight / bokeh in the background
    const lightGlow = ctx.createRadialGradient(480, 80, 20, 480, 80, 260);
    lightGlow.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
    lightGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.arc(480, 80, 260, 0, Math.PI * 2);
    ctx.fill();

    // Blurred vertical acoustic wall slats (office background)
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(40 + i * 75, 0, 45, 480);
    }

    // Subtle natural breathing & posture micro-movements
    const bob = Math.sin(frame * 0.04) * 3;
    const sway = Math.cos(frame * 0.03) * 1.5;

    // 2. Shoulders & Professional Outfit (Blazer & Shirt)
    // Dark professional navy blazer
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(320 + sway, 470 + bob, 200, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner crisp collared shirt (soft sky blue / white)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(275 + sway, 360 + bob);
    ctx.lineTo(320 + sway, 440 + bob);
    ctx.lineTo(365 + sway, 360 + bob);
    ctx.closePath();
    ctx.fill();

    // Collar flaps
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(275 + sway, 360 + bob);
    ctx.lineTo(300 + sway, 395 + bob);
    ctx.lineTo(290 + sway, 350 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(365 + sway, 360 + bob);
    ctx.lineTo(340 + sway, 395 + bob);
    ctx.lineTo(350 + sway, 350 + bob);
    ctx.closePath();
    ctx.fill();

    // 3. Neck with natural skin tone & shading
    const neckGrad = ctx.createLinearGradient(290 + sway, 280, 350 + sway, 380);
    neckGrad.addColorStop(0, '#c78358');
    neckGrad.addColorStop(0.6, '#b57147');
    neckGrad.addColorStop(1, '#9e5e36');
    ctx.fillStyle = neckGrad;
    ctx.fillRect(296 + sway, 275 + bob, 48, 95);

    // 4. Realistic Human Face / Head with natural 3D skin lighting
    const faceGrad = ctx.createRadialGradient(310 + sway, 190 + bob, 25, 320 + sway, 210 + bob, 110);
    faceGrad.addColorStop(0, '#d99468'); // Highlight on forehead/nose bridge
    faceGrad.addColorStop(0.7, '#c68156'); // Natural skin tone
    faceGrad.addColorStop(1, '#a6643c'); // Contour shadow
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(320 + sway, 205 + bob, 78, 98, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jawline shadow
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(320 + sway, 210 + bob, 76, 0.3, Math.PI - 0.3, false);
    ctx.stroke();

    // 5. Realistic Hair Styling (Dark brown/black with natural volume and lighting)
    const hairGrad = ctx.createLinearGradient(240, 110, 400, 240);
    hairGrad.addColorStop(0, '#241a15');
    hairGrad.addColorStop(0.4, '#38251b');
    hairGrad.addColorStop(1, '#1a120d');
    ctx.fillStyle = hairGrad;

    // Top hair volume
    ctx.beginPath();
    ctx.ellipse(320 + sway, 160 + bob, 86, 68, 0, Math.PI * 0.95, Math.PI * 2.05, false);
    ctx.fill();

    // Left hair sweep
    ctx.beginPath();
    ctx.ellipse(244 + sway, 200 + bob, 26, 62, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right hair sweep
    ctx.beginPath();
    ctx.ellipse(396 + sway, 200 + bob, 26, 62, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 6. Natural Eyebrows
    ctx.strokeStyle = '#231812';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(288 + sway, 178 + bob, 16, Math.PI + 0.3, -0.2, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(352 + sway, 178 + bob, 16, Math.PI + 0.2, -0.3, false);
    ctx.stroke();

    // 7. Realistic Human Eyes (Double eyelid, hazel iris, pupil, catchlight & blink)
    const isBlinking = frame % 150 > 144;
    if (isBlinking) {
      // Natural blink closure
      ctx.strokeStyle = '#3a2318';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(274 + sway, 198 + bob);
      ctx.quadraticCurveTo(288 + sway, 202 + bob, 302 + sway, 198 + bob);
      ctx.moveTo(338 + sway, 198 + bob);
      ctx.quadraticCurveTo(352 + sway, 202 + bob, 366 + sway, 198 + bob);
      ctx.stroke();
    } else {
      // Eye white / Sclera
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(288 + sway, 198 + bob, 14, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(352 + sway, 198 + bob, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Realistic Iris (Warm brown / amber)
      ctx.fillStyle = '#452a1a';
      ctx.beginPath();
      ctx.arc(288 + sway, 198 + bob, 6.5, 0, Math.PI * 2);
      ctx.arc(352 + sway, 198 + bob, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#0f0a07';
      ctx.beginPath();
      ctx.arc(288 + sway, 198 + bob, 3.5, 0, Math.PI * 2);
      ctx.arc(352 + sway, 198 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Natural camera catchlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(290 + sway, 196 + bob, 1.8, 0, Math.PI * 2);
      ctx.arc(354 + sway, 196 + bob, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Nose bridge & tip
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(318 + sway, 192 + bob);
    ctx.lineTo(316 + sway, 224 + bob);
    ctx.lineTo(324 + sway, 226 + bob);
    ctx.stroke();

    // 9. Natural Lips / Speaking Motion
    const mouthSpeech = Math.abs(Math.sin(frame * 0.1)) * 3;
    ctx.fillStyle = '#b4534a'; // Natural lip color
    ctx.beginPath();
    ctx.ellipse(320 + sway, 256 + bob, 16, 5 + mouthSpeech, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lip highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(320 + sway, 255 + bob, 10, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 10. Clean Cosmos Badge Overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(16, 432, 170, 32, 16);
    } else {
      ctx.rect(16, 432, 170, 32);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(userName || 'Teammate', 32, 452);

    animId = requestAnimationFrame(render);
  }

  render();
  const intervalId = setInterval(render, 33);

  const stream: MediaStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();

  const track = stream.getVideoTracks()[0];
  if (track) {
    const origStop = track.stop.bind(track);
    track.stop = () => {
      cancelAnimationFrame(animId);
      clearInterval(intervalId);
      origStop();
    };
  }

  return stream;
};

export const OfficeSpace: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const currentSpace = spaceId || 'billion';
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // User Profile & Status Popover / Modals (Matching Cosmos Images 3, 4, 5, 6, 7, 8)
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [isCustomStatusModalOpen, setIsCustomStatusModalOpen] = useState<boolean>(false);

  // Mode switcher matching Screenshots 3 vs 4: 'space' (2D floor plan) vs 'call' (video/3D avatar stage)
  const [viewMode, setViewMode] = useState<'space' | 'call'>('space');

  // Media dock states
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  // Real Hardware WebRTC & LiveKit States
  const roomRef = useRef<Room | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const isTogglingCameraRef = useRef<boolean>(false);

  const [remoteTracks, setRemoteTracks] = useState<{
    [participantId: string]: {
      videoTrack?: VideoTrack | null;
      audioTrack?: AudioTrack | null;
    };
  }>({});
  const remoteTracksRef = useRef<{
    [participantId: string]: {
      videoTrack?: VideoTrack | null;
      audioTrack?: AudioTrack | null;
    };
  }>({});
  remoteTracksRef.current = remoteTracks;

  const isCameraOffRef = useRef<boolean>(true);
  isCameraOffRef.current = isCameraOff;
  const isMutedRef = useRef<boolean>(true);
  isMutedRef.current = isMuted;
  const isVirtualCameraActiveRef = useRef<boolean>(false);

  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<AudioTrack | MediaStreamTrack | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Initialize initial camera and mic if guest opted-in on entrance screen
  useEffect(() => {
    const initCam = localStorage.getItem('cosmos_initial_camera');
    const initMic = localStorage.getItem('cosmos_initial_mic');
    if (initCam === 'true') {
      setIsCameraOff(false);
      localStorage.removeItem('cosmos_initial_camera');
    }
    if (initMic === 'true') {
      setIsMuted(false);
      localStorage.removeItem('cosmos_initial_mic');
    }
  }, []);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [activeScreenTrack, setActiveScreenTrack] = useState<Track | MediaStreamTrack | MediaStream | null>(null);
  const activeScreenTrackRef = useRef<Track | MediaStreamTrack | MediaStream | null>(null);
  activeScreenTrackRef.current = activeScreenTrack;
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isPipVisible, setIsPipVisible] = useState<boolean>(true);
  const [isDocPipOpen, setIsDocPipOpen] = useState<boolean>(false);
  const [docPipContainer, setDocPipContainer] = useState<HTMLElement | null>(null);
  const docPipWindowRef = useRef<Window | null>(null);

  const closeDocumentPip = useCallback(() => {
    if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
      docPipWindowRef.current.close();
    }
    setIsDocPipOpen(false);
    setDocPipContainer(null);
    docPipWindowRef.current = null;
  }, []);

  // Floating "Enable Notifications" Banner (Cosmos Image 1)
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(() => {
    try {
      const dismissed = localStorage.getItem('cosmos_notif_banner_dismissed');
      if (dismissed === 'true') return false;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  // Dual-tone Web Audio Chime synthesizer for message notifications
  const playNotificationChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(audioCtx.currentTime);
      osc2.start(audioCtx.currentTime + 0.12);
      osc1.stop(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio playback suppressed if user hasn't interacted
    }
  }, []);

  // System desktop notification dispatcher
  const triggerDesktopNotification = useCallback((title: string, body: string) => {
    playNotificationChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: getAvatarUrl(user),
        });
      } catch (e) {
        console.warn('Desktop notification failed:', e);
      }
    }
  }, [playNotificationChime, user]);

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      message.info('Desktop notifications are not supported in this browser.');
      setShowNotificationBanner(false);
      return;
    }
    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }
      if (perm === 'granted') {
        playNotificationChime();
        try {
          const testNotif = new Notification('Cosmos Video Notifications Enabled', {
            body: 'You will receive alerts for in-room chats and teammate calls!',
            icon: getAvatarUrl(user),
          });
          testNotif.onclick = () => window.focus();
        } catch {}
        message.success('Desktop notifications enabled! Check bottom-right of Windows desktop.');
        localStorage.setItem('cosmos_notif_banner_dismissed', 'true');
        setShowNotificationBanner(false);
      } else {
        message.warning('Notification permission blocked or dismissed in browser settings.');
        setShowNotificationBanner(false);
      }
    } catch {
      setShowNotificationBanner(false);
    }
  };

  // In-Meeting Room Chat States (Cosmos Images 2 & 5)
  const [roomMessages, setRoomMessages] = useState<ChatMessageType[]>([]);
  const [roomChatInput, setRoomChatInput] = useState<string>('');
  const [isSendingRoomMsg, setIsSendingRoomMsg] = useState<boolean>(false);
  const [floatingRoomToast, setFloatingRoomToast] = useState<{
    roomName: string;
    senderName: string;
    text: string;
    avatarSeed?: string;
  } | null>(null);
  const prevMsgCountRef = useRef<number>(0);
  const roomChatScrollRef = useRef<HTMLDivElement>(null);

  // Cosmos Navigation & Space Roles (Matching Images 2 & 4)
  const [spaceInfo, setSpaceInfo] = useState<{ name: string; invite_code: string; allow_link_join: boolean } | null>(null);
  const [userRoleInSpace, setUserRoleInSpace] = useState<'Owner' | 'Admin' | 'Member' | 'Guest'>('Member');
  const [spaceMembersList, setSpaceMembersList] = useState<any[]>([]);

  // URL query params for initial guest room entry & gallery mode
  const [searchParams] = useSearchParams();
  const initialRoom = searchParams.get('room');
  const isGuestAccess = searchParams.get('guest') === 'true' || user?.role === 'Guest' || userRoleInSpace === 'Guest';

  // Guest Room Access Restriction & Permission States
  const [allowedRooms, setAllowedRooms] = useState<string[]>(() => {
    return initialRoom ? [initialRoom] : ['cabin-1'];
  });
  const [guestAccessMode, setGuestAccessMode] = useState<'specific_room' | 'all_offices'>('specific_room');
  const [isGuestRequestModalOpen, setIsGuestRequestModalOpen] = useState<boolean>(false);
  const [requestedZone, setRequestedZone] = useState<typeof OFFICE_ZONES[0] | null>(null);
  const [guestRequestStatus, setGuestRequestStatus] = useState<'pending' | 'approved_room' | 'approved_all' | 'rejected' | null>(null);

  // Admin / Primary Owner Pending Requests
  const [pendingGuestRequests, setPendingGuestRequests] = useState<Array<{
    id: string;
    guest_name: string;
    guest_email: string;
    requested_room: string;
    requested_room_name: string;
    status: string;
    created_at: string;
  }>>([]);

  const isAdminOrOwner = userRoleInSpace === 'Owner' || userRoleInSpace === 'Admin' || user?.role === 'Admin' || (spaceMembersList.length > 0 && spaceMembersList[0]?.role === 'Owner' && spaceMembersList[0]?.email === user?.email);

  // Modals for Cosmos Navigation
  const [isUserPrefModalOpen, setIsUserPrefModalOpen] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteModalMode, setInviteModalMode] = useState<'office' | 'guest_room'>('office');
  const [inviteSearchName, setInviteSearchName] = useState<string>('');
  const [startInGalleryView, setStartInGalleryView] = useState<boolean>(true);
  const [selectedGuestRoom, setSelectedGuestRoom] = useState<string>('cabin-1');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [isOfficeHoursModalOpen, setIsOfficeHoursModalOpen] = useState<boolean>(false);
  const [isSpaceSettingsModalOpen, setIsSpaceSettingsModalOpen] = useState<boolean>(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSpaceDetails = async () => {
      try {
        const [membersRes, infoRes] = await Promise.allSettled([
          spacesApi.getMembers(currentSpace),
          spacesApi.getInviteInfo(currentSpace),
        ]);
        if (!isMounted) return;
        if (infoRes.status === 'fulfilled' && infoRes.value) {
          setSpaceInfo({
            name: infoRes.value.space_name || currentSpace,
            invite_code: infoRes.value.invite_code,
            allow_link_join: infoRes.value.allow_link_join ?? true,
          });
        }
        if (membersRes.status === 'fulfilled' && membersRes.value) {
          setSpaceMembersList(membersRes.value);
          const myMember = membersRes.value.find(
            (m) =>
              (m.user && String(m.user) === String(user?.id)) ||
              (m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase())
          );
          if (myMember?.role) {
            setUserRoleInSpace(myMember.role);
          } else if (user?.role === 'Admin') {
            setUserRoleInSpace('Admin');
          }
        }
      } catch (e) {
        console.warn('Error fetching space details for menu:', e);
      }
    };
    fetchSpaceDetails();
    return () => {
      isMounted = false;
    };
  }, [currentSpace, user]);

  // Initial guest room auto-navigation
  useEffect(() => {
    if (initialRoom) {
      const targetZone = OFFICE_ZONES.find((z) => z.id === initialRoom);
      if (targetZone) {
        const seatX = Math.round(targetZone.x + targetZone.width / 2);
        const seatY = Math.round(targetZone.y + targetZone.height / 2);
        setMyPos({ x: seatX, y: seatY });
        setTargetPos({ x: seatX, y: seatY });
        syncPresence(seatX, seatY, targetZone.name);
      }
    }
  }, [initialRoom]);

  // Sync guest permissions from backend on load
  useEffect(() => {
    if (!isGuestAccess || !currentSpace) return;
    let isMounted = true;
    const fetchGuestStatus = async () => {
      try {
        const res = await spacesApi.getGuestAccessStatus(currentSpace);
        if (!isMounted) return;
        if (res.access === 'all_offices') {
          setGuestAccessMode('all_offices');
        }
        if (res.allowed_rooms && res.allowed_rooms.length > 0) {
          setAllowedRooms(res.allowed_rooms);
        }
      } catch (err) {
        console.warn('Error fetching guest access status:', err);
      }
    };
    fetchGuestStatus();
    return () => { isMounted = false; };
  }, [isGuestAccess, currentSpace]);

  // Admin / Primary Owner poll pending guest access requests every 2 seconds
  useEffect(() => {
    if (!isAdminOrOwner || !currentSpace) return;
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const reqs = await spacesApi.getPendingGuestAccessRequests(currentSpace);
        if (isMounted) {
          setPendingGuestRequests(reqs || []);
        }
      } catch (err) {
        // offline / network
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdminOrOwner, currentSpace]);

  const suggestedList = React.useMemo(() => {
    const list: { name: string; email?: string }[] = [];
    if (spaceMembersList && spaceMembersList.length > 0) {
      spaceMembersList.forEach((m) => {
        const name = m.name || (m.email ? m.email.split('@')[0] : 'Member');
        // Do not show the currently logged in user themselves
        const isSelf =
          (user?.email && m.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
          (user?.name && name.toLowerCase() === user.name.toLowerCase());

        if (!isSelf && !list.some((item) => (m.email && item.email === m.email) || item.name.toLowerCase() === name.toLowerCase())) {
          list.push({ name, email: m.email });
        }
      });
    }
    if (inviteSearchName.trim()) {
      const q = inviteSearchName.trim().toLowerCase();
      return list.filter(
        (item) => item.name.toLowerCase().includes(q) || (item.email && item.email.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 8);
  }, [spaceMembersList, user, inviteSearchName]);

  const handleQuickInvite = async (targetNameOrEmail?: string, directEmail?: string) => {
    const input = (targetNameOrEmail || inviteSearchName).trim();
    if (!input) {
      message.warning('Please enter a name or email address');
      return;
    }

    // Resolve target email
    let emailToSend = directEmail || '';
    if (!emailToSend) {
      if (input.includes('@')) {
        emailToSend = input;
      } else {
        const matched = spaceMembersList.find(
          (m) =>
            (m.name && m.name.toLowerCase() === input.toLowerCase()) ||
            (m.email && m.email.toLowerCase().includes(input.toLowerCase()))
        );
        if (matched?.email) {
          emailToSend = matched.email;
        }
      }
    }

    setInviteLoading(true);
    try {
      if (emailToSend) {
        await spacesApi.addMembers(currentSpace, [emailToSend], 'Member');
        message.success(`Call invitation sent to ${input} (${emailToSend})!`);
      } else {
        message.info(`Please enter a valid email address for ${input} to send an invitation.`);
      }
      setInviteSearchName('');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const isOwnerOrAdmin =
    userRoleInSpace === 'Owner' ||
    userRoleInSpace === 'Admin' ||
    user?.role === 'Admin';

  const openDocumentPip = useCallback(async (customWidth?: number, customHeight?: number) => {
    if (!('documentPictureInPicture' in window)) {
      message.info('Picture-in-Picture window is running inside this browser tab.');
      return;
    }
    try {
      if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
        docPipWindowRef.current.focus();
        return;
      }
      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: customWidth || (isScreenSharing || !isCameraOff ? 460 : 340),
        height: customHeight || 260,
      });
      docPipWindowRef.current = pipWin;

      // Copy all style sheets into the PIP window
      [...document.styleSheets].forEach((sheet) => {
        try {
          const rules = [...sheet.cssRules].map((r) => r.cssText).join('');
          const style = pipWin.document.createElement('style');
          style.textContent = rules;
          pipWin.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = pipWin.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pipWin.document.head.appendChild(link);
          }
        }
      });

      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.padding = '0';
      pipWin.document.body.style.backgroundColor = '#0c0d19';
      pipWin.document.body.style.overflow = 'hidden';

      setDocPipContainer(pipWin.document.body);
      setIsDocPipOpen(true);

      pipWin.addEventListener('pagehide', () => {
        setIsDocPipOpen(false);
        setDocPipContainer(null);
        docPipWindowRef.current = null;
      });
    } catch (err: any) {
      console.warn('Document Picture-in-Picture error:', err);
    }
  }, [isScreenSharing, isCameraOff]);

  // Safe cleanup of media tracks and WebRTC session
  const cleanupMedia = useCallback(() => {
    closeDocumentPip();
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localVideoStreamRef.current) {
      localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
      localVideoStreamRef.current = null;
    }
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((track) => track.stop());
      localAudioStreamRef.current = null;
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      localScreenStreamRef.current = null;
    }
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setCameraStream(null);
    setScreenStream(null);
    setActiveScreenTrack(null);
    setIsScreenSharing(false);
  }, [closeDocumentPip]);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // Connect to LiveKit Room for this office space with WebRTC fallback
  useEffect(() => {
    let isMounted = true;
    const initOfficeRoom = async () => {
      try {
        const tokenRes = await livekitApi.getRoomToken(`office-${currentSpace}`);
        if (!tokenRes?.token || !tokenRes?.server_url || !isMounted) return;

        const room = new Room({
          adaptiveStream: false,
          dynacast: false,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
          publishDefaults: {
            simulcast: false,
            videoEncoding: {
              maxBitrate: 2_500_000,
              maxFramerate: 30,
            },
            videoCodec: 'vp8',
            screenShareEncoding: {
              maxBitrate: 4_000_000,
              maxFramerate: 30,
            },
          },
        });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (pub.source === Track.Source.ScreenShare) {
            setActiveScreenTrack(track as VideoTrack);
            setIsScreenSharing(true);
            message.info(`${participant.name || 'A teammate'} is sharing their screen`);
          } else if (pub.source === Track.Source.Camera) {
            const vTrack = track as VideoTrack;
            setRemoteTracks((prev) => {
              const updated = { ...prev };
              const id = participant.identity;
              const name = participant.name;
              if (id) {
                updated[id] = { ...updated[id], videoTrack: vTrack };
                updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], videoTrack: vTrack };
              }
              if (name) {
                updated[name] = { ...updated[name], videoTrack: vTrack };
                updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], videoTrack: vTrack };
              }
              return updated;
            });
          } else if (pub.source === Track.Source.Microphone) {
            const aTrack = track as AudioTrack;
            // Direct browser audio attachment: guarantees mic audio is heard regardless of active view or screen sharing
            try {
              const existingEl = document.getElementById(`global-audio-${participant.identity}`);
              if (!existingEl) {
                const audioEl = aTrack.attach();
                audioEl.id = `global-audio-${participant.identity}`;
                audioEl.setAttribute('data-participant-identity', participant.identity);
                audioEl.autoplay = true;
                document.body.appendChild(audioEl);
              }
            } catch (attachErr) {
              console.warn('Native AudioTrack attach error:', attachErr);
            }
            setRemoteTracks((prev) => {
              const updated = { ...prev };
              const id = participant.identity;
              const name = participant.name;
              if (id) {
                updated[id] = { ...updated[id], audioTrack: aTrack };
                updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], audioTrack: aTrack };
              }
              if (name) {
                updated[name] = { ...updated[name], audioTrack: aTrack };
                updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], audioTrack: aTrack };
              }
              return updated;
            });
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, pub?: RemoteTrackPublication, participant?: RemoteParticipant) => {
          if (track === activeScreenTrackRef.current) {
            setActiveScreenTrack(null);
            setIsScreenSharing(false);
          }
          if (track.kind === Track.Kind.Audio) {
            try {
              const existingEl = document.getElementById(`global-audio-${participant?.identity}`);
              if (existingEl) existingEl.remove();
              (track as any).detach().forEach((el: HTMLElement) => el.remove());
            } catch {}
          }
          if (participant) {
            const id = participant.identity;
            const name = participant.name;
            if (pub?.source === Track.Source.Camera) {
              setRemoteTracks((prev) => {
                const updated = { ...prev };
                if (id) {
                  if (updated[id]) updated[id] = { ...updated[id], videoTrack: null };
                  if (updated[id.toLowerCase()]) updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], videoTrack: null };
                }
                if (name) {
                  if (updated[name]) updated[name] = { ...updated[name], videoTrack: null };
                  if (updated[name.toLowerCase()]) updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], videoTrack: null };
                }
                return updated;
              });
            } else if (pub?.source === Track.Source.Microphone) {
              setRemoteTracks((prev) => {
                const updated = { ...prev };
                if (id) {
                  if (updated[id]) updated[id] = { ...updated[id], audioTrack: null };
                  if (updated[id.toLowerCase()]) updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], audioTrack: null };
                }
                if (name) {
                  if (updated[name]) updated[name] = { ...updated[name], audioTrack: null };
                  if (updated[name.toLowerCase()]) updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], audioTrack: null };
                }
                return updated;
              });
            }
          }
        });

        // Track mute state changes from remote teammates
        room.on(RoomEvent.TrackMuted, (pub: any, participant: any) => {
          const id = participant.identity;
          const name = participant.name;
          setRemoteTracks((prev) => {
            const updated = { ...prev };
            if (pub.source === Track.Source.Microphone) {
              if (id && updated[id]) updated[id] = { ...updated[id], audioTrack: null };
              if (id && updated[id.toLowerCase()]) updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], audioTrack: null };
              if (name && updated[name]) updated[name] = { ...updated[name], audioTrack: null };
              if (name && updated[name.toLowerCase()]) updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], audioTrack: null };
            }
            return updated;
          });
        });

        room.on(RoomEvent.TrackUnmuted, (pub: any, participant: any) => {
          const id = participant.identity;
          const name = participant.name;
          if (pub.track) {
            setRemoteTracks((prev) => {
              const updated = { ...prev };
              if (pub.source === Track.Source.Microphone) {
                const aTrack = pub.track as AudioTrack;
                if (id) {
                  updated[id] = { ...updated[id], audioTrack: aTrack };
                  updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], audioTrack: aTrack };
                }
                if (name) {
                  updated[name] = { ...updated[name], audioTrack: aTrack };
                  updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], audioTrack: aTrack };
                }
              } else if (pub.source === Track.Source.Camera) {
                const vTrack = pub.track as VideoTrack;
                if (id) {
                  updated[id] = { ...updated[id], videoTrack: vTrack };
                  updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], videoTrack: vTrack };
                }
                if (name) {
                  updated[name] = { ...updated[name], videoTrack: vTrack };
                  updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], videoTrack: vTrack };
                }
              }
              return updated;
            });
          }
        });

        await Promise.race([
          room.connect(tokenRes.server_url, tokenRes.token),
          new Promise((_, reject) => setTimeout(() => reject(new Error('LiveKit timeout')), 8000)),
        ]);

        // Publish local camera track if active
        if (localVideoTrack && !isCameraOffRef.current && room.localParticipant) {
          try {
            await room.localParticipant.publishTrack(localVideoTrack as any, {
              name: 'camera',
              source: Track.Source.Camera,
            });
          } catch {}
        }

        // Attach any tracks from participants already in the room
        room.remoteParticipants.forEach((p) => {
          p.trackPublications.forEach((pub) => {
            if (pub.track && pub.isSubscribed) {
              const id = p.identity;
              const name = p.name;
              if (pub.source === Track.Source.Camera) {
                const vTrack = pub.track as VideoTrack;
                setRemoteTracks((prev) => {
                  const updated = { ...prev };
                  if (id) {
                    updated[id] = { ...updated[id], videoTrack: vTrack };
                    updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], videoTrack: vTrack };
                  }
                  if (name) {
                    updated[name] = { ...updated[name], videoTrack: vTrack };
                    updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], videoTrack: vTrack };
                  }
                  return updated;
                });
              } else if (pub.source === Track.Source.Microphone) {
                const aTrack = pub.track as AudioTrack;
                setRemoteTracks((prev) => {
                  const updated = { ...prev };
                  if (id) {
                    updated[id] = { ...updated[id], audioTrack: aTrack };
                    updated[id.toLowerCase()] = { ...updated[id.toLowerCase()], audioTrack: aTrack };
                  }
                  if (name) {
                    updated[name] = { ...updated[name], audioTrack: aTrack };
                    updated[name.toLowerCase()] = { ...updated[name.toLowerCase()], audioTrack: aTrack };
                  }
                  return updated;
                });
              }
            }
          });
        });
      } catch {
        // Fallback to browser direct WebRTC
      }
    };

    initOfficeRoom();

    return () => {
      isMounted = false;
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [currentSpace]);

  // Real Microphone Toggle (PRD Step 3)
  const toggleMicrophone = async () => {
    const nextMuted = !isMuted;
    if (!nextMuted) {
      // UNMUTE: Request microphone access
      let activeTrack: MediaStreamTrack | AudioTrack | null = null;

      // 1. LiveKit native microphone if connected
      if (roomRef.current && roomRef.current.state === 'connected') {
        try {
          await roomRef.current.localParticipant.setMicrophoneEnabled(true);
          const audioPub = Array.from(roomRef.current.localParticipant.audioTrackPublications.values())[0];
          if (audioPub?.track) {
            activeTrack = audioPub.track as AudioTrack;
          }
        } catch (e) {
          console.warn('LiveKit mic enable failed, falling back to getUserMedia:', e);
        }
      }

      // 2. Hardware getUserMedia fallback
      if (!activeTrack) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localAudioStreamRef.current = stream;
          const track = stream.getAudioTracks()[0];
          activeTrack = track;

          // Publish to LiveKit room if connected
          if (roomRef.current && roomRef.current.state === 'connected' && track) {
            roomRef.current.localParticipant
              .publishTrack(track, {
                name: 'microphone',
                source: Track.Source.Microphone,
              })
              .catch(console.warn);
          }
        } catch (err) {
          console.warn('Mic access error:', err);
          message.warning('Microphone permission not granted or device not found.');
          return;
        }
      }

      setLocalAudioTrack(activeTrack);
      setIsMuted(false);
      message.success('Microphone unmuted');
      // Broadcast unmuted state to all teammates immediately!
      presenceApi.updatePresence({ is_muted: false }).catch(() => {});
    } else {
      // MUTE: Stop microphone
      if (roomRef.current && roomRef.current.state === 'connected') {
        try {
          await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        } catch {}
      }
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        localAudioStreamRef.current = null;
      }
      setLocalAudioTrack(null);
      setIsMuted(true);
      message.info('Microphone muted');
      // Broadcast muted state to all teammates immediately!
      presenceApi.updatePresence({ is_muted: true }).catch(() => {});
    }
  };

  // Real Camera Toggle
  const toggleCamera = async () => {
    // 1. Concurrency Guard: prevent double-clicks from running duplicate requests
    if (isTogglingCameraRef.current) return;
    isTogglingCameraRef.current = true;

    const nextCamOff = !isCameraOff;
    if (!nextCamOff) {
      // TURN ON CAMERA
      try {
        let stream: MediaStream | null = null;
        let isVirtual = false;

        // 1. First attempt: Standard real webcam constraints (unconstrained, allowing Chrome to share stream across windows)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (initialErr: any) {
          console.warn('First getUserMedia attempt failed, trying basic video:', initialErr);
          // 2. Second attempt: Basic { video: true } with no ideal dimensions
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch (basicErr: any) {
            console.warn('Physical camera acquisition failed:', basicErr);
            const isBusyOrLocked =
              basicErr?.name === 'NotReadableError' ||
              basicErr?.name === 'TrackStartError' ||
              basicErr?.name === 'AbortError' ||
              basicErr?.name === 'OverconstrainedError';

            if (isBusyOrLocked) {
              message.info('Camera in use by another app — Realistic camera active!');
              stream = createVirtualCameraStream(user?.name || 'Teammate', user?.avatar_seed || user?.name || 'Cosmos');
              isVirtual = true;
              isVirtualCameraActiveRef.current = true;
            } else {
              throw basicErr;
            }
          }
        }

        if (stream) {
          localVideoStreamRef.current = stream;
          setCameraStream(stream);
          const track = stream.getVideoTracks()[0];
          setLocalVideoTrack(track);
          setIsCameraOff(false);
          message.success(isVirtual ? 'Camera active' : 'Camera turned on');

          // Broadcast camera state in presence sync immediately
          presenceApi.updatePresence({ is_camera_on: true }).catch(() => {});

          // Publish camera track to LiveKit room so remote teammates see it
          if (roomRef.current && roomRef.current.state === 'connected') {
            try {
              const existingPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
              if (existingPub?.track) {
                await roomRef.current.localParticipant.unpublishTrack(existingPub.track as any).catch(() => {});
              }
              await roomRef.current.localParticipant.publishTrack(track, {
                name: 'camera',
                source: Track.Source.Camera,
                simulcast: false,
                videoEncoding: {
                  maxBitrate: 2_500_000,
                  maxFramerate: 30,
                },
                videoCodec: 'vp8',
              });
            } catch (pubErr) {
              console.warn('LiveKit publishTrack error:', pubErr);
            }
          }
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        setIsCameraOff(true);
        presenceApi.updatePresence({ is_camera_on: false }).catch(() => {});
        message.warning('Camera permission not granted or device not available.');
      } finally {
        isTogglingCameraRef.current = false;
      }
    } else {
      // TURN OFF CAMERA: Instant teardown
      setIsCameraOff(true);
      isVirtualCameraActiveRef.current = false;
      setCameraStream(null);
      setLocalVideoTrack(null);

      // Stop all hardware tracks synchronously to turn off camera LED immediately
      if (localVideoStreamRef.current) {
        localVideoStreamRef.current.getTracks().forEach((t) => t.stop());
        localVideoStreamRef.current = null;
      }

      // Unpublish camera track in LiveKit
      if (roomRef.current && roomRef.current.localParticipant) {
        try {
          roomRef.current.localParticipant.videoTrackPublications.forEach((pub) => {
            if (pub.source === Track.Source.Camera && pub.track) {
              roomRef.current?.localParticipant.unpublishTrack(pub.track as any).catch(() => {});
            }
          });
        } catch {}
      }

      // Broadcast camera off in presence sync
      presenceApi.updatePresence({ is_camera_on: false }).catch(() => {});
      message.info('Camera turned off');
      isTogglingCameraRef.current = false;
    }
  };

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.localParticipant.setScreenShareEnabled(false).catch(() => {});
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current = null;
    }
    setActiveScreenTrack(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    message.info('Screen sharing stopped.');
  }, []);

  // Real Screen Sharing Toggle (PRD Section 6.3 & Step 4)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    // START SCREEN SHARING: Request tab/window/screen from browser
    if (roomRef.current) {
      try {
        const pub = await roomRef.current.localParticipant.setScreenShareEnabled(true, {
          audio: false,
          selfBrowserSurface: 'exclude',
          surfaceSwitching: 'include',
          resolution: { width: 1920, height: 1080, frameRate: 30 },
        });
        const screenPub =
          pub ||
          Array.from(roomRef.current.localParticipant.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.ScreenShare
          );
        if (screenPub?.track) {
          setActiveScreenTrack(screenPub.track as VideoTrack);
          setIsScreenSharing(true);
          // Ensure local microphone remains unmuted and active during screen sharing
          if (!isMuted && roomRef.current.state === 'connected') {
            roomRef.current.localParticipant.setMicrophoneEnabled(true).catch(() => {});
          }
          if (screenPub.track.mediaStreamTrack) {
            const ms = new MediaStream([screenPub.track.mediaStreamTrack]);
            setScreenStream(ms);
            screenPub.track.mediaStreamTrack.onended = () => {
              stopScreenShare();
            };
          }
          message.success('Screen sharing started.');
          // Auto launch Document PIP across all OS apps
          await openDocumentPip(460, 260);
          return;
        }
      } catch (e) {
        console.warn('LiveKit screen share failed, falling back to getDisplayMedia:', e);
      }
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: false,
      });
      localScreenStreamRef.current = displayStream;
      setScreenStream(displayStream);
      setActiveScreenTrack(displayStream);
      setIsScreenSharing(true);
      const screenTrack = displayStream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
      message.success('Screen sharing started.');
      // Auto launch Document PIP across all OS apps
      await openDocumentPip(460, 260);
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        message.error('Failed to start screen share.');
      }
    }
  };

  // Avatar position on 2D map - Default spawn point at Reception Area (Cosmos Image 1)
  const [myPos, setMyPos] = useState<{ x: number; y: number }>({ x: 270, y: 725 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right');
  const [activeZone, setActiveZone] = useState<string | null>('Reception Area');
  // Dynamically calculate the starting zoom to fill the office space nicely on entry
  const [zoom, setZoom] = useState<number>(() => {
    try {
      const availWidth = window.innerWidth - 260; // minus sidebar
      const availHeight = window.innerHeight - 130; // minus navbar & bottom bar
      const scaleX = availWidth / 1400;
      const scaleY = availHeight / 900;
      const idealZoom = Math.min(scaleX, scaleY) * 0.96;
      return Math.max(0.65, Math.min(1.05, +idealZoom.toFixed(2)));
    } catch {
      return 0.82;
    }
  });

  // Step 6: Live Presence list of other teammates
  const [presences, setPresences] = useState<PresenceUpdate[]>([
    {
      user_id: 'c1',
      user_name: 'Charu Latha',
      status: 'online',
      current_desk: 'Desk 8',
      x: 300,
      y: 400,
    },
    {
      user_id: 'c2',
      user_name: 'Alex Rivera',
      status: 'online',
      current_desk: 'Daily Standup',
      x: 900,
      y: 350,
    },
  ]);

  // Keep latest user & space refs so syncPresence doesn't re-create or trigger effects on status changes
  const userRef = useRef(user);
  userRef.current = user;
  const currentSpaceRef = useRef(currentSpace);
  currentSpaceRef.current = currentSpace;

  // Sync own position with backend presence (Step 6 Presence)
  const syncPresence = useCallback(
    async (x: number, y: number, desk?: string) => {
      try {
        const u = userRef.current;
        const isAway = u?.status_mode === 'Away' || u?.status === 'offline';
        await presenceApi.updatePresence({
          x,
          y,
          desk,
          space: currentSpaceRef.current,
          status: isAway ? 'offline' : 'online',
          is_muted: isMutedRef.current,
          is_camera_on: !isCameraOffRef.current,
        });
      } catch {
        // Local state fallback
      }
    },
    []
  );

  // Automatically mute microphone & camera when entering 'Away' mode (Image 3)
  useEffect(() => {
    if (user?.status_mode === 'Away' || user?.status === 'offline') {
      setIsMuted(true);
      setIsCameraOff(true);
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
      if (roomRef.current && roomRef.current.state === 'connected') {
        try { roomRef.current.localParticipant.setMicrophoneEnabled(false); } catch {}
        try { roomRef.current.localParticipant.setCameraEnabled(false); } catch {}
      }
    }
  }, [user?.status_mode, user?.status, cameraStream]);

  // Clean teardown on tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      presenceApi.updatePresence({ is_muted: true, is_camera_on: false }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Initial load: Only spawn in Reception Area once on initial space join, NEVER when toggling status
  const spawnedSpaceRef = useRef<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const initPresence = async () => {
      try {
        // Only spawn in the Reception Area on entry so all users arrive at Reception first
        if (spawnedSpaceRef.current !== currentSpace) {
          spawnedSpaceRef.current = currentSpace;
          const RECEPTION_X = 270;
          const RECEPTION_Y = 725;
          setMyPos({ x: RECEPTION_X, y: RECEPTION_Y });
          setTargetPos(null);
          setActiveZone('Reception Area');

          // Reset presence on join/load so mic & camera start OFF, and position is Reception Area
          await presenceApi.updatePresence({
            space: currentSpace,
            is_muted: true,
            is_camera_on: false,
            x: RECEPTION_X,
            y: RECEPTION_Y,
            desk: 'Reception Area',
          }).catch(() => {});
        }

        const data = await presenceApi.getPresences(currentSpace);
        if (data && isMounted) {
          setPresences(data.filter((p) => p.user_id !== user?.id));
        }
      } catch {
        // Backend offline
      }
    };
    initPresence();
    return () => {
      isMounted = false;
    };
  }, [currentSpace, user?.id]);

  // Poll in-room messages when inside a room or in call mode (Cosmos Images 2 & 5)
  useEffect(() => {
    let isMounted = true;
    const effectiveRoom =
      activeZone && activeZone !== 'Reception Area'
        ? activeZone
        : viewMode === 'call'
        ? 'Meeting Room 2'
        : null;

    if (!effectiveRoom) return;

    const roomId = effectiveRoom.toLowerCase().replace(/\s+/g, '-');

    const fetchRoomMsgs = async () => {
      try {
        const msgs = await chatApi.getRoomMessages(roomId);
        if (isMounted && msgs) {
          setRoomMessages(msgs);
          // Detect new incoming message from teammate to trigger floating toast & notification
          if (msgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && String(lastMsg.sender_id) !== String(user?.id)) {
              setFloatingRoomToast({
                roomName: effectiveRoom,
                senderName: lastMsg.sender_name || 'Teammate',
                text: lastMsg.text,
                avatarSeed: lastMsg.sender_name,
              });
              triggerDesktopNotification(
                effectiveRoom,
                `${lastMsg.sender_name || 'Teammate'}: ${lastMsg.text}`
              );
            }
          }
          prevMsgCountRef.current = msgs.length;
        }
      } catch (e) {
        // Suppress room chat poll error
      }
    };

    fetchRoomMsgs();
    const interval = setInterval(fetchRoomMsgs, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeZone, viewMode, user?.id, triggerDesktopNotification]);

  // Auto-dismiss floating toast after 6 seconds
  useEffect(() => {
    if (!floatingRoomToast) return;
    const timer = setTimeout(() => {
      setFloatingRoomToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [floatingRoomToast]);

  // Send message in room chat
  const handleSendRoomMessage = async () => {
    const text = roomChatInput.trim();
    if (!text || isSendingRoomMsg) return;

    const effectiveRoom =
      activeZone && activeZone !== 'Reception Area'
        ? activeZone
        : viewMode === 'call'
        ? 'Meeting Room 2'
        : 'Meeting Room 2';
    const roomId = effectiveRoom.toLowerCase().replace(/\s+/g, '-');

    setIsSendingRoomMsg(true);
    setRoomChatInput('');
    try {
      const newMsg = await chatApi.sendRoomMessage(roomId, text);
      if (newMsg) {
        setRoomMessages((prev) => [...prev, newMsg]);
        prevMsgCountRef.current += 1;
        setTimeout(() => {
          roomChatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    } catch (e) {
      message.error('Failed to send room message');
    } finally {
      setIsSendingRoomMsg(false);
    }
  };

  // Poll active presences every 1.2s for real-time multiplayer office sync
  useEffect(() => {
    let isMounted = true;
    const fetchPresences = async () => {
      try {
        const data = await presenceApi.getPresences(currentSpace);
        if (data && isMounted) {
          setPresences(data.filter((p) => p.user_id !== user?.id));
        }
      } catch {
        // Backend offline
      }
    };
    const interval = setInterval(fetchPresences, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentSpace, user?.id]);

  // Smooth walk animation towards targetPos
  useEffect(() => {
    if (!targetPos) {
      setIsWalking(false);
      return;
    }

    setIsWalking(true);
    const interval = setInterval(() => {
      setMyPos((prev) => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          setTargetPos(null);
          setIsWalking(false);
          syncPresence(targetPos.x, targetPos.y);
          return targetPos;
        }

        const speed = 14;
        const nextX = Math.round(prev.x + (dx / dist) * speed);
        const nextY = Math.round(prev.y + (dy / dist) * speed);

        return {
          x: nextX,
          y: nextY,
        };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [targetPos, syncPresence]);

  // Zone detection
  useEffect(() => {
    const found = OFFICE_ZONES.find((z) => {
      return (
        myPos.x >= z.x - 15 &&
        myPos.x <= z.x + z.width + 15 &&
        myPos.y >= z.y - 15 &&
        myPos.y <= z.y + z.height + 15
      );
    });

    if (found?.name !== activeZone) {
      setActiveZone(found?.name || null);
      if (found) {
        syncPresence(myPos.x, myPos.y, found.name);
      }
    }
  }, [myPos, activeZone, syncPresence]);

  // Proximity Call Engine (Matching Cosmos Video Image 2)
  // Only start a call when avatars walk directly next to each other (within 50px or in the same cabin/room).
  // Nearby desks (85px+ apart) will NOT trigger unwanted calls.
  const PROXIMITY_CALL_DISTANCE = 50;

  const nearbyPresences = presences.filter((p) => {
    const px = p.x ?? 0;
    const py = p.y ?? 0;
    const dx = px - myPos.x;
    const dy = py - myPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sameDesk = Boolean(activeZone && p.current_desk && activeZone === p.current_desk);
    return dist <= PROXIMITY_CALL_DISTANCE || sameDesk;
  });

  const isProximityCallActive = nearbyPresences.length > 0;

  // Local user call participant (matching Image 2 & Image 4)
  const isLocalAway = user?.status_mode === 'Away' || user?.status === 'offline';
  const localCallParticipant: CallParticipant = {
    id: user?.id || 'local-user',
    name: user?.name || 'You',
    isLocal: true,
    isCameraOn: !isLocalAway && !isCameraOff,
    isMuted: isLocalAway || isMuted,
    isAway: isLocalAway,
    customStatus: user?.custom_status,
    videoStream: cameraStream || localVideoStreamRef.current,
    videoTrack: localVideoTrack,
    statusDotColor: isLocalAway ? '#ef4444' : '#22c55e',
    bgColor: '#ec4899',
    avatarSeed: user?.avatar_seed || user?.name || user?.email || 'Charulatha',
  };

  // Remote nearby participants (matching Image 2 & Image 4: e.g. empty chair if Away)
  const bgColorsList = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'];

  const remoteCallParticipants: CallParticipant[] = nearbyPresences.map((p, idx) => {
    const pAny = p as any;
    const isTeammateAway = p.status === 'offline' || pAny.status_mode === 'Away';

    // 1. Direct match from subscribed tracks cache
    const directMedia =
      remoteTracks[p.user_id] ||
      (p.user_id ? remoteTracks[String(p.user_id)] : undefined) ||
      (p.user_id ? remoteTracks[String(p.user_id).toLowerCase()] : undefined) ||
      (p.user_name ? remoteTracks[p.user_name] : undefined) ||
      (p.user_name ? remoteTracks[p.user_name.toLowerCase()] : undefined) ||
      (pAny.user_email ? remoteTracks[pAny.user_email] : undefined) ||
      (pAny.user_email ? remoteTracks[pAny.user_email.toLowerCase()] : undefined);

    // 2. Strict LiveKit participant lookup by exact identity or name
    const matchingParticipant = roomRef.current
      ? Array.from(roomRef.current.remoteParticipants.values()).find((rp) => {
          return (
            rp.identity === String(p.user_id) ||
            rp.identity?.toLowerCase() === String(p.user_id).toLowerCase() ||
            (p.user_name && rp.name?.toLowerCase() === p.user_name.toLowerCase()) ||
            (pAny.user_email && rp.identity?.toLowerCase() === pAny.user_email.toLowerCase())
          );
        })
      : null;

    let participantCameraTrack: VideoTrack | null = null;
    let participantAudioTrack: AudioTrack | null = null;

    if (matchingParticipant) {
      const camPub = matchingParticipant.getTrackPublication(Track.Source.Camera);
      if (camPub?.track) {
        participantCameraTrack = camPub.track as VideoTrack;
      }
      const micPub = matchingParticipant.getTrackPublication(Track.Source.Microphone);
      if (micPub?.track) {
        participantAudioTrack = micPub.track as AudioTrack;
      }
    }

    // STRICT 1-to-1 Track Binding: NEVER fall back to another teammate's video track!
    const videoTrack = !isTeammateAway && (Boolean(p.is_camera_on) || Boolean(participantCameraTrack))
      ? (participantCameraTrack || directMedia?.videoTrack || null)
      : null;
    const hasVideo = Boolean(videoTrack);

    const audioTrack = participantAudioTrack || directMedia?.audioTrack || null;
    const isTeammateMuted = isTeammateAway || (p.is_muted === true && !audioTrack);

    return {
      id: String(p.user_id),
      name: p.user_name || 'Teammate',
      isLocal: false,
      isCameraOn: hasVideo,
      isMuted: isTeammateMuted,
      isAway: isTeammateAway,
      customStatus: pAny.custom_status,
      videoTrack: videoTrack,
      videoStream: null,
      audioTrack: audioTrack,
      statusDotColor: isTeammateAway ? '#ef4444' : '#22c55e',
      bgColor: bgColorsList[idx % bgColorsList.length],
      avatarSeed: pAny.avatar_seed || p.user_name || p.user_id,
    };
  });

  // Call Section contains local user + all nearby teammates
  const activeCallParticipants: CallParticipant[] = [
    localCallParticipant,
    ...remoteCallParticipants,
  ];
  const shouldRenderCallSection = isProximityCallActive || !isCameraOff;

  const moveToZone = useCallback((zone: typeof OFFICE_ZONES[0]) => {
    const seatX = Math.round(zone.x + zone.width / 2);
    const seatY = Math.round(zone.y + zone.height / 2);
    if (seatX < myPos.x) setFacingDirection('left');
    else if (seatX > myPos.x) setFacingDirection('right');
    setTargetPos({ x: seatX, y: seatY });
    syncPresence(seatX, seatY, zone.name);
  }, [myPos.x, syncPresence]);

  const triggerGuestAccessRequest = async (zone: typeof OFFICE_ZONES[0]) => {
    setRequestedZone(zone);
    setGuestRequestStatus('pending');
    setIsGuestRequestModalOpen(true);

    try {
      const res = await spacesApi.requestGuestRoomAccess(currentSpace, zone.id, zone.name);
      if (res.status === 'approved_room' || res.status === 'approved_all') {
        setGuestRequestStatus(res.status as any);
        if (res.status === 'approved_all') setGuestAccessMode('all_offices');
        else setAllowedRooms((prev) => [...prev, zone.id]);
        moveToZone(zone);
        setTimeout(() => setIsGuestRequestModalOpen(false), 1200);
        return;
      }
      message.info(`Permission request for ${zone.name} sent to Space Admin.`);
    } catch (err: any) {
      console.warn('Failed to submit guest access request:', err);
    }
  };

  const handleAdminRespond = async (requestId: string, action: 'approve_room' | 'approve_all' | 'reject') => {
    try {
      const res = await spacesApi.respondGuestAccessRequest(currentSpace, requestId, action);
      if (action === 'approve_room') {
        message.success(`Allowed ${res.guest_name} into ${res.requested_room_name} only.`);
      } else if (action === 'approve_all') {
        message.success(`Granted full space access to ${res.guest_name}!`);
      } else {
        message.info(`Declined access request for ${res.guest_name}.`);
      }
      setPendingGuestRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to respond to guest request');
    }
  };

  // Poll guest request status while modal is waiting
  useEffect(() => {
    if (!isGuestAccess || !isGuestRequestModalOpen || guestRequestStatus !== 'pending') return;

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await spacesApi.getGuestAccessStatus(currentSpace);
        if (!isMounted) return;

        if (res.access === 'all_offices') {
          setGuestAccessMode('all_offices');
          setGuestRequestStatus('approved_all');
          message.success('🎉 Full space access approved by Admin! You can now move anywhere in the office.');
          if (requestedZone) {
            moveToZone(requestedZone);
          }
          setTimeout(() => setIsGuestRequestModalOpen(false), 2200);
          return;
        }

        if (res.latest_request) {
          if (res.latest_request.status === 'approved_room') {
            setGuestRequestStatus('approved_room');
            if (res.allowed_rooms) setAllowedRooms(res.allowed_rooms);
            message.success(`✅ Permission granted! Entering ${requestedZone?.name || 'the room'}.`);
            if (requestedZone) {
              moveToZone(requestedZone);
            }
            setTimeout(() => setIsGuestRequestModalOpen(false), 2200);
            return;
          } else if (res.latest_request.status === 'approved_all') {
            setGuestAccessMode('all_offices');
            setGuestRequestStatus('approved_all');
            message.success('🎉 Full space access approved by Admin! You can now move anywhere in the office.');
            if (requestedZone) {
              moveToZone(requestedZone);
            }
            setTimeout(() => setIsGuestRequestModalOpen(false), 2200);
            return;
          } else if (res.latest_request.status === 'rejected') {
            setGuestRequestStatus('rejected');
            message.warning(`Access to ${requestedZone?.name || 'room'} was declined by Admin.`);
            return;
          }
        }
      } catch (e) {
        console.warn('Poll guest status error:', e);
      }
    };

    const timer = setInterval(checkStatus, 1500);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isGuestAccess, isGuestRequestModalOpen, guestRequestStatus, currentSpace, requestedZone, moveToZone]);

  // Keyboard navigation (WASD & Arrow keys)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const step = 24;
      setTargetPos(null);

      setMyPos((prev) => {
        let nx = prev.x;
        let ny = prev.y;

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') ny -= step;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') ny += step;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          nx -= step;
          setFacingDirection('left');
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          nx += step;
          setFacingDirection('right');
        }

        nx = Math.max(60, Math.min(1340, nx));
        ny = Math.max(60, Math.min(840, ny));

        // Check if new position enters an unauthorized zone
        if (isGuestAccess && guestAccessMode !== 'all_offices') {
          const enteringZone = OFFICE_ZONES.find((z) => {
            return (
              nx >= z.x - 5 &&
              nx <= z.x + z.width + 5 &&
              ny >= z.y - 5 &&
              ny <= z.y + z.height + 5
            );
          });
          if (enteringZone) {
            const isAllowed =
              allowedRooms.includes(enteringZone.id) ||
              allowedRooms.includes(enteringZone.name) ||
              (initialRoom && enteringZone.id === initialRoom) ||
              enteringZone.id === 'reception';
            if (!isAllowed) {
              triggerGuestAccessRequest(enteringZone);
              return prev; // Stop at boundary!
            }
          }
        }

        syncPresence(nx, ny);
        return { x: nx, y: ny };
      });
    },
    [syncPresence, isGuestAccess, guestAccessMode, allowedRooms, initialRoom]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Click on floor: Exact bounding-box calculation from canvasRef (ONLY on dotted canvas)
  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRect.width / 1400;
    const scaleY = canvasRect.height / 900;
    const clickX = (e.clientX - canvasRect.left) / scaleX;
    const clickY = (e.clientY - canvasRect.top) / scaleY;

    // Strict boundary check: ONLY move if clicked directly inside the dotted canvas bounds
    if (clickX < 0 || clickX > 1400 || clickY < 0 || clickY > 900) {
      return;
    }

    const targetX = Math.max(40, Math.min(1360, Math.round(clickX)));
    const targetY = Math.max(40, Math.min(860, Math.round(clickY)));

    // Check if clicked position is inside any zone
    const targetZone = OFFICE_ZONES.find((z) => {
      return (
        targetX >= z.x - 10 &&
        targetX <= z.x + z.width + 10 &&
        targetY >= z.y - 10 &&
        targetY <= z.y + z.height + 10
      );
    });

    if (targetZone && isGuestAccess && guestAccessMode !== 'all_offices') {
      const isAllowed =
        allowedRooms.includes(targetZone.id) ||
        allowedRooms.includes(targetZone.name) ||
        (initialRoom && targetZone.id === initialRoom) ||
        targetZone.id === 'reception';

      if (!isAllowed) {
        triggerGuestAccessRequest(targetZone);
        return;
      }
    }

    if (targetX < myPos.x) {
      setFacingDirection('left');
    } else if (targetX > myPos.x) {
      setFacingDirection('right');
    }

    setTargetPos({ x: targetX, y: targetY });
    // Immediately inform backend so remote observers start gliding concurrently
    syncPresence(targetX, targetY);
  };

  // Click on desk: Walk directly to desk seat
  const handleDeskClick = (zone: typeof OFFICE_ZONES[0]) => {
    if (isGuestAccess && guestAccessMode !== 'all_offices') {
      const isAllowed =
        allowedRooms.includes(zone.id) ||
        allowedRooms.includes(zone.name) ||
        (initialRoom && zone.id === initialRoom);

      if (!isAllowed) {
        triggerGuestAccessRequest(zone);
        return;
      }
    }

    moveToZone(zone);
  };

  const MenuItemRow = ({
    icon,
    label,
    badge,
    isExternal,
    isDanger,
  }: {
    icon: React.ReactNode;
    label: string;
    badge?: string;
    isExternal?: boolean;
    isDanger?: boolean;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '3px 4px',
        fontSize: 13,
        fontWeight: 500,
        color: isDanger ? '#ef4444' : '#1e293b',
        width: '100%',
      }}
    >
      <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', color: isDanger ? '#ef4444' : '#64748b' }}>
        {icon}
      </span>
      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: '#f1f5f9',
            color: '#475569',
            padding: '1px 7px',
            borderRadius: 4,
            marginRight: 4,
          }}
        >
          {badge}
        </span>
      )}
      {isExternal && (
        <ExportOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
      )}
    </div>
  );

  // Cosmos Office Space Navigation Menu (Admin vs Member role-based items)
  const spaceMenuItems: MenuProps['items'] = [
    // 1. User Preferences
    {
      key: 'user-preferences',
      label: <MenuItemRow icon={<SettingOutlined />} label="User Preferences" />,
      onClick: () => setIsUserPrefModalOpen(true),
    },
    { type: 'divider' },

    // 2. Invite
    {
      key: 'invite',
      label: <MenuItemRow icon={<UserAddOutlined />} label="Invite" />,
      onClick: () => setIsInviteModalOpen(true),
    },
    // 3. Invite Guests
    {
      key: 'invite-guests',
      label: <MenuItemRow icon={<TeamOutlined />} label="Invite Guests" />,
      onClick: () => {
        const url = `${window.location.origin}/invite/${spaceInfo?.invite_code || currentSpace}`;
        navigator.clipboard?.writeText(url);
        message.success('Guest invite link copied to clipboard!');
      },
    },

    // 4. Space Members (ADMIN ONLY)
    ...(isOwnerOrAdmin
      ? [
          {
            key: 'space-members',
            label: <MenuItemRow icon={<TeamOutlined />} label="Space Members" isExternal />,
            onClick: () => navigate(`/o/${currentSpace}/admin/manage-members`),
          },
        ]
      : []),

    { type: 'divider' },

    // 5. Floor Plan
    {
      key: 'floor-plan',
      label: <MenuItemRow icon={<AppstoreOutlined />} label="Floor Plan" />,
      onClick: () => {
        setTargetPos({ x: 705, y: 450 });
        syncPresence(705, 450);
        message.info('Centered on Floor Plan');
      },
    },
    // 6. Office hours
    {
      key: 'office-hours',
      label: <MenuItemRow icon={<ClockCircleOutlined />} label="Office hours" />,
      onClick: () => setIsOfficeHoursModalOpen(true),
    },

    // ADMIN ONLY SECTION: Space Settings & Analytics
    ...(isOwnerOrAdmin
      ? [
          { type: 'divider' as const },
          {
            key: 'space-settings',
            label: <MenuItemRow icon={<ToolOutlined />} label="Space Settings" />,
            onClick: () => setIsSpaceSettingsModalOpen(true),
          },
          {
            key: 'analytics-insights',
            label: <MenuItemRow icon={<BarChartOutlined />} label="Analytics & Insights" isExternal />,
            onClick: () => setIsAnalyticsModalOpen(true),
          },
        ]
      : []),

    { type: 'divider' },

    // 7. Dashboard
    {
      key: 'dashboard',
      label: <MenuItemRow icon={<HomeOutlined />} label="Dashboard" isExternal />,
      onClick: () => navigate('/dashboard'),
    },
    // 8. Exit Space
    {
      key: 'exit-space',
      label: <MenuItemRow icon={<LogoutOutlined />} label="Exit Space" isDanger />,
      onClick: () => {
        cleanupMedia();
        message.info('Exited virtual office space');
        navigate('/dashboard');
      },
    },
  ];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0c0f17',
        color: '#ffffff',
        overflow: 'hidden',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* 1. TOP HEADER (Matching Image 1 reference) */}
      <header
        style={{
          height: 52,
          backgroundColor: '#0e1122',
          borderBottom: '1px solid #1a2038',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 30,
        }}
      >
        {/* Left: Space Dropdown matching Cosmos Images 2 & 4 */}
        <Dropdown
          menu={{
            items: spaceMenuItems,
            style: {
              minWidth: 230,
              borderRadius: 12,
              padding: '6px 0',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
            },
          }}
          trigger={['click']}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f43f5e 0%, #38bdf8 100%)',
              }}
            />
            <span>{spaceInfo?.name || currentSpace}</span>
            <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
          </div>
        </Dropdown>

        {/* Center: Top Mode Switcher (Space vs Call - exact match to Image 1) */}
        <div
          style={{
            backgroundColor: '#1c223c',
            borderRadius: 24,
            padding: '3px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {/* Space Button */}
          <button
            onClick={() => setViewMode('space')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 20,
              backgroundColor: viewMode === 'space' ? '#ffffff' : 'transparent',
              color: viewMode === 'space' ? '#0f172a' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: viewMode === 'space' ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>🪐</span>
            <span>Space</span>
            <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>🎧</span>
            <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center' }}>📢</span>
          </button>

          {/* Call Button / Proximity Call Indicator (Matching Image 2) */}
          <button
            onClick={() => setViewMode(viewMode === 'call' ? 'space' : 'call')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 18px',
              borderRadius: 20,
              backgroundColor: isProximityCallActive ? '#064e3b' : viewMode === 'call' ? '#ffffff' : 'transparent',
              color: isProximityCallActive ? '#34d399' : viewMode === 'call' ? '#0f172a' : '#94a3b8',
              border: isProximityCallActive ? '1px solid #059669' : 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: viewMode === 'call' ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isProximityCallActive ? '#22c55e' : '#94a3b8',
                boxShadow: isProximityCallActive ? '0 0 8px #22c55e' : 'none',
              }}
            />
            <span>Call</span>
            {isProximityCallActive && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6ee7b7' }}>({nearbyPresences.length + 1})</span>
            )}
          </button>
        </div>

        {/* Right: Fullscreen / Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ExportOutlined
            style={{ color: '#94a3b8', fontSize: 15, cursor: 'pointer' }}
            title="Pop out window"
            onClick={() => window.open(window.location.href, '_blank')}
          />
          <FullscreenOutlined
            style={{ color: '#94a3b8', fontSize: 15, cursor: 'pointer' }}
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
          />
        </div>
      </header>

      {/* 2. BODY: LEFT SIDEBAR + MAIN CANVAS */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* LEFT COLLAPSIBLE SIDEBAR (Screenshots 3 & 5) */}
        <aside
          style={{
            width: 250,
            backgroundColor: '#ffffff',
            color: '#1e293b',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '16px 12px',
            fontSize: 13,
          }}
        >
          {/* Quick Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            <Space size={8}>
              <SearchOutlined style={{ color: '#94a3b8' }} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>Search</span>
            </Space>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>⌘ K</span>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>🔔 Activities</div>
            <div style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>💬 Past Meeting Chats</div>
            <div style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>📹 Replays</div>
            <div style={{ cursor: 'pointer', color: '#475569', fontWeight: 500 }}>📅 Today's Calendar</div>
          </div>

          {/* Rooms */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Rooms
            </div>
            <div
              style={{
                marginTop: 8,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#2563eb',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => navigate('/room/instant-huddle')}
            >
              <VideoCameraOutlined /> Start New Call
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {[
                { name: 'Cabin 1', icon: '🚪', id: 'cabin-1' },
                { name: 'Cabin 2', icon: '🚪', id: 'cabin-2' },
                { name: 'Cabin 3', icon: '🚪', id: 'cabin-3' },
                { name: 'Cabin 4', icon: '🚪', id: 'cabin-4' },
                { name: 'Cabin 5', icon: '🚪', id: 'cabin-5' },
                { name: 'War Room', icon: '👥', id: 'war-room' },
                { name: 'Reception Area', icon: '🛎️', id: 'reception' },
              ].map((r) => {
                const z = OFFICE_ZONES.find((oz) => oz.id === r.id);
                const isCurrent = activeZone === r.name;
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (z) handleDeskClick(z);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? '#2563eb' : '#475569',
                      backgroundColor: isCurrent ? '#eff6ff' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Channels */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              Channels
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, color: '#475569' }}>
              <div style={{ cursor: 'pointer' }}># announcements</div>
              <div style={{ cursor: 'pointer' }}># general</div>
              <div style={{ cursor: 'pointer' }}># introductions</div>
            </div>
          </div>
        </aside>

        {/* MAIN STAGE: Space (2D Canvas) OR Call (3D Stage) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {viewMode === 'space' ? (
            /* ======================================================== */
            /* VIEW A: 2D Interactive Office Map (Screenshots 3 & 5)    */
            /* ======================================================== */
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Transformable Canvas with exact dot-grid background (The walkable floor) */}
              <div
                ref={canvasRef}
                onClick={handleFloorClick}
                style={{
                  width: 1400,
                  height: 900,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: -700,
                  marginTop: -450,
                  backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                  backgroundSize: '24px 24px',
                  backgroundColor: '#ffffff',
                  cursor: 'crosshair',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
                }}
              >
                {/* Visual Target Beacon when clicked */}
                {targetPos && (
                  <div
                    style={{
                      position: 'absolute',
                      left: targetPos.x - 16,
                      top: targetPos.y - 16,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: '2px solid #3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.25)',
                      pointerEvents: 'none',
                      zIndex: 10,
                      boxShadow: '0 0 14px rgba(59, 130, 246, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                      }}
                    />
                  </div>
                )}

                {/* Render Desks & Zones matching authentic Cosmos Video (Image 1) */}
                {OFFICE_ZONES.map((zone) => {
                  const isCurrentZone = activeZone === zone.name;

                  // 1. Executive Cabins & War Room (Cabin 1 to 5 & War Room)
                  if (zone.type === 'cabin') {
                    const isWarRoom = zone.id === 'war-room';
                    const numChairs = isWarRoom ? 5 : zone.width > 360 ? 4 : 3;
                    const tableHeight = isWarRoom ? 130 : Math.min(zone.height - 110, 68);
                    const tableWidth = isWarRoom ? 250 : Math.min(zone.width - 100, 240);
                    return (
                      <div
                        key={zone.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeskClick(zone);
                        }}
                        style={{
                          position: 'absolute',
                          left: zone.x,
                          top: zone.y,
                          width: zone.width,
                          height: zone.height,
                          border: isCurrentZone ? '2px solid #2563eb' : '1.5px dashed #93c5fd',
                          borderRadius: 16,
                          backgroundColor: isCurrentZone ? 'rgba(37, 99, 235, 0.06)' : 'rgba(239, 246, 255, 0.45)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isCurrentZone ? '0 0 16px rgba(37, 99, 235, 0.15)' : 'none',
                        }}
                      >
                        {/* Glass Wall Glow Header */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 20,
                            right: 20,
                            height: 3,
                            backgroundColor: '#93c5fd',
                            borderRadius: '0 0 2px 2px',
                            opacity: 0.8,
                          }}
                        />

                        {/* Corner Lamp / Plant */}
                        <div style={{ position: 'absolute', left: 14, top: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 14, height: 8, backgroundColor: '#fef08a', border: '1px solid #facc15', borderRadius: '4px 4px 0 0' }} />
                          <div style={{ width: 2, height: 14, backgroundColor: '#94a3b8' }} />
                          <div style={{ width: 10, height: 3, backgroundColor: '#64748b', borderRadius: 2 }} />
                        </div>

                        {/* Presentation Screen on Top Wall */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 10,
                            width: Math.min(140, zone.width - 120),
                            height: 22,
                            border: '1.5px solid #93c5fd',
                            borderRadius: 4,
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: '#2563eb',
                            fontWeight: 700,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                        >
                          🖥️ {zone.name}
                        </div>

                        {/* Top Chairs */}
                        <div style={{ position: 'absolute', top: isWarRoom ? 70 : 30, display: 'flex', gap: 14 }}>
                          {Array.from({ length: numChairs }).map((_, i) => (
                            <div
                              key={`chair-top-${i}`}
                              style={{
                                width: 22,
                                height: 20,
                                border: '1.5px solid #bfdbfe',
                                borderRadius: '50% 50% 4px 4px',
                                backgroundColor: '#eff6ff',
                              }}
                            />
                          ))}
                        </div>

                        {/* Central Conference Table */}
                        <div
                          style={{
                            width: tableWidth,
                            height: tableHeight,
                            border: '1.5px solid #93c5fd',
                            borderRadius: 14,
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            padding: '0 16px',
                            boxShadow: '0 2px 8px rgba(147, 197, 253, 0.3)',
                          }}
                        >
                          {/* Laptop */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 18, height: 12, border: '1px solid #93c5fd', backgroundColor: '#dbeafe', borderRadius: 2 }} />
                            <div style={{ width: 22, height: 3, backgroundColor: '#bfdbfe', borderRadius: 1 }} />
                          </div>

                          {/* Center Plant / Coffee */}
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#86efac', border: '1.5px solid #22c55e' }} />

                          {/* Paper / Tablet */}
                          <div style={{ width: 16, height: 12, border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', borderRadius: 2 }} />
                        </div>

                        {/* Bottom Chairs */}
                        <div style={{ position: 'absolute', bottom: isWarRoom ? 70 : 30, display: 'flex', gap: 14 }}>
                          {Array.from({ length: numChairs }).map((_, i) => (
                            <div
                              key={`chair-bot-${i}`}
                              style={{
                                width: 22,
                                height: 20,
                                border: '1.5px solid #bfdbfe',
                                borderRadius: '4px 4px 50% 50%',
                                backgroundColor: '#eff6ff',
                              }}
                            />
                          ))}
                        </div>

                        {/* Corner Plant (Bottom Right) */}
                        <div style={{ position: 'absolute', right: 14, bottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#86efac', border: '1.5px solid #22c55e' }} />
                          <div style={{ width: 10, height: 8, backgroundColor: '#fde68a', border: '1px solid #d97706', borderRadius: '0 0 4px 4px' }} />
                        </div>

                        {/* Black Pill Badge with Green Left Border */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 10,
                            bottom: 8,
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            borderLeft: '3px solid #10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          }}
                        >
                          <span>{isWarRoom ? '👥' : '🚪'}</span>
                          <span>{zone.name}</span>
                        </div>
                      </div>
                    );
                  }

                  // 2. Reception Area / Lounge (Matching user requirement R)
                  if (zone.type === 'reception') {
                    return (
                      <div
                        key={zone.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeskClick(zone);
                        }}
                        style={{
                          position: 'absolute',
                          left: zone.x,
                          top: zone.y,
                          width: zone.width,
                          height: zone.height,
                          border: isCurrentZone ? '2px solid #2563eb' : '1.5px dashed #cbd5e1',
                          borderRadius: 16,
                          backgroundColor: isCurrentZone ? 'rgba(37, 99, 235, 0.05)' : 'rgba(248, 250, 252, 0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-around',
                          padding: '10px 18px',
                        }}
                      >
                        {/* Left: Modern Reception Welcome Desk */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 80,
                              height: 38,
                              border: '1.5px solid #94a3b8',
                              borderRadius: 6,
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            }}
                          >
                            <span style={{ fontSize: 13 }}>🛎️</span>
                            <div style={{ width: 18, height: 12, border: '1px solid #93c5fd', backgroundColor: '#dbeafe', borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', marginTop: 4 }}>
                            FRONT DESK
                          </div>
                        </div>

                        {/* Center: Large Comfortable Lounge Sofa with Coffee Table */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 170,
                              height: 52,
                              border: '1.5px solid #d97706',
                              borderRadius: 10,
                              backgroundColor: '#fef3c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 8px',
                              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.15)',
                              position: 'relative',
                            }}
                          >
                            {/* Left Armrest */}
                            <div style={{ width: 14, height: '80%', backgroundColor: '#fde68a', border: '1px solid #f59e0b', borderRadius: 4 }} />
                            {/* Cushions */}
                            <div style={{ flex: 1, height: '80%', margin: '0 6px', display: 'flex', gap: 4 }}>
                              <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #fcd34d', borderRadius: 4 }} />
                              <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #fcd34d', borderRadius: 4 }} />
                              <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #fcd34d', borderRadius: 4 }} />
                            </div>
                            {/* Right Armrest */}
                            <div style={{ width: 14, height: '80%', backgroundColor: '#fde68a', border: '1px solid #f59e0b', borderRadius: 4 }} />
                          </div>

                          {/* Coffee Table */}
                          <div
                            style={{
                              width: 100,
                              height: 22,
                              border: '1.5px solid #93c5fd',
                              borderRadius: 6,
                              backgroundColor: '#eff6ff',
                              boxShadow: '0 1px 4px rgba(147, 197, 253, 0.3)',
                            }}
                          />
                        </div>

                        {/* Right: Decorative Potted Floor Tree */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#dcfce7', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)' }}>
                            🌿
                          </div>
                          <div style={{ width: 6, height: 10, backgroundColor: '#78350f' }} />
                          <div style={{ width: 18, height: 12, backgroundColor: '#fed7aa', border: '1px solid #ea580c', borderRadius: '0 0 4px 4px' }} />
                        </div>

                        {/* Black Pill Badge with Green Left Border */}
                        <div
                          style={{
                            position: 'absolute',
                            left: 12,
                            bottom: 8,
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            borderLeft: '3px solid #10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          }}
                        >
                          <span>🛎️</span>
                          <span>{zone.name}</span>
                        </div>
                      </div>
                    );
                  }

                  // 5. Individual Workstations (Desk 1 through Desk 20)
                  return (
                    <div
                      key={zone.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeskClick(zone);
                      }}
                      title={`Click to sit at ${zone.name}`}
                      style={{
                        position: 'absolute',
                        left: zone.x,
                        top: zone.y,
                        width: zone.width,
                        height: zone.height,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Desk Surface */}
                      <div
                        style={{
                          width: zone.width - 4,
                          height: 32,
                          border: isCurrentZone ? '2px solid #2563eb' : '1.5px solid #bfdbfe',
                          borderRadius: 6,
                          backgroundColor: isCurrentZone ? '#eff6ff' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          boxShadow: isCurrentZone ? '0 0 10px rgba(37, 99, 235, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Monitor / Laptop on Desk */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 22, height: 13, border: '1.5px solid #93c5fd', backgroundColor: '#ffffff', borderRadius: 2 }} />
                          <div style={{ width: 8, height: 2, backgroundColor: '#cbd5e1' }} />
                        </div>

                        {/* Plant on edge desks */}
                        {(zone.id === 'desk-1' || zone.id === 'desk-5' || zone.id === 'desk-26' || zone.id === 'desk-30') && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 3,
                              top: 3,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#86efac',
                              border: '1px solid #22c55e',
                            }}
                          />
                        )}
                      </div>

                      {/* Ergonomic Chair Tucked Under */}
                      <div
                        style={{
                          width: 22,
                          height: 18,
                          border: '1.5px solid #bfdbfe',
                          borderRadius: '50% 50% 4px 4px',
                          backgroundColor: '#eff6ff',
                          marginTop: -4,
                          zIndex: 1,
                        }}
                      />

                      {/* Small Desk Label */}
                      <div
                        style={{
                          marginTop: 2,
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          fontSize: 8,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 3,
                          borderLeft: '2px solid #10b981',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          whiteSpace: 'nowrap',
                          zIndex: 2,
                        }}
                      >
                        {zone.name}
                      </div>
                    </div>
                  );
                })}

                {/* Render Other Online Teammates (Step 6 Presence) */}
                {presences.map((p) => {
                  const statusColor =
                    p.status === 'busy' ? '#f59e0b' : p.status === 'in_room' ? '#3b82f6' : '#10b981';
                  return (
                    <div
                      key={p.user_id}
                      style={{
                        position: 'absolute',
                        left: (p.x || 300) - 20,
                        top: (p.y || 400) - 20,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        pointerEvents: 'none',
                        zIndex: 15,
                        transition: 'left 0.4s ease-out, top 0.4s ease-out',
                      }}
                    >
                      <Badge
                        dot
                        status={p.status === 'online' ? 'success' : p.status === 'busy' ? 'warning' : 'processing'}
                        offset={[-4, 32]}
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContact({
                              id: p.user_id,
                              name: p.user_name || 'Teammate',
                              email: `${(p.user_name || 'teammate').toLowerCase().replace(/\s+/g, '.')}@billiontags.com`,
                              role: 'Employee',
                              status: p.status,
                            });
                            setIsChatOpen(true);
                          }}
                          style={{
                            pointerEvents: 'auto',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            display: 'inline-block',
                          }}
                        >
                          <Avatar
                            size={40}
                            src={getAvatarUrl({ name: p.user_name, id: p.user_id, avatar_seed: (p as any).avatar_seed } as User)}
                            style={{
                              border: `2px solid ${statusColor}`,
                              backgroundColor: '#f1f5f9',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              display: 'block',
                            }}
                          />
                        </div>
                      </Badge>
                      <div
                        style={{
                          marginTop: 3,
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 8,
                          whiteSpace: 'nowrap',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          pointerEvents: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {p.user_name}
                      </div>
                    </div>
                  );
                })}

                {/* Local User Avatar Token (Matching Screenshot 3 & 5) */}
                <div
                  style={{
                    position: 'absolute',
                    left: myPos.x - 24,
                    top: myPos.y - 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 25,
                    pointerEvents: 'none',
                    transition: 'left 0.05s linear, top 0.05s linear',
                  }}
                >
                  <Avatar
                    size={48}
                    src={getAvatarUrl(user)}
                    style={{
                      border: '3px solid #f59e0b',
                      backgroundColor: '#f1f5f9',
                      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.6)',
                      transform: isWalking
                        ? facingDirection === 'left'
                          ? 'scaleX(-1) rotate(-6deg)'
                          : 'rotate(6deg)'
                        : facingDirection === 'left'
                        ? 'scaleX(-1)'
                        : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 3,
                      backgroundColor: isGuestAccess ? '#facc15' : '#0f172a',
                      color: isGuestAccess ? '#0f172a' : '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  >
                    {user?.name || 'You'}
                  </div>
                </div>
              </div>

              {/* Zoom & Recenter Controls (Vertical Pill matching Cosmos Image 1) */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  right: 24,
                  bottom: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 20,
                  backgroundColor: '#ffffff',
                  padding: '10px 6px',
                  borderRadius: 22,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Tooltip title="Recenter Avatar" placement="left">
                  <div
                    onClick={() => {
                      setMyPos({ x: 270, y: 725 });
                      setTargetPos(null);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#334155',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <AimOutlined style={{ fontSize: 18 }} />
                  </div>
                </Tooltip>

                <div style={{ width: 20, height: 1, backgroundColor: '#e2e8f0', margin: '2px 0' }} />

                <Tooltip title="Zoom In (+)" placement="left">
                  <div
                    onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.08).toFixed(2)))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <PlusOutlined style={{ fontSize: 13 }} />
                  </div>
                </Tooltip>

                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#475569',
                    userSelect: 'none',
                    padding: '2px 0',
                  }}
                >
                  {Math.round(zoom * 100)}%
                </div>

                <Tooltip title="Zoom Out (-)" placement="left">
                  <div
                    onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.08).toFixed(2)))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <MinusOutlined style={{ fontSize: 13 }} />
                  </div>
                </Tooltip>

                <div style={{ width: 20, height: 1, backgroundColor: '#e2e8f0', margin: '2px 0' }} />

                <Tooltip title="Keyboard shortcuts & help" placement="left">
                  <div
                    onClick={() =>
                      message.info('Cosmos Space: Click anywhere on the floor to walk. Click desks to sit. Chat with nearby teammates.')
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#334155',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <QuestionCircleOutlined style={{ fontSize: 17 }} />
                  </div>
                </Tooltip>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW B: Split Call View & In-Room Chat (Cosmos Images 2 & 5) */
            /* ======================================================== */
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Side: Side-by-Side Video Feeds Grid */}
              <div
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 24px',
                  backgroundColor: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    gap: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Participant 1: Local User Video Card (e.g. Charulatha) */}
                  <div
                    style={{
                      flex: 1,
                      height: '100%',
                      maxHeight: 'calc(100vh - 150px)',
                      borderRadius: 14,
                      backgroundColor: isCameraOff && !isScreenSharing ? '#1e293b' : '#000000',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!isCameraOff || isScreenSharing ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(el) => {
                          if (el) {
                            if (isScreenSharing) {
                              if (activeScreenTrack && 'attach' in activeScreenTrack && typeof (activeScreenTrack as any).attach === 'function') {
                                try { (activeScreenTrack as any).attach(el); } catch {}
                              } else if (screenStream && el.srcObject !== screenStream) {
                                el.srcObject = screenStream;
                              }
                            } else if (!isCameraOff) {
                              if (localVideoTrack && 'attach' in localVideoTrack && typeof (localVideoTrack as any).attach === 'function') {
                                try { (localVideoTrack as any).attach(el); } catch {}
                              } else if (cameraStream && el.srcObject !== cameraStream) {
                                el.srcObject = cameraStream;
                              }
                            }
                            el.play().catch(() => {});
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: isScreenSharing ? 'contain' : 'cover',
                          backgroundColor: '#000000',
                        }}
                      />
                    ) : (
                      <img
                        src={getAvatarUrl(user)}
                        alt="Avatar"
                        style={{
                          width: 220,
                          height: 220,
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.18))',
                        }}
                      />
                    )}

                    {/* Bottom Left Name Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        padding: '4px 12px',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        zIndex: 2,
                      }}
                    >
                      {isMuted && <AudioMutedOutlined style={{ color: '#ef4444', fontSize: 13 }} />}
                      <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 12 }}>
                        {isScreenSharing ? `${user?.name || 'You'} (Screen)` : (user?.name || 'Charulatha')}
                      </span>
                    </div>

                    {/* Bottom Right Green Status Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 18,
                        right: 18,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        border: '2px solid #ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        zIndex: 2,
                      }}
                    />
                  </div>

                  {/* Participant 2: Remote Peer Video Card (e.g. Charu) */}
                  <div
                    style={{
                      flex: 1,
                      height: '100%',
                      maxHeight: 'calc(100vh - 150px)',
                      borderRadius: 14,
                      backgroundColor: '#1e293b',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {remoteCallParticipants.length > 0 && remoteCallParticipants[0].isAway ? (
                      /* Teammate is Away -> Modern Empty Office Chair (Matching Image 4) */
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <EmptyOfficeChairView />
                      </div>
                    ) : remoteCallParticipants.length > 0 && remoteCallParticipants[0].isCameraOn && (remoteCallParticipants[0].videoTrack || remoteCallParticipants[0].videoStream) ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        ref={(el) => {
                          if (el) {
                            const p = remoteCallParticipants[0];
                            if (p.videoTrack) {
                              const track = p.videoTrack;
                              if ('attach' in track && typeof (track as any).attach === 'function') {
                                try {
                                  (track as any).attach(el);
                                } catch {
                                  el.srcObject = new MediaStream([track as any as MediaStreamTrack]);
                                }
                              } else {
                                el.srcObject = new MediaStream([track as any as MediaStreamTrack]);
                              }
                            } else if (p.videoStream && el.srcObject !== p.videoStream) {
                              el.srcObject = p.videoStream;
                            }
                            el.play().catch(() => {});
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          backgroundColor: '#000000',
                        }}
                      />
                    ) : (
                      /* Connected Teammate Avatar matching Cosmos Video */
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#1e293b',
                        }}
                      >
                        <img
                          src={getAvatarUrl({
                            name: remoteCallParticipants[0]?.name,
                            avatar_seed: remoteCallParticipants[0]?.avatarSeed,
                          } as User)}
                          alt="Peer Avatar"
                          style={{
                            width: 220,
                            height: 220,
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.18))',
                          }}
                        />
                      </div>
                    )}

                    {/* Bottom Left Name Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        padding: '4px 12px',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        zIndex: 2,
                      }}
                    >
                      {remoteCallParticipants[0]?.isMuted && <AudioMutedOutlined style={{ color: '#ef4444', fontSize: 13 }} />}
                      <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 12 }}>
                        {remoteCallParticipants[0]?.name || 'Charu'}
                      </span>
                    </div>

                    {/* Bottom Right Status Dot (Red if Away, Green otherwise) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 18,
                        right: 18,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: remoteCallParticipants[0]?.isAway ? '#ef4444' : '#22c55e',
                        border: '2px solid #ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        zIndex: 2,
                      }}
                    />
                  </div>

                  {/* Remote Audio Players for Call View */}
                  {remoteCallParticipants.map((p) => (
                    <audio
                      key={`call-audio-${p.id}`}
                      ref={(el) => {
                        if (el && p.audioTrack) {
                          if ('attach' in p.audioTrack && typeof (p.audioTrack as any).attach === 'function') {
                            try { (p.audioTrack as any).attach(el); } catch {}
                          } else {
                            el.srcObject = new MediaStream([p.audioTrack as any as MediaStreamTrack]);
                          }
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                    />
                  ))}
                </div>

                {/* Floating Incoming Room Message Toast Popup (Cosmos Image 5 Match) */}
                {floatingRoomToast && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 24,
                      right: 28,
                      backgroundColor: '#ffffff',
                      borderRadius: 12,
                      padding: '12px 16px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.16)',
                      border: '1px solid #e2e8f0',
                      minWidth: 280,
                      maxWidth: 380,
                      zIndex: 35,
                      animation: 'slideUp 0.25s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                        {floatingRoomToast.roomName}
                      </span>
                      <CloseOutlined
                        onClick={() => setFloatingRoomToast(null)}
                        style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Avatar
                        size={32}
                        src={getAvatarUrl({ name: floatingRoomToast.senderName } as User)}
                      />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginRight: 6 }}>
                          {floatingRoomToast.senderName}:
                        </span>
                        <span style={{ fontSize: 13, color: '#475569' }}>
                          {floatingRoomToast.text}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Dedicated Meeting Room Chat Sidebar (Cosmos Image 2 Match) */}
              <div
                style={{
                  width: 390,
                  height: '100%',
                  borderLeft: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Chat Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      {activeZone && activeZone !== 'Reception Area' ? activeZone : 'Meeting Room 2'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Room chat</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#64748b' }}>
                    <Tooltip title="Notifications (Click to test / enable)"><BellOutlined onClick={handleEnableNotifications} style={{ fontSize: 16, cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title="Pinned"><PushpinOutlined style={{ fontSize: 16, cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title="Files"><FolderOutlined style={{ fontSize: 16, cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title="Members"><TeamOutlined style={{ fontSize: 16, cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title="More"><EllipsisOutlined style={{ fontSize: 18, cursor: 'pointer' }} /></Tooltip>
                    <Tooltip title="Back to Space">
                      <CloseOutlined
                        onClick={() => setViewMode('space')}
                        style={{ fontSize: 16, cursor: 'pointer', color: '#0f172a' }}
                      />
                    </Tooltip>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {roomMessages.length === 0 ? (
                    <div style={{ marginTop: 'auto', marginBottom: 24 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                        This is the beginning of your chat history in {activeZone && activeZone !== 'Reception Area' ? activeZone : 'Meeting Room 2'}.
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        Send messages, attachments, links, emojis, and more.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center', margin: '8px 0' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 10px', borderRadius: 10 }}>
                          Today
                        </span>
                      </div>
                      {roomMessages.map((msg, idx) => (
                        <div key={msg.id || idx} style={{ display: 'flex', gap: 10 }}>
                          <Avatar
                            size={32}
                            src={getAvatarUrl({ name: msg.sender_name } as User)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {msg.sender_name || 'Teammate'}
                              </span>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#334155', marginTop: 2, lineHeight: 1.4 }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={roomChatScrollRef} />
                    </>
                  )}
                </div>

                {/* Chat Composer */}
                <div style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9' }}>
                  <div
                    style={{
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 12,
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Formatting Tools */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                      <BoldOutlined style={{ cursor: 'pointer' }} />
                      <ItalicOutlined style={{ cursor: 'pointer' }} />
                      <StrikethroughOutlined style={{ cursor: 'pointer' }} />
                      <UnorderedListOutlined style={{ cursor: 'pointer' }} />
                      <OrderedListOutlined style={{ cursor: 'pointer' }} />
                      <CodeOutlined style={{ cursor: 'pointer' }} />
                    </div>

                    {/* Input Area */}
                    <Input.TextArea
                      value={roomChatInput}
                      onChange={(e) => setRoomChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendRoomMessage();
                        }
                      }}
                      placeholder={`Message ${activeZone && activeZone !== 'Reception Area' ? activeZone : 'Meeting Room 2'}`}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      bordered={false}
                      style={{ padding: 0, fontSize: 13, resize: 'none' }}
                    />

                    {/* Bottom Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', fontSize: 15 }}>
                        <PaperClipOutlined style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Aa</span>
                        <SmileOutlined style={{ cursor: 'pointer' }} />
                        <span style={{ fontSize: 13, cursor: 'pointer' }}>@</span>
                      </div>
                      <Button
                        type="primary"
                        shape="circle"
                        size="small"
                        icon={<SendOutlined style={{ fontSize: 12 }} />}
                        loading={isSendingRoomMsg}
                        disabled={!roomChatInput.trim()}
                        onClick={handleSendRoomMessage}
                        style={{
                          backgroundColor: roomChatInput.trim() ? '#1e1e24' : '#e2e8f0',
                          border: 'none',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Shift + Enter for a new line
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Centered card on office floor when videos are moved to Document Picture-in-Picture (Cosmos Image 2) */}
          {isDocPipOpen && (
            <div
              style={{
                position: 'absolute',
                top: '38%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: '36px 44px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                textAlign: 'center',
                zIndex: 35,
                border: '1px solid #e2e8f0',
                maxWidth: 420,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
                Videos moved to picture-in-picture
              </h2>
              <Button
                size="large"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '0 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#0f172a',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                }}
                onClick={closeDocumentPip}
              >
                Bring videos back here
              </Button>
            </div>
          )}

          {/* Document Picture-in-Picture Portal (When Popped Out) */}
          {isDocPipOpen && docPipContainer &&
            createPortal(
              <CosmosPipCard
                userName={user?.name || 'You'}
                userAvatarSeed={user?.name || user?.email || 'Cosmos'}
                isCameraOff={isCameraOff}
                isMuted={isMuted}
                isScreenSharing={isScreenSharing}
                isHandRaised={isHandRaised}
                videoStream={localVideoStreamRef.current}
                videoTrack={localVideoTrack}
                audioTrack={localAudioTrack}
                cameraStream={cameraStream}
                screenStream={screenStream}
                activeScreenTrack={activeScreenTrack}
                participants={activeCallParticipants}
                onToggleMute={toggleMicrophone}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}
                onToggleHand={() => setIsHandRaised((h) => !h)}
                onExpandToCall={() => {
                  closeDocumentPip();
                  setViewMode('call');
                }}
                onClose={closeDocumentPip}
                onPopOutPip={closeDocumentPip}
                isPoppedOut={true}
                onLeave={() => {
                  closeDocumentPip();
                  cleanupMedia();
                  navigate('/dashboard');
                }}
                spaceName={currentSpace}
              />,
              docPipContainer
            )
          }

          {/* Cosmos Proximity Call Section (Matching Cosmos Video Image 2): Multi-User Call Grid */}
          {viewMode === 'space' && !isDocPipOpen && isPipVisible && !isScreenSharing && shouldRenderCallSection && (
            <CosmosCallSection
              participants={activeCallParticipants}
              onToggleMyMic={toggleMicrophone}
              onToggleMyCam={toggleCamera}
            />
          )}

          {/* In-Map Screen Sharing Box: If screen sharing while PIP is closed, show PIP card */}
          {viewMode === 'space' && !isDocPipOpen && isPipVisible && isScreenSharing && (
            <CosmosPipCard
              userName={user?.name || 'You'}
              userAvatarSeed={user?.name || user?.email || 'Cosmos'}
              isCameraOff={isCameraOff}
              isMuted={isMuted}
              isScreenSharing={isScreenSharing}
              isHandRaised={isHandRaised}
              videoStream={localVideoStreamRef.current}
              videoTrack={localVideoTrack}
              audioTrack={localAudioTrack}
              cameraStream={cameraStream}
              screenStream={screenStream}
              activeScreenTrack={activeScreenTrack}
              participants={activeCallParticipants}
              onToggleMute={toggleMicrophone}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onToggleHand={() => setIsHandRaised((h) => !h)}
              onExpandToCall={() => setViewMode('call')}
              onClose={() => setIsPipVisible(false)}
              onPopOutPip={() => openDocumentPip()}
              isPoppedOut={false}
              onLeave={() => {
                cleanupMedia();
                navigate('/dashboard');
              }}
              spaceName={currentSpace}
            />
          )}
        </div>
      </div>

      {/* 3. BOTTOM CALL CONTROLS DOCK (Matching Cosmos Video Image 1) */}
      <footer
        style={{
          height: 64,
          backgroundColor: '#0c0d19',
          borderTop: '1px solid #1a2038',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 30,
        }}
      >
        {/* Left: Avatar, Unmute, Camera, Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* User Avatar Button (Matching Cosmos Video Images 3, 4, 8) */}
          <div
            onClick={() => setIsProfilePopoverOpen(!isProfilePopoverOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              minWidth: 46,
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {/* Avatar Circle with Online Badge */}
            <div style={{ position: 'relative', width: 28, height: 28 }}>
              <img
                src={getAvatarUrl(user)}
                alt=""
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  objectFit: 'cover',
                  border: isProfilePopoverOpen ? '2px solid #38bdf8' : '1.5px solid rgba(255,255,255,0.4)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    user?.status_mode === 'Away'
                      ? '#ef4444'
                      : user?.status_mode === 'Focus' || user?.status_mode === 'Listening'
                      ? '#f59e0b'
                      : '#22c55e',
                  border: '1.5px solid #0c0d19',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                marginTop: 2,
                letterSpacing: '0.01em',
                color: '#facc15', // Yellow text matching Image 4 & Image 8
                maxWidth: 54,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name?.split(' ')[0] || 'Charu'}
            </span>
          </div>

          {/* Unmute */}
          <div
            onClick={toggleMicrophone}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: isMuted ? '#ef4444' : '#f8fafc',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isMuted ? <MicSlashIcon size={20} /> : <AudioOutlined style={{ fontSize: 20 }} />}
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </div>

          {/* Camera */}
          <div
            onClick={toggleCamera}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: isCameraOff ? '#ef4444' : '#f8fafc',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {isCameraOff ? <CamSlashIcon size={20} /> : <VideoCameraOutlined style={{ fontSize: 20 }} />}
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Camera
            </span>
          </div>

          {/* Share */}
          <div
            onClick={toggleScreenShare}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isScreenSharing ? '#ffffff' : '#f8fafc',
              backgroundColor: isScreenSharing ? '#1e293b' : 'transparent',
              border: isScreenSharing ? '1.5px solid #3b82f6' : '1.5px solid transparent',
              borderRadius: 8,
              padding: isScreenSharing ? '4px 10px' : '4px 0',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <ScreenIcon size={20} color={isScreenSharing ? '#38bdf8' : '#f8fafc'} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                marginTop: 4,
                letterSpacing: '0.01em',
                color: isScreenSharing ? '#38bdf8' : '#f8fafc',
              }}
            >
              {isScreenSharing ? 'Stop Share' : 'Share'}
            </span>
          </div>
        </div>

        {/* Center: Invite, Hand, More */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Invite */}
          <div
            onClick={() => setIsInviteModalOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#f8fafc',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <UserAddOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Invite
            </span>
          </div>

          {/* Hand */}
          <div
            onClick={() => {
              setIsHandRaised(!isHandRaised);
              message.info(!isHandRaised ? 'Raised your hand ✋' : 'Lowered your hand');
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: isHandRaised ? '#f59e0b' : '#f8fafc',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <HandSvgIcon size={20} active={isHandRaised} />
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Hand
            </span>
          </div>

          {/* More */}
          <Dropdown
            menu={{
              items: [
                {
                  key: 'pip',
                  label: isPipVisible ? 'Hide Mini Video Card' : 'Show Mini Video Card',
                  onClick: () => setIsPipVisible((v) => !v),
                },
                { key: 'settings', label: 'Audio & Video Settings' },
                { key: 'background', label: 'Virtual Backgrounds' },
                { key: 'shortcuts', label: 'Keyboard Shortcuts (Space, M, C)' },
                { type: 'divider' },
                {
                  key: 'leave',
                  label: 'Leave Office Space',
                  danger: true,
                  onClick: () => navigate('/dashboard'),
                },
              ],
            }}
            placement="top"
            trigger={['click']}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#f8fafc',
                minWidth: 46,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <EllipsisOutlined style={{ fontSize: 22 }} />
              <span style={{ fontSize: 11, fontWeight: 500, marginTop: 2, letterSpacing: '0.01em' }}>
                More
              </span>
            </div>
          </Dropdown>
        </div>

        {/* Right: Chat, Apps, Set Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* Chat */}
          <div
            onClick={() => setIsChatOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: isChatOpen ? '#38bdf8' : '#94a3b8',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = isChatOpen ? '#38bdf8' : '#94a3b8')}
          >
            <MessageOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Chat
            </span>
          </div>

          {/* Captions */}
          <div
            onClick={() => message.info('Live captions')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <FileTextOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Captions
            </span>
          </div>

          {/* Apps */}
          <div
            onClick={() => message.info('Apps panel')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
              minWidth: 46,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <AppstoreOutlined style={{ fontSize: 20 }} />
            <span style={{ fontSize: 11, fontWeight: 500, marginTop: 4, letterSpacing: '0.01em' }}>
              Apps
            </span>
          </div>

          {/* Leave (Matching Cosmos Images 2 & 5) */}
          <Tooltip title="Exit Space">
            <div
              onClick={() => {
                cleanupMedia();
                message.info('Left the office space');
                navigate('/dashboard');
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#ef4444',
                minWidth: 46,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#ef4444')}
            >
              <LogoutOutlined style={{ fontSize: 20, color: '#ef4444' }} />
              <span style={{ fontSize: 11, fontWeight: 600, marginTop: 4, letterSpacing: '0.01em', color: '#ef4444' }}>
                Leave
              </span>
            </div>
          </Tooltip>
        </div>
      </footer>

      {/* Floating "Enable Notifications" Banner (Matching Cosmos Video Image 1) */}
      {showNotificationBanner && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 28,
            zIndex: 45,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e2e8f0',
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>
              Enable notifications to keep on top of messages in Cosmos.
            </span>
            <CloseOutlined
              onClick={() => {
                localStorage.setItem('cosmos_notif_banner_dismissed', 'true');
                setShowNotificationBanner(false);
              }}
              style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer', marginTop: 2 }}
            />
          </div>
          <div>
            <button
              onClick={handleEnableNotifications}
              style={{
                backgroundColor: '#1e1e24',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e1e24')}
            >
              Enable Notifications
            </button>
          </div>
        </div>
      )}

      {/* Direct Messages Drawer */}
      <DirectChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedContact={selectedContact}
      />

      {/* ========================================================
          COSMOS NAVIGATION MODALS (Images 2 & 4)
      ======================================================== */}

      {/* 1. User Preferences Modal */}
      <Modal
        title={<div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>User Preferences</div>}
        open={isUserPrefModalOpen}
        onCancel={() => setIsUserPrefModalOpen(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsUserPrefModalOpen(false)} style={{ backgroundColor: '#0f172a' }}>
            Save Preferences
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar size={48} src={getAvatarUrl(user)} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{user?.name || 'Cosmos User'}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
              <Tag color={isOwnerOrAdmin ? 'purple' : 'blue'} style={{ marginTop: 4, borderRadius: 4, fontWeight: 600 }}>
                Role: {userRoleInSpace}
              </Tag>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Default Camera Device
            </label>
            <Select
              defaultValue="default"
              style={{ width: '100%' }}
              options={[
                { value: 'default', label: 'FaceTime HD / Integrated Webcam (720p HD)' },
                { value: 'virtual', label: 'Cosmos Animated Virtual Camera' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Default Microphone Device
            </label>
            <Select
              defaultValue="default"
              style={{ width: '100%' }}
              options={[
                { value: 'default', label: 'Internal Microphone (Built-in Audio)' },
              ]}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Audio chimes when colleagues join desk</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Cosmos Invite People Modal (Matches Screenshot & Dual Invitation System) */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {inviteModalMode === 'office' ? 'Invite People' : 'Invite guests to rooms'}
          </div>
        }
        open={isInviteModalOpen}
        onCancel={() => {
          setIsInviteModalOpen(false);
          setInviteModalMode('office');
        }}
        footer={null}
        width={460}
        styles={{ body: { padding: '16px 4px 8px 4px' } }}
      >
        {inviteModalMode === 'office' ? (
          <div>
            {/* Enter names + Dark pill Invite button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Input
                placeholder="Enter names"
                value={inviteSearchName}
                onChange={(e) => setInviteSearchName(e.target.value)}
                onPressEnter={() => handleQuickInvite()}
                style={{
                  height: 40,
                  borderRadius: 8,
                  fontSize: 14,
                  borderColor: '#cbd5e1',
                }}
              />
              <Button
                type="primary"
                loading={inviteLoading}
                onClick={() => handleQuickInvite()}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 8,
                  height: 40,
                  padding: '0 20px',
                  border: 'none',
                }}
              >
                Invite
              </Button>
            </div>

            {/* Suggested / Recent colleagues list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, paddingLeft: 4 }}>
              {suggestedList.map((person, idx) => (
                <div
                  key={idx}
                  onClick={() => handleQuickInvite(person.name, person.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#334155',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 6,
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#0284c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, color: '#64748b' }}>•</span>
                  <span style={{ fontWeight: 500 }}>{person.name}</span>
                  {person.email && (
                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
                      ({person.email})
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Section: Invite link for call */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Invite link for call
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <Input
                  readOnly
                  value={`${window.location.origin}/invite/${spaceInfo?.invite_code || currentSpace}${startInGalleryView ? '?gallery=true' : ''}`}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#334155',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                  }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => {
                    const link = `${window.location.origin}/invite/${spaceInfo?.invite_code || currentSpace}${startInGalleryView ? '?gallery=true' : ''}`;
                    navigator.clipboard?.writeText(link);
                    message.success('Invite link copied!');
                  }}
                  style={{
                    height: 38,
                    borderRadius: 8,
                    borderColor: '#cbd5e1',
                  }}
                />
              </div>

              {/* Start call in gallery view checkbox */}
              <div style={{ marginBottom: 18 }}>
                <Checkbox
                  checked={startInGalleryView}
                  onChange={(e) => setStartInGalleryView(e.target.checked)}
                  style={{ fontSize: 13, color: '#475569' }}
                >
                  Start call in gallery view
                </Checkbox>
              </div>

              {/* Invite guests to rooms link */}
              <div>
                <span
                  onClick={() => setInviteModalMode('guest_room')}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#2563eb',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Invite guests to rooms
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* GUEST ROOM INVITATION VIEW */}
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
              Generate a temporary link for external guests to access a specific meeting room.
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Select Meeting Room
            </label>
            <Select
              value={selectedGuestRoom}
              onChange={(val) => setSelectedGuestRoom(val)}
              style={{ width: '100%', marginBottom: 16 }}
              options={[
                { value: 'cabin-1', label: 'Cabin 1 (Executive Cabin)' },
                { value: 'cabin-2', label: 'Cabin 2 (Meeting Cabin)' },
                { value: 'cabin-3', label: 'Cabin 3 (Private Cabin)' },
                { value: 'cabin-4', label: 'Cabin 4 (Private Cabin)' },
                { value: 'cabin-5', label: 'Cabin 5 (Private Cabin)' },
                { value: 'war-room', label: 'War Room (Strategy & Live Ops)' },
                { value: 'reception', label: 'Reception Area' },
              ]}
            />

            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Guest room invite link
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input
                readOnly
                value={`${window.location.origin}/invite/guest/${spaceInfo?.invite_code || currentSpace}?room=${selectedGuestRoom}`}
                style={{
                  height: 38,
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#334155',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  const guestLink = `${window.location.origin}/invite/guest/${spaceInfo?.invite_code || currentSpace}?room=${selectedGuestRoom}`;
                  navigator.clipboard?.writeText(guestLink);
                  message.success('Guest room invite link copied!');
                }}
                style={{
                  height: 38,
                  borderRadius: 8,
                  borderColor: '#cbd5e1',
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: '#64748b',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              🔒 Guests who use this link will only have access to <strong>{OFFICE_ZONES.find((z) => z.id === selectedGuestRoom)?.name || selectedGuestRoom}</strong>. They will not become permanent members of the office.
            </div>

            <div>
              <span
                onClick={() => setInviteModalMode('office')}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                ← Back to Office Invitation
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Office Hours Modal */}
      <Modal
        title={<div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Office Working Hours</div>}
        open={isOfficeHoursModalOpen}
        onCancel={() => setIsOfficeHoursModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsOfficeHoursModalOpen(false)} style={{ backgroundColor: '#0f172a' }}>
            Done
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <ClockCircleOutlined style={{ fontSize: 24, color: '#6366f1' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Standard Working Hours</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Monday – Friday · 9:00 AM – 6:00 PM (Local Time)</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 13, color: '#475569' }}>
            During office hours, teammates receive audio notifications when colleagues sit near them or start calls.
          </div>
        </div>
      </Modal>

      {/* 6. Space Settings Modal (Admin Only) */}
      <Modal
        title={<div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Space Settings</div>}
        open={isSpaceSettingsModalOpen}
        onCancel={() => setIsSpaceSettingsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsSpaceSettingsModalOpen(false)}>Close</Button>,
          <Button key="manage" type="primary" onClick={() => { setIsSpaceSettingsModalOpen(false); navigate(`/o/${currentSpace}/admin/manage-members`); }} style={{ backgroundColor: '#0f172a' }}>
            Manage Members & Organization ↗
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Space Name
            </label>
            <Input readOnly value={spaceInfo?.name || currentSpace} style={{ borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Space URL Slug
            </label>
            <Input readOnly value={`/v/${currentSpace}/office`} style={{ borderRadius: 6 }} />
          </div>
        </div>
      </Modal>

      {/* 7. Analytics & Insights Modal (Admin Only) */}
      <Modal
        title={<div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Space Analytics & Insights</div>}
        open={isAnalyticsModalOpen}
        onCancel={() => setIsAnalyticsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsAnalyticsModalOpen(false)} style={{ backgroundColor: '#0f172a' }}>
            Close
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Active Teammates Today</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                {presences.length + 1}
              </div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Proximity Call Hours</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                3.2 hrs
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            Space engagement is active and all office floor plan zones are operating normally.
          </div>
        </div>
      </Modal>

      {/* Admin Floating Prompt for Pending Guest Access Requests */}
      {isAdminOrOwner && pendingGuestRequests.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 500,
            maxWidth: '92vw',
            backgroundColor: '#0f172a',
            border: '2px solid #3b82f6',
            borderRadius: 16,
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(59, 130, 246, 0.4)',
            padding: '16px 20px',
            color: '#ffffff',
            fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
          }}
        >
          {pendingGuestRequests.map((req) => (
            <div key={req.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🔔</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                    Guest Access Request
                  </span>
                </div>
                <Tag color="gold" style={{ borderRadius: 6, fontWeight: 600 }}>
                  Awaiting Decision
                </Tag>
              </div>

              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 14 }}>
                <strong style={{ color: '#ffffff' }}>{req.guest_name}</strong> is asking permission to move to{' '}
                <strong style={{ color: '#38bdf8' }}>{req.requested_room_name}</strong>.
              </div>

              {/* 3 Action Buttons:
                  1. Approve This Room: allows that specific room
                  2. Reject: declines entry, guest stays restricted
                  3. Approve All: gives full office access anywhere */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                  danger
                  onClick={() => handleAdminRespond(req.id, 'reject')}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 36,
                  }}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleAdminRespond(req.id, 'approve_room')}
                  style={{
                    backgroundColor: '#16a34a',
                    borderColor: '#16a34a',
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 36,
                  }}
                >
                  Approve This Room
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleAdminRespond(req.id, 'approve_all')}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    borderColor: 'transparent',
                    borderRadius: 8,
                    fontWeight: 700,
                    height: 36,
                  }}
                >
                  Approve All (Full Space)
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guest Permission Request Modal */}
      <Modal
        open={isGuestRequestModalOpen}
        footer={null}
        onCancel={() => {
          setIsGuestRequestModalOpen(false);
        }}
        width={440}
        centered
        closable={guestRequestStatus !== 'approved_room' && guestRequestStatus !== 'approved_all'}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '14px 8px', fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` }}>
          {guestRequestStatus === 'pending' && (
            <>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  fontSize: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                🔒
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Permission Required
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 18 }}>
                Your guest invite is restricted to your designated meeting room. A permission request has been sent to the <strong>Space Admin / Primary Owner</strong> to enter <strong>{requestedZone?.name}</strong>.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#2563eb',
                  marginBottom: 20,
                }}
              >
                <Spin size="small" />
                Waiting for Admin approval...
              </div>
              <div>
                <Button
                  onClick={() => setIsGuestRequestModalOpen(false)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Stay in Current Room
                </Button>
              </div>
            </>
          )}

          {guestRequestStatus === 'approved_room' && (
            <>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Permission Granted!
              </h3>
              <p style={{ fontSize: 14, color: '#16a34a', fontWeight: 600, marginBottom: 10 }}>
                Admin approved access to {requestedZone?.name}.
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Moving your avatar into the room...
              </p>
            </>
          )}

          {guestRequestStatus === 'approved_all' && (
            <>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#ede9fe',
                  color: '#7c3aed',
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                ⭐
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Full Office Access Granted!
              </h3>
              <p style={{ fontSize: 14, color: '#7c3aed', fontWeight: 600, marginBottom: 10 }}>
                The Admin has granted you full access to all cabins and rooms in this space.
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                You can now move anywhere freely!
              </p>
            </>
          )}

          {guestRequestStatus === 'rejected' && (
            <>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                ✕
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Access Request Declined
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
                The Space Admin declined access to <strong>{requestedZone?.name}</strong>. You must remain in your permitted meeting room.
              </p>
              <Button
                type="primary"
                onClick={() => setIsGuestRequestModalOpen(false)}
                style={{ borderRadius: 8, fontWeight: 600, backgroundColor: '#0f172a' }}
              >
                Back to My Room
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Cosmos User Profile & Status Popover / Modals (Matching Cosmos Images 3, 4, 5, 6, 7, 8) */}
      <CosmosProfileStatusModal
        user={user}
        currentSpace={currentSpace}
        onUpdateUser={updateUser}
        isPopoverOpen={isProfilePopoverOpen}
        onClosePopover={() => setIsProfilePopoverOpen(false)}
        onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
        isEditProfileOpen={isEditProfileModalOpen}
        onCloseEditProfile={() => setIsEditProfileModalOpen(false)}
        onOpenCustomStatus={() => setIsCustomStatusModalOpen(true)}
        isCustomStatusOpen={isCustomStatusModalOpen}
        onCloseCustomStatus={() => setIsCustomStatusModalOpen(false)}
      />
    </div>
  );
};

export default OfficeSpace;
