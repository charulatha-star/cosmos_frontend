import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import {
  AudioOutlined,
  VideoCameraOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownOutlined,
  UpOutlined,
  CloseOutlined,
  DesktopOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { VideoTrack, AudioTrack, Track } from 'livekit-client';
import { getAvatarUrl } from './CosmosProfileStatusModal';
import type { CallParticipant } from './CosmosCallSection';

interface CosmosPipCardProps {
  userName: string;
  userAvatarSeed: string;
  isCameraOff: boolean;
  isMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  cameraStream?: MediaStream | null;
  screenStream?: MediaStream | null;
  activeScreenTrack?: Track | VideoTrack | MediaStreamTrack | MediaStream | null;
  videoStream?: MediaStream | null;
  videoTrack?: VideoTrack | MediaStreamTrack | null;
  audioTrack?: AudioTrack | MediaStreamTrack | null;
  participants?: CallParticipant[];
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onExpandToCall?: () => void;
  onClose?: () => void;
  onPopOutPip?: () => void;
  isPoppedOut?: boolean;
  onLeave?: () => void;
  spaceName?: string;
}

const MicSlashSvg = ({ size = 15, color = '#ef4444' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const CamSlashSvg = ({ size = 15, color = '#ef4444' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
  </svg>
);

const ScreenSvg = ({ size = 15, color = '#f8fafc' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const HandSvg = ({ size = 15, active }: { size?: number; active?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={active ? '#f59e0b' : 'none'}
    stroke={active ? '#f59e0b' : '#f8fafc'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M6 14v-2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2" />
  </svg>
);

// Corner Participant Avatar / Video Tile (matching Cosmos corner people view)
const ParticipantCornerTile: React.FC<{
  participant: CallParticipant;
  localCameraStream?: MediaStream | null;
  localCameraTrack?: VideoTrack | MediaStreamTrack | null;
  isFullScreen: boolean;
}> = ({ participant, localCameraStream, localCameraTrack, isFullScreen }) => {
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = vidRef.current;
    if (!el || !participant.isCameraOn) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;

    const track = participant.isLocal ? localCameraTrack : participant.videoTrack;
    const stream = participant.isLocal ? localCameraStream : participant.videoStream;

    if (track && typeof (track as any).attach === 'function') {
      try {
        (track as any).attach(el);
      } catch {}
      return () => {
        try {
          (track as any).detach(el);
        } catch {}
        el.srcObject = null;
      };
    } else if (stream instanceof MediaStream) {
      el.srcObject = stream;
      el.play().catch(() => {});
      return () => {
        el.srcObject = null;
      };
    }
  }, [participant.isCameraOn, participant.isLocal, participant.videoStream, participant.videoTrack, localCameraStream, localCameraTrack]);

  const showVideo = participant.isCameraOn && !participant.isAway && (
    participant.isLocal
      ? Boolean(localCameraStream || localCameraTrack)
      : Boolean(participant.videoStream || participant.videoTrack)
  );

  return (
    <div
      style={{
        width: isFullScreen ? 120 : 84,
        height: isFullScreen ? 96 : 64,
        borderRadius: 10,
        backgroundColor: '#111526',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
      }}
    >
      {showVideo ? (
        <video
          ref={vidRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <img
          src={getAvatarUrl({ name: participant.name, avatar_seed: participant.avatarSeed } as any)}
          alt={participant.name}
          style={{
            width: isFullScreen ? 54 : 38,
            height: isFullScreen ? 54 : 38,
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: '#f8fafc',
            border: '2px solid #ffffff',
            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Name and Mic Indicator Pill */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          bottom: 4,
          right: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          borderRadius: 4,
          padding: '2px 5px',
          backdropFilter: 'blur(4px)',
        }}
      >
        <span
          style={{
            fontSize: isFullScreen ? 11 : 9,
            fontWeight: 700,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isFullScreen ? 75 : 48,
          }}
        >
          {participant.name}
        </span>
        {participant.isMuted ? (
          <MicSlashSvg size={isFullScreen ? 11 : 9} color="#ef4444" />
        ) : (
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
        )}
      </div>
    </div>
  );
};

export const CosmosPipCard: React.FC<CosmosPipCardProps> = ({
  userName,
  userAvatarSeed,
  isCameraOff,
  isMuted,
  isScreenSharing,
  isHandRaised,
  cameraStream,
  screenStream,
  activeScreenTrack,
  videoStream,
  videoTrack,
  participants,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleHand,
  onExpandToCall,
  onClose,
  onPopOutPip,
  isPoppedOut = false,
  onLeave,
  spaceName = 'cosmos.video',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showSelfPreview, setShowSelfPreview] = useState<boolean>(false);

  // Fallback participants list if none provided
  const defaultParticipants: CallParticipant[] = [
    {
      id: 'local',
      name: userName || 'You',
      isLocal: true,
      isCameraOn: !isCameraOff,
      isMuted,
      avatarSeed: userAvatarSeed,
      videoStream: cameraStream || videoStream,
      videoTrack,
    },
  ];
  const effectiveParticipants = (participants && participants.length > 0) ? participants : defaultParticipants;

  // Real OS/Browser Full Screen (Google Meet style)
  const toggleFullScreen = async () => {
    const el = containerRef.current || document.documentElement;
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullScreen(false);
      }
    } catch {
      setIsFullScreen((prev) => !prev);
    }
  };

  // Sync state when native full screen changes (Esc key, F11, or browser exit)
  useEffect(() => {
    const handleFsChange = () => {
      const active = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullScreen(active);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Keyboard shortcut: Press Escape to exit full screen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Reset self preview when screen sharing stops
  useEffect(() => {
    if (!isScreenSharing) {
      setShowSelfPreview(false);
    }
  }, [isScreenSharing]);

  // Attach and play video track/stream for screen share OR camera
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Explicitly configure DOM attributes to guarantee autoplay on Chrome/Edge
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.playsInline = true;
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('autoplay', '');

    // Case 1: Screen Sharing is active -> Screen stream takes priority
    if (isScreenSharing && (screenStream || activeScreenTrack)) {
      if (activeScreenTrack && 'attach' in activeScreenTrack && typeof (activeScreenTrack as any).attach === 'function') {
        try {
          (activeScreenTrack as any).attach(videoEl);
          videoEl.play().catch(() => {});
        } catch (e) {
          console.warn('Track.attach error:', e);
        }
        return () => {
          try {
            (activeScreenTrack as any).detach(videoEl);
          } catch {}
          videoEl.srcObject = null;
        };
      } else {
        const stream =
          (screenStream instanceof MediaStream ? screenStream : null) ||
          (activeScreenTrack instanceof MediaStream ? activeScreenTrack : null) ||
          (activeScreenTrack instanceof MediaStreamTrack ? new MediaStream([activeScreenTrack]) : null) ||
          (activeScreenTrack && (activeScreenTrack as any).mediaStreamTrack ? new MediaStream([(activeScreenTrack as any).mediaStreamTrack]) : null);

        if (stream) {
          videoEl.srcObject = stream;
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Screen share autoplay caught:', err);
            });
          }

          const handleLoaded = () => {
            videoEl.play().catch(() => {});
          };
          videoEl.addEventListener('loadedmetadata', handleLoaded);

          return () => {
            videoEl.removeEventListener('loadedmetadata', handleLoaded);
            videoEl.srcObject = null;
          };
        }
      }
    }

    // Case 2: Camera is ON and Screen Sharing is inactive
    if (!isCameraOff && (cameraStream || videoStream || videoTrack)) {
      if (videoTrack && 'attach' in videoTrack && typeof (videoTrack as any).attach === 'function') {
        (videoTrack as any).attach(videoEl);
        return () => {
          (videoTrack as any).detach(videoEl);
        };
      } else {
        const stream =
          (cameraStream instanceof MediaStream ? cameraStream : null) ||
          (videoStream instanceof MediaStream ? videoStream : null) ||
          (videoTrack instanceof MediaStreamTrack ? new MediaStream([videoTrack]) : null) ||
          (videoTrack && (videoTrack as any).mediaStreamTrack ? new MediaStream([(videoTrack as any).mediaStreamTrack]) : null);

        if (stream) {
          videoEl.srcObject = stream;
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn('Camera autoplay caught:', err);
            });
          }

          const handleLoaded = () => {
            videoEl.play().catch(() => {});
          };
          videoEl.addEventListener('loadedmetadata', handleLoaded);

          return () => {
            videoEl.removeEventListener('loadedmetadata', handleLoaded);
            videoEl.srcObject = null;
          };
        }
      }
    }

    // Case 3: Both screen sharing and camera are off
    videoEl.srcObject = null;
  }, [isScreenSharing, screenStream, activeScreenTrack, isCameraOff, cameraStream, videoStream, videoTrack, showSelfPreview]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: isFullScreen ? 'fixed' : isPoppedOut ? 'relative' : 'absolute',
        top: isFullScreen ? 0 : 'auto',
        left: isFullScreen ? 0 : 'auto',
        right: isFullScreen ? 0 : isPoppedOut ? 'auto' : 24,
        bottom: isFullScreen ? 0 : isPoppedOut ? 'auto' : 24,
        width: isFullScreen ? '100vw' : isPoppedOut ? '100%' : (isScreenSharing ? 460 : 320),
        height: isFullScreen ? '100vh' : isPoppedOut ? '100%' : 'auto',
        backgroundColor: '#0c0d19',
        border: isFullScreen || isPoppedOut ? 'none' : '1.5px solid #22293e',
        borderRadius: isFullScreen || isPoppedOut ? 0 : 14,
        boxShadow: isFullScreen || isPoppedOut ? 'none' : '0 16px 40px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        zIndex: isFullScreen ? 9999 : 40,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Header Bar: space name + audio waves + popout + fullscreen + minimize + close */}
      <div
        style={{
          height: 34,
          backgroundColor: '#111526',
          borderBottom: '1px solid #1e2438',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
          <span style={{ fontSize: 13 }}>{isScreenSharing ? '🖥️' : '📺'}</span>
          <span style={{ color: '#e2e8f0', letterSpacing: '0.02em' }}>
            {spaceName} {isScreenSharing ? '• Sharing' : ''}
          </span>
          {isFullScreen && (
            <span style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
              [FULL SCREEN VIEW]
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Speaking Audio Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 12 }}>
            <div
              style={{
                width: 2,
                height: isMuted ? 4 : 10,
                backgroundColor: isMuted ? '#64748b' : '#10b981',
                borderRadius: 1,
                transition: 'height 0.2s ease',
              }}
            />
            <div
              style={{
                width: 2,
                height: isMuted ? 6 : 14,
                backgroundColor: isMuted ? '#64748b' : '#10b981',
                borderRadius: 1,
                transition: 'height 0.2s ease',
              }}
            />
            <div
              style={{
                width: 2,
                height: isMuted ? 4 : 8,
                backgroundColor: isMuted ? '#64748b' : '#10b981',
                borderRadius: 1,
                transition: 'height 0.2s ease',
              }}
            />
          </div>

          {/* Picture-in-Picture Pop-out button (floats outside browser across all apps) */}
          {onPopOutPip && !isFullScreen && (
            <Tooltip title={isPoppedOut ? 'Bring back into browser' : 'Float on top of all windows (Picture-in-Picture)'}>
              <div
                onClick={onPopOutPip}
                style={{
                  cursor: 'pointer',
                  color: isPoppedOut ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isPoppedOut ? '#38bdf8' : '#94a3b8')}
              >
                <DesktopOutlined style={{ fontSize: 12 }} />
              </div>
            </Tooltip>
          )}

          {/* Full Screen View Toggle (Marked by user arrow in Image 4!) */}
          <Tooltip title={isFullScreen ? 'Exit Full Screen (Esc)' : 'Whole Screen Full View'}>
            <div
              onClick={toggleFullScreen}
              style={{
                cursor: 'pointer',
                color: isFullScreen ? '#38bdf8' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isFullScreen ? '#38bdf8' : '#94a3b8')}
            >
              {isFullScreen ? (
                <FullscreenExitOutlined style={{ fontSize: 13 }} />
              ) : (
                <FullscreenOutlined style={{ fontSize: 13 }} />
              )}
            </div>
          </Tooltip>

          {/* Minimize / Expand Toggle */}
          {!isPoppedOut && !isFullScreen && (
            <div
              onClick={() => setIsMinimized(!isMinimized)}
              style={{
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: 4,
              }}
            >
              {isMinimized ? <UpOutlined style={{ fontSize: 11 }} /> : <DownOutlined style={{ fontSize: 11 }} />}
            </div>
          )}

          {/* Close Button */}
          {onClose && (
            <div
              onClick={onClose}
              style={{
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: 4,
              }}
            >
              <CloseOutlined style={{ fontSize: 11 }} />
            </div>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 2. Video / 3D Avatar Stage */}
          <div
            style={{
              width: '100%',
              height: isFullScreen ? 'calc(100vh - 84px)' : isPoppedOut ? 'calc(100% - 76px)' : 240,
              minHeight: isFullScreen ? 'calc(100vh - 84px)' : 180,
              backgroundColor: '#000000',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* FULL VIEW OF SCREEN SHARE (Google Meet Style) */}
            {isScreenSharing ? (
              <>
                {!showSelfPreview ? (
                  /* Google Meet Presenter State: Clean card preventing dizzying infinite mirror loop */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#0a0d17',
                      color: '#ffffff',
                      textAlign: 'center',
                      padding: 24,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: isFullScreen ? 80 : 56,
                        height: isFullScreen ? 80 : 56,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1.5px solid rgba(56, 189, 248, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isFullScreen ? 36 : 24,
                        marginBottom: isFullScreen ? 18 : 10,
                        boxShadow: '0 0 24px rgba(56, 189, 248, 0.15)',
                      }}
                    >
                      🖥️
                    </div>

                    <h2
                      style={{
                        fontSize: isFullScreen ? 24 : 16,
                        fontWeight: 700,
                        margin: '0 0 6px',
                        color: '#f8fafc',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      You're presenting to everyone
                    </h2>

                    <p
                      style={{
                        fontSize: isFullScreen ? 14 : 11,
                        color: '#94a3b8',
                        maxWidth: 480,
                        lineHeight: 1.5,
                        margin: isFullScreen ? '0 0 20px' : '0 0 12px',
                      }}
                    >
                      Your screen is being shared to everyone in the room. Switch to another tab or application to present your work.
                    </p>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        onClick={onToggleScreenShare}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: isFullScreen ? '10px 22px' : '6px 14px',
                          fontSize: isFullScreen ? 13 : 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                      >
                        Stop presenting
                      </button>

                      <button
                        onClick={() => setShowSelfPreview(true)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#cbd5e1',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: 8,
                          padding: isFullScreen ? '10px 18px' : '6px 12px',
                          fontSize: isFullScreen ? 13 : 11,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.color = '#cbd5e1';
                        }}
                      >
                        View presentation feed
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: isFullScreen ? 24 : 12,
                        fontSize: isFullScreen ? 12 : 10,
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        maxWidth: 480,
                        justifyContent: 'center',
                      }}
                    >
                      <span>💡</span>
                      <span>To avoid the infinite tunnel mirror, choose a specific <strong>Chrome tab</strong> or <strong>Application window</strong> when sharing.</span>
                    </div>
                  </div>
                ) : (
                  /* Active video mirror when user clicks 'View presentation feed' */
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000000',
                      }}
                    />

                    <button
                      onClick={() => setShowSelfPreview(false)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(15, 23, 42, 0.88)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        zIndex: 6,
                        fontWeight: 600,
                      }}
                    >
                      Hide presentation feed
                    </button>
                  </>
                )}

                {/* Top-Left Screenshare Badge */}
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 12,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    color: '#38bdf8',
                    fontSize: isFullScreen ? 12 : 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 5,
                  }}
                >
                  <span style={{ fontSize: 13 }}>🖥️</span>
                  <span>{`${userName}'s Screen`}</span>
                  {isFullScreen && (
                    <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500, marginLeft: 6 }}>
                      (Press Esc to exit full view)
                    </span>
                  )}
                </div>

                {/* LAST CORNER: Show People Avatar / Face Tile (Matching User Requirement) */}
                <div
                  style={{
                    position: 'absolute',
                    right: isFullScreen ? 24 : 10,
                    bottom: isFullScreen ? 24 : 10,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-end',
                    zIndex: 10,
                    pointerEvents: 'auto',
                  }}
                >
                  {effectiveParticipants.map((p) => (
                    <ParticipantCornerTile
                      key={p.id}
                      participant={p}
                      localCameraStream={cameraStream}
                      localCameraTrack={videoTrack}
                      isFullScreen={isFullScreen}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* Camera ON or 3D Avatar Character when not screen sharing */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#000000',
                    display: !isCameraOff ? 'block' : 'none',
                  }}
                />

                {isCameraOff && (
                  <img
                    src={getAvatarUrl({ name: userName, avatar_seed: userAvatarSeed } as any)}
                    alt="Avatar Character"
                    style={{
                      width: 130,
                      height: 130,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.3))',
                    }}
                  />
                )}

                {/* Stage Bottom-Left Overlay: Mic status + Cam status + Name */}
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    bottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {isMuted ? <MicSlashSvg size={13} color="#ef4444" /> : <AudioOutlined style={{ fontSize: 12, color: '#10b981' }} />}
                  </div>

                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {isCameraOff ? <CamSlashSvg size={13} color="#ef4444" /> : <VideoCameraOutlined style={{ fontSize: 12, color: '#10b981' }} />}
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {userName || 'You'}
                  </div>
                </div>

                {/* Stage Bottom-Right Overlay: Green Online Dot */}
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    bottom: 12,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 6px #10b981',
                    zIndex: 2,
                  }}
                />
              </>
            )}
          </div>

          {/* 3. Bottom Mini Toolbar (matching Cosmos Image 1) */}
          <div
            style={{
              height: 48,
              backgroundColor: '#0c0d19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '0 16px',
              borderTop: '1px solid #1a2035',
            }}
          >
            {/* User Avatar Circle */}
            <Tooltip title="Your Profile">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid #f59e0b',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={getAvatarUrl({ name: userName, avatar_seed: userAvatarSeed } as any)}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </Tooltip>

            {/* Mic Toggle */}
            <Tooltip title={isMuted ? 'Unmute Mic' : 'Mute Mic'}>
              <div
                onClick={onToggleMute}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isMuted ? <MicSlashSvg size={16} color="#ef4444" /> : <AudioOutlined style={{ fontSize: 16, color: '#f8fafc' }} />}
              </div>
            </Tooltip>

            {/* Camera Toggle */}
            <Tooltip title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}>
              <div
                onClick={onToggleCamera}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isCameraOff ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {isCameraOff ? <CamSlashSvg size={16} color="#ef4444" /> : <VideoCameraOutlined style={{ fontSize: 16, color: '#f8fafc' }} />}
              </div>
            </Tooltip>

            {/* Screen Share Toggle */}
            <Tooltip title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}>
              <div
                onClick={onToggleScreenShare}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isScreenSharing ? '#2563eb' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <ScreenSvg size={16} color={isScreenSharing ? '#ffffff' : '#f8fafc'} />
              </div>
            </Tooltip>

            {/* Hand Raise Toggle */}
            <Tooltip title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}>
              <div
                onClick={onToggleHand}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: isHandRaised ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <HandSvg size={16} active={isHandRaised} />
              </div>
            </Tooltip>

            {/* Full Screen Toggle in Toolbar */}
            <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Whole Screen Full View'}>
              <div
                onClick={toggleFullScreen}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isFullScreen ? '#38bdf8' : '#94a3b8',
                  backgroundColor: isFullScreen ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isFullScreen ? '#38bdf8' : '#94a3b8')}
              >
                {isFullScreen ? (
                  <FullscreenExitOutlined style={{ fontSize: 16 }} />
                ) : (
                  <FullscreenOutlined style={{ fontSize: 16 }} />
                )}
              </div>
            </Tooltip>

            {/* Expand to Call Tab Mode */}
            {onExpandToCall && (
              <Tooltip title="Expand to Call Mode">
                <div
                  onClick={onExpandToCall}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <DesktopOutlined style={{ fontSize: 14 }} />
                </div>
              </Tooltip>
            )}

            {/* Leave button (matching Cosmos Image 2) */}
            {onLeave && (
              <Tooltip title="Exit Space">
                <div
                  onClick={onLeave}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ef4444',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogoutOutlined style={{ fontSize: 15, color: '#ef4444' }} />
                </div>
              </Tooltip>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CosmosPipCard;
