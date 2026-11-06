import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Tag, Tooltip, notification, Space } from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
  DesktopOutlined,
  AimOutlined,
  PlusOutlined,
  MinusOutlined,
  VideoCameraAddOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DirectChatDrawer from './DirectChatDrawer';
import type { OfficeZone, OfficeAvatar } from '../types/office';
import type { User, UserRole, UserPresenceStatus } from '../types';

// Layout zones matching the real Cosmos office screenshot
const OFFICE_ZONES: OfficeZone[] = [
  // Cowork Conference Table (Center)
  {
    id: 'cowork-table',
    name: 'Cowork Central Desk',
    x: 620,
    y: 280,
    width: 220,
    height: 140,
    type: 'cowork_table',
    capacity: 8,
    roomId: 'engineering-huddle',
  },
  // Game Room (Top Center)
  {
    id: 'game-room',
    name: 'Game Room',
    x: 670,
    y: 120,
    width: 120,
    height: 60,
    type: 'meeting_room',
    capacity: 6,
    roomId: 'all-hands',
  },
  // Stage Area (Top Right)
  {
    id: 'stage-area',
    name: 'Stage Area',
    x: 960,
    y: 110,
    width: 160,
    height: 80,
    type: 'stage',
    capacity: 50,
    roomId: 'all-hands',
  },
  // Lounge Area (Bottom Center)
  {
    id: 'lounge-area',
    name: 'Coffee Lounge',
    x: 680,
    y: 520,
    width: 140,
    height: 90,
    type: 'lounge',
  },

  // Desks Cluster Left (Columns of 3 desks)
  { id: 'desk-4', name: 'Desk 4', x: 260, y: 150, width: 80, height: 60, type: 'desk' },
  { id: 'desk-5', name: 'Desk 5', x: 370, y: 150, width: 80, height: 60, type: 'desk' },
  { id: 'desk-6', name: 'Desk 6', x: 480, y: 150, width: 80, height: 60, type: 'desk' },

  { id: 'desk-7', name: 'Desk 7', x: 260, y: 280, width: 80, height: 60, type: 'desk' },
  { id: 'desk-8', name: 'Desk 8', x: 370, y: 280, width: 80, height: 60, type: 'desk' },
  { id: 'desk-9', name: 'Desk 9', x: 480, y: 280, width: 80, height: 60, type: 'desk' },

  { id: 'desk-10', name: 'Desk 10', x: 260, y: 410, width: 80, height: 60, type: 'desk' },
  { id: 'desk-11', name: 'Desk 11', x: 370, y: 410, width: 80, height: 60, type: 'desk' },
  { id: 'desk-12', name: 'Desk 12', x: 480, y: 410, width: 80, height: 60, type: 'desk' },

  { id: 'desk-13', name: 'Desk 13', x: 260, y: 540, width: 80, height: 60, type: 'desk' },
  { id: 'desk-14', name: 'Desk 14', x: 370, y: 540, width: 80, height: 60, type: 'desk' },
  { id: 'desk-15', name: 'Desk 15', x: 480, y: 540, width: 80, height: 60, type: 'desk' },

  // Desks Cluster Right
  { id: 'desk-16', name: 'Desk 16', x: 920, y: 220, width: 80, height: 60, type: 'desk' },
  { id: 'desk-17', name: 'Desk 17', x: 1030, y: 220, width: 80, height: 60, type: 'desk' },
  { id: 'desk-18', name: 'Desk 18', x: 1140, y: 220, width: 80, height: 60, type: 'desk' },

  { id: 'desk-19', name: 'Desk 19', x: 920, y: 340, width: 80, height: 60, type: 'desk' },
  { id: 'desk-20', name: 'Desk 20', x: 1030, y: 340, width: 80, height: 60, type: 'desk' },
  { id: 'desk-21', name: 'Desk 21', x: 1140, y: 340, width: 80, height: 60, type: 'desk' },

  // Focus Desks (Bottom Right)
  { id: 'focus-1', name: 'Focus Desk 1', x: 940, y: 480, width: 90, height: 60, type: 'focus_desk' },
  { id: 'focus-2', name: 'Focus Desk 2', x: 1070, y: 480, width: 90, height: 60, type: 'focus_desk' },
  { id: 'focus-3', name: 'Focus Desk 3', x: 940, y: 580, width: 90, height: 60, type: 'focus_desk' },
  { id: 'focus-4', name: 'Focus Desk 4', x: 1070, y: 580, width: 90, height: 60, type: 'focus_desk' },
];

export const OfficeCanvas: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas zoom & pan
  const [zoom, setZoom] = useState<number>(0.9);

  // Local user avatar position
  const [myPos, setMyPos] = useState<{ x: number; y: number }>({ x: 420, y: 580 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);

  // Active zone where the avatar is currently located
  const [activeZone, setActiveZone] = useState<OfficeZone | null>(null);

  // Media states in office dock
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  // Other online colleagues in the office
  const [colleagues] = useState<OfficeAvatar[]>([
    {
      id: 'c1',
      name: 'Charu Latha',
      role: 'Employee',
      x: 390,
      y: 290,
      isLocal: false,
      deskLabel: 'Desk 8',
      status: 'online',
      isSpeaking: true,
      avatarColor: '#1677ff',
    },
    {
      id: 'c2',
      name: 'Alex Rivera',
      role: 'Employee',
      x: 720,
      y: 340,
      isLocal: false,
      deskLabel: 'Cowork Desk',
      status: 'online',
      isMuted: false,
      avatarColor: '#722ed1',
    },
    {
      id: 'c3',
      name: 'Sarah Connor',
      role: 'Admin',
      x: 980,
      y: 490,
      isLocal: false,
      deskLabel: 'Focus Desk 1',
      status: 'busy',
      isMuted: true,
      avatarColor: '#fa541c',
    },
  ]);

  // Smooth walk animation towards targetPos
  useEffect(() => {
    if (!targetPos) return;

    const interval = setInterval(() => {
      setMyPos((prev) => {
        const dx = targetPos.x - prev.x;
        const dy = targetPos.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 6) {
          setTargetPos(null);
          return targetPos;
        }

        const speed = 9;
        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
        };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [targetPos]);

  // Check which zone the user is currently inside
  useEffect(() => {
    const found = OFFICE_ZONES.find((zone) => {
      return (
        myPos.x >= zone.x - 20 &&
        myPos.x <= zone.x + zone.width + 20 &&
        myPos.y >= zone.y - 20 &&
        myPos.y <= zone.y + zone.height + 20
      );
    });

    if (found?.id !== activeZone?.id) {
      setActiveZone(found || null);
      if (found && found.type !== 'desk') {
        notification.info({
          message: `Entered ${found.name}`,
          description: found.roomId
            ? 'You can join the live video conversation here!'
            : 'You are now sitting in this zone.',
          placement: 'bottomRight',
          duration: 3,
        });
      }
    }
  }, [myPos, activeZone]);

  // Keyboard controls (Arrow keys and WASD)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

    const step = 18;
    setTargetPos(null); // Cancel click-to-walk target

    setMyPos((prev) => {
      let nx = prev.x;
      let ny = prev.y;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') ny -= step;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') ny += step;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nx -= step;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nx += step;

      // Restrict within canvas boundary (1400 x 800)
      nx = Math.max(80, Math.min(1320, nx));
      ny = Math.max(80, Math.min(720, ny));

      return { x: nx, y: ny };
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Click on floor or desk to walk
  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    setTargetPos({ x: Math.round(clickX), y: Math.round(clickY) });
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(1.4, Math.max(0.5, +(prev + delta).toFixed(1))));
  };

  const handleRecenter = () => {
    setMyPos({ x: 420, y: 580 });
    setTargetPos(null);
    setZoom(0.9);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 120px)',
        minHeight: 620,
        background: '#f8fafc',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 2D Interactive Map Canvas with Dot Grid */}
      <div
        ref={containerRef}
        onClick={handleFloorClick}
        style={{
          width: 1440,
          height: 800,
          margin: '0 auto',
          position: 'relative',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
          cursor: 'crosshair',
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Render Office Zones (Desks, Tables, Stages) */}
        {OFFICE_ZONES.map((zone) => {
          const isAtThisZone = activeZone?.id === zone.id;

          if (zone.type === 'cowork_table') {
            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  border: isAtThisZone ? '2px dashed #1677ff' : '2px dashed #94a3b8',
                  borderRadius: 24,
                  backgroundColor: isAtThisZone ? 'rgba(22, 119, 255, 0.08)' : 'rgba(241, 245, 249, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {/* Table representation with chairs */}
                <div
                  style={{
                    width: '75%',
                    height: '60%',
                    border: '2px solid #64748b',
                    borderRadius: 16,
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  <Tag color="blue" style={{ fontSize: 11, margin: 0, fontWeight: 600 }}>
                    {zone.name}
                  </Tag>
                </div>
                <span style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  (Click to walk & join)
                </span>
              </div>
            );
          }

          if (zone.type === 'stage') {
            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  border: '2px solid #722ed1',
                  borderRadius: 12,
                  backgroundColor: 'rgba(114, 46, 209, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tag color="purple" style={{ fontWeight: 600 }}>
                  🎭 {zone.name}
                </Tag>
              </div>
            );
          }

          if (zone.type === 'meeting_room') {
            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  border: '1.5px solid #13c2c2',
                  borderRadius: 10,
                  backgroundColor: 'rgba(19, 194, 194, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Tag color="cyan">{zone.name}</Tag>
              </div>
            );
          }

          if (zone.type === 'lounge') {
            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  border: '1px solid #d9d9d9',
                  borderRadius: 16,
                  backgroundColor: '#fefce8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: '#ca8a04', fontWeight: 500 }}>
                  ☕ {zone.name}
                </span>
              </div>
            );
          }

          // Individual Desk Representation (Matching real Cosmos screenshot)
          return (
            <div
              key={zone.id}
              style={{
                position: 'absolute',
                left: zone.x,
                top: zone.y,
                width: zone.width,
                height: zone.height,
                border: isAtThisZone ? '1.5px solid #1677ff' : '1px solid #cbd5e1',
                borderRadius: 8,
                backgroundColor: isAtThisZone ? '#eff6ff' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Monitor shape */}
              <div
                style={{
                  width: 32,
                  height: 6,
                  backgroundColor: '#64748b',
                  borderRadius: 2,
                  marginBottom: 4,
                }}
              />
              {/* Desk black pill label */}
              <div
                style={{
                  backgroundColor: isAtThisZone ? '#1677ff' : '#0f172a',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 10,
                }}
              >
                {zone.name}
              </div>
            </div>
          );
        })}

        {/* Render Online Colleagues Avatars */}
        {colleagues.map((colleague) => (
          <Tooltip title={`Click to message ${colleague.name}`} key={colleague.id}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContact({
                  id: colleague.id,
                  name: colleague.name,
                  role: (colleague.role || 'Employee') as UserRole,
                  email: `${colleague.name.toLowerCase().replace(/\s+/g, '.')}@billiontags.com`,
                  status: (colleague.status === 'away' ? 'busy' : colleague.status) as UserPresenceStatus,
                });
                setIsChatOpen(true);
              }}
              style={{
                position: 'absolute',
                left: colleague.x - 20,
                top: colleague.y - 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 15,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Avatar circle with speaking pulse */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: colleague.avatarColor || '#1677ff',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  boxShadow: colleague.isSpeaking
                    ? '0 0 0 4px rgba(82, 196, 26, 0.4)'
                    : '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {colleague.name[0]}
              </div>
              {/* Name tag pill */}
              <div
                style={{
                  marginTop: 4,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  color: '#fff',
                  fontSize: 11,
                  padding: '1px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {colleague.name}
              </div>
            </div>
          </Tooltip>
        ))}

        {/* Render Local User Avatar (Movable) */}
        <div
          style={{
            position: 'absolute',
            left: myPos.x - 24,
            top: myPos.y - 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            transition: 'transform 0.05s linear',
          }}
        >
          {/* Pulsing ring for your avatar */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              border: '3px solid #ffffff',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.5)',
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          {/* Name tag pill */}
          <div
            style={{
              marginTop: 4,
              backgroundColor: '#1677ff',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {user?.name || 'You'} (You)
          </div>
        </div>
      </div>

      {/* Floating Instructions Banner (Top Center) */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 20,
        }}
      >
        <span>🎮 Use <b>W, A, S, D</b> or <b>Arrow keys</b>, or click any desk/room to walk!</span>
      </div>

      {/* Zoom & Recenter Controls (Right Edge - matching Cosmos screenshot) */}
      <div
        style={{
          position: 'absolute',
          right: 24,
          top: '40%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 20,
          backgroundColor: '#fff',
          padding: 6,
          borderRadius: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Tooltip title="Recenter Avatar" placement="left">
          <Button shape="circle" icon={<AimOutlined />} onClick={handleRecenter} />
        </Tooltip>
        <Tooltip title="Zoom In" placement="left">
          <Button shape="circle" icon={<PlusOutlined />} onClick={() => handleZoom(0.1)} />
        </Tooltip>
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
          {Math.round(zoom * 100)}%
        </div>
        <Tooltip title="Zoom Out" placement="left">
          <Button shape="circle" icon={<MinusOutlined />} onClick={() => handleZoom(-0.1)} />
        </Tooltip>
      </div>

      {/* Active Zone Enter Banner (When inside a meeting space) */}
      {activeZone?.roomId && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 30,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Inside: {activeZone.name}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Connected to video room: {activeZone.roomId}
            </div>
          </div>
          <Button
            type="primary"
            icon={<VideoCameraAddOutlined />}
            onClick={() => navigate(`/room/${activeZone.roomId}`)}
          >
            Enter Call Fullscreen
          </Button>
        </div>
      )}

      {/* Bottom Floating Media Bar (Dock matching real Cosmos screenshot) */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#001529',
          borderRadius: 30,
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 20,
        }}
      >
        <Space size={8}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </Space>

        <div style={{ width: 1, height: 24, backgroundColor: '#334155' }} />

        {/* Mic Toggle */}
        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
          <Button
            shape="circle"
            type={isMuted ? 'default' : 'primary'}
            danger={isMuted}
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => setIsMuted(!isMuted)}
          />
        </Tooltip>

        {/* Camera Toggle */}
        <Tooltip title={isCameraOff ? 'Start Video' : 'Stop Video'}>
          <Button
            shape="circle"
            type={isCameraOff ? 'default' : 'primary'}
            danger={isCameraOff}
            icon={isCameraOff ? <CloseCircleOutlined /> : <VideoCameraOutlined />}
            onClick={() => setIsCameraOff(!isCameraOff)}
          />
        </Tooltip>

        {/* Screen Share */}
        <Tooltip title="Share Screen">
          <Button
            shape="circle"
            icon={<DesktopOutlined />}
            onClick={() => {
              if (activeZone?.roomId) {
                navigate(`/room/${activeZone.roomId}`);
              } else {
                navigate('/room/all-hands');
              }
            }}
          />
        </Tooltip>

        {/* Office Direct Messages */}
        <Tooltip title="Direct Messages">
          <Button
            shape="circle"
            icon={<MessageOutlined />}
            type={isChatOpen ? 'primary' : 'default'}
            onClick={() => {
              setSelectedContact(null);
              setIsChatOpen(true);
            }}
          />
        </Tooltip>

        {activeZone && (
          <Tag color="cyan" style={{ margin: 0 }}>
            {activeZone.name}
          </Tag>
        )}
      </div>

      {/* Direct Messages Drawer */}
      <DirectChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedContact={selectedContact}
      />
    </div>
  );
};

export default OfficeCanvas;
