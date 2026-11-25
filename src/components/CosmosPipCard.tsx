import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import {
  AudioOutlined,
  VideoCameraOutlined,
  FullscreenOutlined,
  DownOutlined,
  UpOutlined,
  CloseOutlined,
  DesktopOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { VideoTrack, AudioTrack, Track } from 'livekit-client';
import { getAvatarUrl } from './CosmosProfileStatusModal';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

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
  }, [isScreenSharing, screenStream, activeScreenTrack, isCameraOff, cameraStream, videoStream, videoTrack]);

  // When dual tile mode is active (both camera and screen share active):
  // Attach camera stream to cameraVideoRef
  useEffect(() => {
    const camEl = cameraVideoRef.current;
    if (!camEl || isCameraOff || !isScreenSharing) return;

    camEl.muted = true;
    camEl.defaultMuted = true;
    camEl.playsInline = true;

    if (videoTrack && 'attach' in videoTrack && typeof (videoTrack as any).attach === 'function') {
      try {
        (videoTrack as any).attach(camEl);
      } catch {}
      return () => {
        try {
          (videoTrack as any).detach(camEl);
        } catch {}
        camEl.srcObject = null;
      };
    } else {
      const stream =
        (cameraStream instanceof MediaStream ? cameraStream : null) ||
        (videoStream instanceof MediaStream ? videoStream : null);
      if (stream) {
        camEl.srcObject = stream;
        camEl.play().catch(() => {});
        return () => {
          camEl.srcObject = null;
        };
      }
    }
  }, [isCameraOff, isScreenSharing, cameraStream, videoStream, videoTrack]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: isPoppedOut ? 'relative' : 'absolute',
        right: isPoppedOut ? 'auto' : 24,
        bottom: isPoppedOut ? 'auto' : 24,
        width: isPoppedOut ? '100%' : (isScreenSharing && !isCameraOff ? 440 : 320),
        height: isPoppedOut ? '100%' : 'auto',
        backgroundColor: '#0c0d19',
        border: isPoppedOut ? 'none' : '1.5px solid #22293e',
        borderRadius: isPoppedOut ? 0 : 14,
        boxShadow: isPoppedOut ? 'none' : '0 16px 40px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 1. Header Bar: cosmos.video + audio waves + popout + minimize + close */}
      <div
        style={{
          height: 32,
          backgroundColor: '#111526',
          borderBottom: '1px solid #1e2438',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
          <span style={{ fontSize: 13 }}>{isScreenSharing ? '🖥️' : '📺'}</span>
          <span style={{ color: '#e2e8f0', letterSpacing: '0.02em' }}>
            {spaceName} {isScreenSharing ? '• Sharing' : ''}
          </span>
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
          {onPopOutPip && (
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

          {/* Minimize / Expand Toggle */}
          {!isPoppedOut && (
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
              height: isPoppedOut ? 'calc(100% - 76px)' : 190,
              minHeight: 180,
              backgroundColor: (isScreenSharing || !isCameraOff) ? '#000000' : '#f472b6',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: (isScreenSharing && !isCameraOff) ? 6 : 0,
              gap: (isScreenSharing && !isCameraOff) ? 6 : 0,
            }}
          >
            {/* DUAL TILE LAYOUT (When both Screen Share AND Camera are active matching Cosmos Image 2) */}
            {isScreenSharing && !isCameraOff ? (
              <>
                {/* Tile 1: Camera Feed */}
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#111526',
                    border: '1px solid #1e293b',
                  }}
                >
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Name tag overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 6,
                      bottom: 6,
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {userName || 'You'}
                  </div>
                  {/* Green online dot */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 6,
                      bottom: 6,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      border: '1.5px solid #ffffff',
                    }}
                  />
                </div>

                {/* Tile 2: Screen Share Feed */}
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    position: 'relative',
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                    border: '1px solid #1e293b',
                  }}
                >
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
                  {/* Screenshare tag overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 6,
                      bottom: 6,
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#38bdf8',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>🖥️</span>
                    <span>{`${userName}'s Screenshare`}</span>
                  </div>
                </div>
              </>
            ) : (
              /* SINGLE TILE LAYOUT: Camera or Screen Share or 3D Character */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isScreenSharing ? 'contain' : 'cover',
                    backgroundColor: '#000000',
                    display: (isScreenSharing || !isCameraOff) ? 'block' : 'none',
                  }}
                />

                {!isScreenSharing && isCameraOff && (
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

                {/* Stage Bottom-Left Overlay: Mic status + Cam status + Name / Screen Tag */}
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
                      color: isScreenSharing ? '#38bdf8' : '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isScreenSharing ? (
                      <>
                        <span>🖥️</span>
                        <span>{`${userName}'s Screenshare`}</span>
                      </>
                    ) : (
                      userName || 'You'
                    )}
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
              height: 44,
              backgroundColor: '#0c0d19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 8px',
              borderTop: '1px solid #1a2035',
            }}
          >
            {/* User Avatar Circle */}
            <Tooltip title="Your Profile">
              <div
                style={{
                  width: 26,
                  height: 26,
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
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </Tooltip>

            {/* Mic Toggle */}
            <Tooltip title={isMuted ? 'Unmute Mic' : 'Mute Mic'}>
              <div
                onClick={onToggleMute}
                style={{
                  width: 28,
                  height: 28,
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
                  width: 28,
                  height: 28,
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
                  width: 28,
                  height: 28,
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
                  width: 28,
                  height: 28,
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

            {/* Expand View */}
            {onExpandToCall && (
              <Tooltip title="Expand to Call Mode">
                <div
                  onClick={onExpandToCall}
                  style={{
                    width: 28,
                    height: 28,
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
                  <FullscreenOutlined style={{ fontSize: 15 }} />
                </div>
              </Tooltip>
            )}

            {/* Leave button (matching Cosmos Image 2) */}
            {onLeave && (
              <Tooltip title="Exit Space">
                <div
                  onClick={onLeave}
                  style={{
                    width: 28,
                    height: 28,
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
                  <LogoutOutlined style={{ fontSize: 14, color: '#ef4444' }} />
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
