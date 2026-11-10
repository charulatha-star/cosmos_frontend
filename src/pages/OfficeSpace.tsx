import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Tag,
  Tooltip,
  Dropdown,
  Checkbox,
  Space,
  message,
  Avatar,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
  DesktopOutlined,
  UserAddOutlined,
  SmileOutlined,
  EllipsisOutlined,
  MessageOutlined,
  AppstoreOutlined,
  HomeOutlined,
  AimOutlined,
  PlusOutlined,
  MinusOutlined,
  DownOutlined,
  FullscreenOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { presenceApi } from '../api/presence';
import DirectChatDrawer from '../components/DirectChatDrawer';
import CameraOffOutlined from '../components/CameraOffIcon';
import type { PresenceUpdate, User } from '../types';

// Exact floor plan zones matching user's Screenshots 3 & 5
const OFFICE_ZONES = [
  // Meeting Room 2 (Top Left)
  { id: 'meeting-2', name: 'Meeting Room 2', x: 180, y: 150, width: 220, height: 110, type: 'meeting' },

  // Stage Area (Top Right)
  { id: 'stage', name: 'Stage Area', x: 800, y: 150, width: 140, height: 60, type: 'stage' },

  // Daily Standup Table (Right side long conference table)
  { id: 'standup', name: 'Daily Standup', x: 850, y: 280, width: 180, height: 320, type: 'standup_table' },

  // Lounge with couch & plant (Center bottom)
  { id: 'lounge', name: 'Coffee Lounge', x: 620, y: 470, width: 120, height: 90, type: 'lounge' },

  // Desks Grid (Columns of 3 desks)
  { id: 'desk-4', name: 'Desk 4', x: 480, y: 280, width: 75, height: 50 },
  { id: 'desk-5', name: 'Desk 5', x: 580, y: 280, width: 75, height: 50 },
  { id: 'desk-6', name: 'Desk 6', x: 680, y: 280, width: 75, height: 50 },

  { id: 'desk-7', name: 'Desk 7', x: 180, y: 390, width: 75, height: 50 },
  { id: 'desk-8', name: 'Desk 8', x: 280, y: 390, width: 75, height: 50 },
  { id: 'desk-9', name: 'Desk 9', x: 380, y: 390, width: 75, height: 50 },

  { id: 'desk-10', name: 'Desk 10', x: 180, y: 530, width: 75, height: 50 },
  { id: 'desk-11', name: 'Desk 11', x: 280, y: 530, width: 75, height: 50 },
  { id: 'desk-12', name: 'Desk 12', x: 380, y: 530, width: 75, height: 50 },
];

export const OfficeSpace: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const currentSpace = spaceId || 'billion';
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode switcher matching Screenshots 3 vs 4: 'space' (2D floor plan) vs 'call' (video/3D avatar stage)
  const [viewMode, setViewMode] = useState<'space' | 'call'>('space');

  // Media dock states
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(true);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  // Avatar position on 2D map
  const [myPos, setMyPos] = useState<{ x: number; y: number }>({ x: 550, y: 570 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.38); // 38% matching screenshot

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

  // Sync own position with backend presence (Step 6 Presence)
  const syncPresence = useCallback(
    async (x: number, y: number, desk?: string) => {
      try {
        await presenceApi.updatePresence({
          x,
          y,
          desk,
          space: currentSpace,
          status: 'online',
        });
      } catch {
        // Local state
      }
    },
    [currentSpace]
  );

  // Poll active presences from backend every 6s
  useEffect(() => {
    const fetchPresences = async () => {
      try {
        const data = await presenceApi.getPresences(currentSpace);
        if (data && data.length > 0) {
          setPresences(data.filter((p) => p.user_id !== user?.id));
        }
      } catch {
        // Backend offline
      }
    };
    fetchPresences();
    const interval = setInterval(fetchPresences, 6000);
    return () => clearInterval(interval);
  }, [currentSpace, user]);

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
          syncPresence(targetPos.x, targetPos.y);
          return targetPos;
        }

        const speed = 10;
        return {
          x: prev.x + (dx / dist) * speed,
          y: prev.y + (dy / dist) * speed,
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

  // Keyboard navigation (WASD & Arrow keys)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const step = 20;
      setTargetPos(null);

      setMyPos((prev) => {
        let nx = prev.x;
        let ny = prev.y;

        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') ny -= step;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') ny += step;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nx -= step;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nx += step;

        nx = Math.max(80, Math.min(1200, nx));
        ny = Math.max(80, Math.min(750, ny));

        syncPresence(nx, ny);
        return { x: nx, y: ny };
      });
    },
    [syncPresence]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;
    setTargetPos({ x: Math.round(clickX), y: Math.round(clickY) });
  };

  const spaceMenuItems: MenuProps['items'] = [
    {
      key: 'billion',
      label: 'billion',
      onClick: () => navigate('/v/billion/office'),
    },
    { type: 'divider' },
    {
      key: 'dashboard',
      label: 'Back to Spaces Dashboard',
      onClick: () => navigate('/dashboard'),
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
      {/* 1. TOP HEADER (Matching Screenshots 3, 4, 5) */}
      <header
        style={{
          height: 52,
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 30,
        }}
      >
        {/* Left: Space Dropdown */}
        <Dropdown menu={{ items: spaceMenuItems }} trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              color: '#fff',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f43f5e 0%, #38bdf8 100%)',
              }}
            />
            <span>{currentSpace}</span>
            <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
          </div>
        </Dropdown>

        {/* Center: Top Mode Switcher (Space vs Call) */}
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 24,
            padding: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
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
              backgroundColor: viewMode === 'space' ? '#334155' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              transition: 'background-color 0.2s',
            }}
          >
            <span style={{ fontSize: 14 }}>🪐</span> Space 🎧 📢
          </button>

          {/* Call Button */}
          <button
            onClick={() => setViewMode('call')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 20,
              backgroundColor: viewMode === 'call' ? '#334155' : 'transparent',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              transition: 'background-color 0.2s',
            }}
          >
            <VideoCameraOutlined /> Call
          </button>
        </div>

        {/* Right: Fullscreen / Window Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          {/* Getting Started Checklist */}
          <div style={{ marginBottom: 20, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: '#0f172a' }}>
              Getting started
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              <Checkbox defaultChecked>Watch the intro video</Checkbox>
              <Checkbox>Add members to your space</Checkbox>
              <Checkbox>Host a meeting to try Cosmos</Checkbox>
              <Checkbox>Improve regular team meetings</Checkbox>
              <Checkbox>Set Cosmos hours for routine</Checkbox>
            </div>
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
              onClick={handleFloorClick}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                cursor: 'crosshair',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Transformable Canvas with exact dot-grid background */}
              <div
                style={{
                  width: 1400,
                  height: 900,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: -700,
                  marginTop: -450,
                  backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                  backgroundSize: '24px 24px',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Render Desks & Zones matching Screenshots 3 & 5 */}
                {OFFICE_ZONES.map((zone) => {
                  const isCurrentZone = activeZone === zone.name;

                  // Daily Standup Table
                  if (zone.type === 'standup_table') {
                    return (
                      <div
                        key={zone.id}
                        style={{
                          position: 'absolute',
                          left: zone.x,
                          top: zone.y,
                          width: zone.width,
                          height: zone.height,
                          border: isCurrentZone ? '2px dashed #3b82f6' : '1px dashed #cbd5e1',
                          borderRadius: 20,
                          backgroundColor: isCurrentZone ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            width: '80%',
                            height: '80%',
                            border: '1.5px solid #94a3b8',
                            borderRadius: 16,
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Tag color="cyan">👥 {zone.name}</Tag>
                        </div>
                      </div>
                    );
                  }

                  // Meeting Room 2
                  if (zone.type === 'meeting') {
                    return (
                      <div
                        key={zone.id}
                        style={{
                          position: 'absolute',
                          left: zone.x,
                          top: zone.y,
                          width: zone.width,
                          height: zone.height,
                          border: '1.5px solid #0f172a',
                          borderRadius: 12,
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Tag color="geekblue" style={{ fontWeight: 600 }}>
                          {zone.name}
                        </Tag>
                      </div>
                    );
                  }

                  // Stage Area
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
                          border: '2px solid #7c3aed',
                          borderRadius: 8,
                          backgroundColor: 'rgba(124, 58, 237, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Tag color="purple">🎭 {zone.name}</Tag>
                      </div>
                    );
                  }

                  // Coffee Lounge
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
                          border: '1px solid #fde047',
                          borderRadius: 16,
                          backgroundColor: '#fefce8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: 12, color: '#ca8a04', fontWeight: 600 }}>
                          ☕ {zone.name}
                        </span>
                      </div>
                    );
                  }

                  // Standard Work Desks with black pill label
                  return (
                    <div
                      key={zone.id}
                      style={{
                        position: 'absolute',
                        left: zone.x,
                        top: zone.y,
                        width: zone.width,
                        height: zone.height,
                        border: isCurrentZone ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        backgroundColor: isCurrentZone ? '#eff6ff' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 4,
                          backgroundColor: '#64748b',
                          borderRadius: 2,
                          marginBottom: 4,
                        }}
                      />
                      <div
                        style={{
                          backgroundColor: isCurrentZone ? '#2563eb' : '#0f172a',
                          color: '#ffffff',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                        }}
                      >
                        {zone.name}
                      </div>
                    </div>
                  );
                })}

                {/* Render Other Online Teammates (Step 6 Presence) */}
                {presences.map((p) => (
                  <Tooltip title={`Message ${p.user_name}`} key={p.user_id}>
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
                        position: 'absolute',
                        left: (p.x || 300) - 18,
                        top: (p.y || 400) - 18,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        zIndex: 15,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {p.user_name ? p.user_name[0] : 'U'}
                      </div>
                      <div
                        style={{
                          marginTop: 3,
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          color: '#fff',
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 8,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.user_name}
                      </div>
                    </div>
                  </Tooltip>
                ))}

                {/* Local User Avatar Token (Guest 470) - Matching Screenshot 3 & 5 */}
                <div
                  style={{
                    position: 'absolute',
                    left: myPos.x - 24,
                    top: myPos.y - 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 20,
                    pointerEvents: 'none',
                    transition: 'transform 0.05s linear',
                  }}
                >
                  <Avatar
                    size={48}
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=Guest470"
                    style={{
                      border: '3px solid #f59e0b',
                      backgroundColor: '#1e293b',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.5)',
                    }}
                  />
                  <div
                    style={{
                      marginTop: 3,
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {user?.name || 'Guest 470'}
                  </div>
                </div>
              </div>

              {/* Zoom & Recenter Controls (Right Edge - matching Screenshot 3 & 5) */}
              <div
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '40%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  zIndex: 20,
                  backgroundColor: '#ffffff',
                  padding: 6,
                  borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <Tooltip title="Recenter Avatar" placement="left">
                  <Button
                    shape="circle"
                    icon={<AimOutlined />}
                    onClick={() => {
                      setMyPos({ x: 550, y: 570 });
                      setTargetPos(null);
                    }}
                  />
                </Tooltip>
                <Tooltip title="Zoom In" placement="left">
                  <Button
                    shape="circle"
                    icon={<PlusOutlined />}
                    onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.05).toFixed(2)))}
                  />
                </Tooltip>
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  {Math.round(zoom * 100)}%
                </div>
                <Tooltip title="Zoom Out" placement="left">
                  <Button
                    shape="circle"
                    icon={<MinusOutlined />}
                    onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.05).toFixed(2)))}
                  />
                </Tooltip>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW B: Call Mode / 3D Avatar Stage (Screenshot 4)       */
            /* ======================================================== */
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#090d16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Full-Screen Stage Card matching Screenshot 4 */}
              <div
                style={{
                  width: '85%',
                  maxWidth: 800,
                  height: '75%',
                  maxHeight: 600,
                  backgroundColor: '#fcd34d', // Authentic warm yellow background
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                }}
              >
                {/* 3D Character Illustration */}
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=Guest470"
                  alt="Avatar"
                  style={{
                    width: 340,
                    height: 340,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.25))',
                  }}
                />

                {/* Bottom Left Name & Mute Badge matching Screenshot 4 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  <AudioMutedOutlined style={{ color: '#ef4444', fontSize: 14 }} />
                  <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 14 }} />
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 13 }}>
                    {user?.name || 'Guest 470'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM CALL CONTROLS DOCK (Matching all 3 screenshots) */}
      <footer
        style={{
          height: 68,
          backgroundColor: '#0f172a',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 30,
        }}
      >
        {/* Left: User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={36}
            src="https://api.dicebear.com/7.x/bottts/svg?seed=Guest470"
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
          />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
            {user?.name || 'Guest 470'}
          </div>
        </div>

        {/* Center: Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Mic */}
          <div style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="large"
              type={isMuted ? 'default' : 'primary'}
              danger={isMuted}
              icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={() => {
                setIsMuted(!isMuted);
                message.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
              }}
              style={{ width: 44, height: 44 }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
              {isMuted ? 'Unmute' : 'Mute'}
            </div>
          </div>

          {/* Camera */}
          <div style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="large"
              type={isCameraOff ? 'default' : 'primary'}
              danger={isCameraOff}
              icon={isCameraOff ? <CameraOffOutlined /> : <VideoCameraOutlined />}
              onClick={() => {
                setIsCameraOff(!isCameraOff);
                message.info(isCameraOff ? 'Camera turned on' : 'Camera turned off');
              }}
              style={{ width: 44, height: 44 }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Camera</div>
          </div>

          {/* Share */}
          <div style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="large"
              icon={<DesktopOutlined />}
              onClick={() => message.success('Screen share ready!')}
              style={{ width: 44, height: 44 }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Share</div>
          </div>

          {/* Invite */}
          <div style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => message.info('Invite link copied to clipboard!')}
              style={{ width: 44, height: 44 }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Invite</div>
          </div>

          {/* Hand */}
          <div style={{ textAlign: 'center' }}>
            <Button
              shape="circle"
              size="large"
              type={isHandRaised ? 'primary' : 'default'}
              icon={<SmileOutlined />}
              onClick={() => setIsHandRaised(!isHandRaised)}
              style={{ width: 44, height: 44 }}
            />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Hand</div>
          </div>

          {/* More */}
          <div style={{ textAlign: 'center' }}>
            <Button shape="circle" size="large" icon={<EllipsisOutlined />} style={{ width: 44, height: 44 }} />
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>More</div>
          </div>
        </div>

        {/* Right: Chat, Apps, Set Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            onClick={() => setIsChatOpen(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
          >
            <MessageOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 10, marginTop: 2 }}>Chat</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
            onClick={() => message.info('Apps panel')}
          >
            <AppstoreOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 10, marginTop: 2 }}>Apps</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#94a3b8',
            }}
            onClick={() => message.success('Home desk set!')}
          >
            <HomeOutlined style={{ fontSize: 18 }} />
            <span style={{ fontSize: 10, marginTop: 2 }}>Set Home</span>
          </div>
        </div>
      </footer>

      {/* Direct Messages Drawer */}
      <DirectChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedContact={selectedContact}
      />
    </div>
  );
};

export default OfficeSpace;
