import React, { useRef, useEffect } from 'react';
import { Tooltip } from 'antd';
import type { Track, VideoTrack } from 'livekit-client';
import { getAvatarUrl } from './CosmosProfileStatusModal';

export interface CallParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  isCameraOn: boolean;
  isMuted: boolean;
  isAway?: boolean;
  customStatus?: string;
  videoStream?: MediaStream | null;
  videoTrack?: Track | VideoTrack | MediaStreamTrack | null;
  audioTrack?: Track | MediaStreamTrack | null;
  statusDotColor?: string;
  bgColor?: string;
  avatarSeed?: string;
}

interface CosmosCallSectionProps {
  participants: CallParticipant[];
  onToggleMyMic?: () => void;
  onToggleMyCam?: () => void;
  onLeaveCall?: () => void;
}

// Modern Empty Office Chair Component for Away / Unavailable teammates (Exact Match to Image 4: media_1795169451902_b0aaf140.jpg)
export const EmptyOfficeChairView: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 64%, #1d4ed8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Room Floor Perspective Plane */}
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '38%',
        background: 'linear-gradient(180deg, #2563eb 0%, #1e40af 100%)',
        borderTop: '1px solid rgba(255,255,255,0.18)',
      }}
    />

    {/* Modern Ergonomic Armchair (Matching Image 4) */}
    <svg
      width="104"
      height="120"
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        zIndex: 2,
        marginBottom: 16,
        filter: 'drop-shadow(0 14px 22px rgba(15, 23, 42, 0.45))',
      }}
    >
      {/* Backrest Cushion */}
      <rect x="28" y="16" width="64" height="66" rx="14" fill="#94a3b8" />
      <rect x="32" y="20" width="56" height="58" rx="10" fill="#64748b" />
      <rect x="36" y="24" width="48" height="50" rx="8" fill="#718096" />
      <path d="M42 48 Q60 52 78 48" stroke="#4a5568" strokeWidth="2.5" strokeLinecap="round" />

      {/* Seat Cushion */}
      <rect x="20" y="72" width="80" height="26" rx="8" fill="#94a3b8" />
      <rect x="24" y="74" width="72" height="20" rx="6" fill="#cbd5e1" />

      {/* Left Armrest */}
      <path d="M14 44 C14 38 22 38 22 44 L22 76 C22 80 14 80 14 76 Z" fill="#e2e8f0" />
      <rect x="13" y="42" width="10" height="34" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

      {/* Right Armrest */}
      <path d="M98 44 C98 38 106 38 106 44 L106 76 C106 80 98 80 98 76 Z" fill="#e2e8f0" />
      <rect x="97" y="42" width="10" height="34" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

      {/* Chair Pedestal Stem */}
      <rect x="56" y="98" width="8" height="18" rx="2" fill="#334155" />

      {/* 5-Star Wheel Base with Shadow */}
      <ellipse cx="60" cy="120" rx="36" ry="7" fill="#0f172a" opacity="0.4" />
      <path d="M60 114 L28 122 M60 114 L92 122 M60 114 L40 126 M60 114 L80 126 M60 114 L60 128" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="28" cy="122" r="3.5" fill="#0f172a" />
      <circle cx="92" cy="122" r="3.5" fill="#0f172a" />
      <circle cx="40" cy="126" r="3.5" fill="#0f172a" />
      <circle cx="80" cy="126" r="3.5" fill="#0f172a" />
      <circle cx="60" cy="128" r="3.5" fill="#0f172a" />
    </svg>
  </div>
);

// Crisp SVGs for mic & camera slash matching Cosmos Video
const MicSlashSvg = ({ size = 13, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicActiveSvg = ({ size = 13, color = '#22c55e' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const CamSlashSvg = ({ size = 13, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
  </svg>
);

const CamActiveSvg = ({ size = 13, color = '#22c55e' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

// Individual Participant Video/Avatar Box matching Image 2
const ParticipantCard: React.FC<{
  participant: CallParticipant;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
}> = ({ participant, onToggleMic, onToggleCam }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play audio for remote participants when unmuted
  useEffect(() => {
    if (participant.isLocal) return;
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (participant.audioTrack && 'attach' in participant.audioTrack && typeof (participant.audioTrack as any).attach === 'function') {
      try {
        (participant.audioTrack as any).attach(audioEl);
        audioEl.play().catch(() => {});
      } catch {}
      return () => {
        try {
          (participant.audioTrack as any).detach(audioEl);
        } catch {}
      };
    } else if (participant.audioTrack && 'kind' in (participant.audioTrack as any)) {
      try {
        audioEl.srcObject = new MediaStream([participant.audioTrack as MediaStreamTrack]);
        audioEl.play().catch(() => {});
      } catch {}
      return () => {
        audioEl.srcObject = null;
      };
    }
  }, [participant.audioTrack, participant.isLocal]);

  // Attach and play video track/stream when camera is ON
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !participant.isCameraOn) {
      if (videoEl) videoEl.srcObject = null;
      return;
    }

    // Videos in cards are ALWAYS muted to satisfy browser autoplay requirements
    // Remote audio is played via audio element
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.playsInline = true;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('autoplay', '');

    if (participant.videoTrack && 'attach' in participant.videoTrack && typeof (participant.videoTrack as any).attach === 'function') {
      try {
        (participant.videoTrack as any).attach(videoEl);
        videoEl.play().catch(() => {});
      } catch (err) {
        console.warn('Track attach warning:', err);
      }
    } else if (participant.videoTrack && 'kind' in (participant.videoTrack as any)) {
      try {
        videoEl.srcObject = new MediaStream([participant.videoTrack as MediaStreamTrack]);
        videoEl.play().catch(() => {});
      } catch {}
    } else if (participant.videoStream) {
      videoEl.srcObject = participant.videoStream;
      videoEl.play().catch(() => {});
    }

    const ensurePlaying = () => {
      if (videoEl && videoEl.paused) {
        videoEl.play().catch(() => {});
      }
    };

    videoEl.addEventListener('loadedmetadata', ensurePlaying);
    videoEl.addEventListener('loadeddata', ensurePlaying);
    videoEl.addEventListener('canplay', ensurePlaying);
    videoEl.addEventListener('pause', ensurePlaying);

    const playInterval = setInterval(ensurePlaying, 500);

    return () => {
      clearInterval(playInterval);
      videoEl.removeEventListener('loadedmetadata', ensurePlaying);
      videoEl.removeEventListener('loadeddata', ensurePlaying);
      videoEl.removeEventListener('canplay', ensurePlaying);
      videoEl.removeEventListener('pause', ensurePlaying);
      if (participant.videoTrack && 'detach' in participant.videoTrack && typeof (participant.videoTrack as any).detach === 'function') {
        try {
          (participant.videoTrack as any).detach(videoEl);
        } catch {}
      }
      videoEl.srcObject = null;
    };
  }, [participant.isCameraOn, participant.videoStream, participant.videoTrack, participant.isLocal]);

  const fallbackBg = participant.bgColor || (participant.isLocal ? '#ec4899' : '#3b82f6');
  const avatarSeed = participant.avatarSeed || participant.name || 'Cosmos';

  // Render video whenever camera is on, not away, and actual media is present
  const hasMedia = Boolean(participant.videoStream || participant.videoTrack);
  const showVideo = !participant.isAway && participant.isCameraOn && hasMedia;

  return (
    <div
      style={{
        width: 172,
        height: 196,
        borderRadius: 16,
        backgroundColor: participant.isAway ? 'transparent' : showVideo ? '#000000' : fallbackBg,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        border: participant.isLocal ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid transparent',
      }}
    >
      {/* Remote Audio Player */}
      {!participant.isLocal && !participant.isAway && <audio ref={audioRef} autoPlay playsInline />}

      {/* Top Left Floating Custom Status Bubble (Matching Image 4: media_1795169451902_b0aaf140.jpg) */}
      {participant.customStatus && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 4,
            maxWidth: 130,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            border: '0.5px solid rgba(255,255,255,0.15)',
          }}
        >
          <span>💬</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {participant.customStatus}
          </span>
        </div>
      )}

      {/* Case 1: Participant is Away -> Modern Empty Office Chair (Image 4 Match) */}
      {participant.isAway ? (
        <EmptyOfficeChairView />
      ) : showVideo ? (
        /* Case 2: Active Video Feed */
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000000',
          }}
        />
      ) : (
        /* Case 3: Camera OFF or Video Loading -> 3D Avatar Character matching Cosmos Image 2 */
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            paddingBottom: 24,
          }}
        >
          <img
            src={getAvatarUrl({ name: participant.name, avatar_seed: avatarSeed } as any)}
            alt={participant.name}
            style={{
              width: 128,
              height: 128,
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.22))',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* Bottom Overlay: Mic Badge + Cam Badge + Name Pill + Status Dot (Exact Match to Image 2 & Image 4) */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 3,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Mic Status Circle */}
          <Tooltip title={participant.isAway ? 'Away (Muted)' : participant.isLocal ? (participant.isMuted ? 'Click to Unmute' : 'Click to Mute') : (participant.isMuted ? 'Muted' : 'Unmuted')}>
            <div
              onClick={!participant.isAway && participant.isLocal ? onToggleMic : undefined}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: participant.isAway || participant.isMuted ? '#ef4444' : 'rgba(15, 23, 42, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: !participant.isAway && participant.isLocal ? 'pointer' : 'default',
                backdropFilter: 'blur(4px)',
                transition: 'transform 0.15s ease',
              }}
            >
              {participant.isAway || participant.isMuted ? <MicSlashSvg size={12} color="#ffffff" /> : <MicActiveSvg size={12} color="#22c55e" />}
            </div>
          </Tooltip>

          {/* Cam Status Circle */}
          <Tooltip title={participant.isAway ? 'Away (Camera Off)' : participant.isLocal ? (participant.isCameraOn ? 'Turn off camera' : 'Turn on camera') : (participant.isCameraOn ? 'Camera on' : 'Camera off')}>
            <div
              onClick={!participant.isAway && participant.isLocal ? onToggleCam : undefined}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: participant.isAway || !participant.isCameraOn ? '#ef4444' : 'rgba(15, 23, 42, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                cursor: !participant.isAway && participant.isLocal ? 'pointer' : 'default',
                backdropFilter: 'blur(4px)',
                transition: 'transform 0.15s ease',
              }}
            >
              {participant.isAway || !participant.isCameraOn ? <CamSlashSvg size={12} color="#ffffff" /> : <CamActiveSvg size={12} color="#22c55e" />}
            </div>
          </Tooltip>

          {/* Translucent Name Pill */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              maxWidth: 94,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.2px',
              border: '0.5px solid rgba(255,255,255,0.12)',
            }}
          >
            {participant.name}
          </div>
        </div>

        {/* Right Status Dot: Red for Away (#ef4444), Amber/Green otherwise */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: participant.isAway ? '#ef4444' : (participant.statusDotColor || '#22c55e'),
            border: '1.5px solid #ffffff',
            boxShadow: '0 0 6px rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
};

export const CosmosCallSection: React.FC<CosmosCallSectionProps> = ({
  participants,
  onToggleMyMic,
  onToggleMyCam,
}) => {
  if (!participants || participants.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 25,
        padding: '6px',
        borderRadius: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.25)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22)',
        maxWidth: '92vw',
        overflowX: 'auto',
      }}
    >
      {participants.map((p) => (
        <ParticipantCard
          key={p.id}
          participant={p}
          onToggleMic={p.isLocal ? onToggleMyMic : undefined}
          onToggleCam={p.isLocal ? onToggleMyCam : undefined}
        />
      ))}
    </div>
  );
};

export default CosmosCallSection;

