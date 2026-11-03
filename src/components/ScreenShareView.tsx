import React, { useEffect, useRef } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { DesktopOutlined, StopOutlined } from '@ant-design/icons';
import type { Track } from 'livekit-client';

const { Text } = Typography;

interface ScreenShareViewProps {
  presenterName: string;
  isLocal: boolean;
  track: Track | MediaStreamTrack | null;
  onStopSharing: () => void;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
  presenterName,
  isLocal,
  track,
  onStopSharing,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !track) return;

    if ('attach' in track && typeof track.attach === 'function') {
      track.attach(videoEl);
      return () => {
        track.detach(videoEl);
      };
    } else if (track instanceof MediaStreamTrack) {
      const stream = new MediaStream([track]);
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
      return () => {
        videoEl.srcObject = null;
      };
    }
  }, [track]);

  return (
    <Card
      style={{
        width: '100%',
        height: '100%',
        minHeight: 480,
        background: '#090d16',
        borderColor: '#1f293d',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        },
      }}
    >
      {/* Screen video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          maxHeight: 'calc(100vh - 220px)',
          objectFit: 'contain',
          background: '#000',
        }}
      />

      {/* Top Banner overlay */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          padding: '6px 14px',
          borderRadius: 8,
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Space size={8}>
          <DesktopOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
            {isLocal ? 'You are sharing your screen' : `${presenterName} is presenting`}
          </Text>
        </Space>

        {isLocal && (
          <Button
            type="primary"
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={onStopSharing}
          >
            Stop Sharing
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ScreenShareView;
