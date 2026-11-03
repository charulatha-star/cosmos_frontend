import React, { useEffect, useRef } from 'react';
import { Card, Avatar, Tag, Space } from 'antd';
import { UserOutlined, AudioMutedOutlined } from '@ant-design/icons';
import type { Track } from 'livekit-client';

interface VideoTileProps {
  participantName: string;
  isLocal?: boolean;
  videoTrack?: Track | MediaStreamTrack | null;
  audioTrack?: Track | MediaStreamTrack | null;
  isMuted?: boolean;
  isCameraOff?: boolean;
  role?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participantName,
  isLocal = false,
  videoTrack,
  isMuted = false,
  isCameraOff = false,
  role = 'Employee',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (videoTrack && !isCameraOff) {
      if ('attach' in videoTrack && typeof videoTrack.attach === 'function') {
        // LiveKit RemoteVideoTrack or LocalVideoTrack
        videoTrack.attach(videoEl);
        return () => {
          videoTrack.detach(videoEl);
        };
      } else if (videoTrack instanceof MediaStreamTrack) {
        // Native browser MediaStreamTrack fallback
        const stream = new MediaStream([videoTrack]);
        videoEl.srcObject = stream;
        videoEl.play().catch(() => {});
        return () => {
          videoEl.srcObject = null;
        };
      }
    } else {
      videoEl.srcObject = null;
    }
  }, [videoTrack, isCameraOff]);

  return (
    <Card
      style={{
        background: '#1f242d',
        borderColor: '#2e3846',
        borderRadius: 12,
        overflow: 'hidden',
        height: '100%',
        minHeight: 240,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      styles={{
        body: {
          padding: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video playback to prevent audio feedback
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isCameraOff || !videoTrack ? 'none' : 'block',
          transform: isLocal ? 'scaleX(-1)' : 'none', // Mirror local camera
        }}
      />

      {/* Avatar Fallback when camera is disabled */}
      {(isCameraOff || !videoTrack) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 24,
          }}
        >
          <Avatar
            size={72}
            style={{
              backgroundColor: isLocal ? '#1677ff' : '#722ed1',
              fontSize: 28,
              fontWeight: 600,
            }}
            icon={<UserOutlined />}
          >
            {participantName ? participantName[0].toUpperCase() : 'U'}
          </Avatar>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
            {participantName} {isLocal && '(You)'}
          </span>
        </div>
      )}

      {/* Top overlay tags */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 6,
          zIndex: 2,
        }}
      >
        {isMuted && (
          <Tag color="error" icon={<AudioMutedOutlined />}>
            Muted
          </Tag>
        )}
      </div>

      {/* Bottom overlay: Participant Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          padding: '4px 10px',
          borderRadius: 6,
          zIndex: 2,
        }}
      >
        <Space size={6}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
            {participantName} {isLocal && '(You)'}
          </span>
          <Tag color={role === 'Admin' ? 'volcano' : 'blue'} style={{ margin: 0, fontSize: 10 }}>
            {role}
          </Tag>
        </Space>
      </div>
    </Card>
  );
};

export default VideoTile;
