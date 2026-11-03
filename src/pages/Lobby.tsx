import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Typography,
  Card,
  Row,
  Col,
  Button,
  Avatar,
  Tooltip,
  Progress,
  Popconfirm,
  Segmented,
  message,
  Space,
  Empty,
  Badge,
  Radio,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  InfoCircleOutlined,
  CompassOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CreateRoomModal from '../components/CreateRoomModal';
import OfficeCanvas from '../components/OfficeCanvas';
import { useAuth } from '../context/AuthContext';
import { roomsApi, type RoomWithParticipants, type CreateRoomPayload } from '../api/rooms';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// Initial sample rooms matching the Cosmos PRD and real office layout
const INITIAL_MOCK_ROOMS: RoomWithParticipants[] = [
  {
    id: 'all-hands',
    name: 'All-Hands Auditorium',
    type: 'permanent',
    capacity: 50,
    created_by: 'usr-admin-001',
    description: 'Main company auditorium for office-wide announcements and town halls.',
    active_participants: [
      { id: 'u1', name: 'Charu Latha', role: 'Employee' },
      { id: 'u2', name: 'Uma', role: 'Employee' },
    ],
  },
  {
    id: 'engineering-huddle',
    name: 'Engineering Huddle',
    type: 'permanent',
    capacity: 6,
    created_by: 'usr-admin-001',
    description: 'Sprint planning and technical sync for developers.',
    active_participants: [
      { id: 'u3', name: 'Alex Rivera', role: 'Employee' },
      { id: 'u4', name: 'Dev Lead', role: 'Employee' },
      { id: 'u5', name: 'QA Tester', role: 'Employee' },
    ],
  },
  {
    id: 'cowork-desk',
    name: 'Cowork Central Table',
    type: 'permanent',
    capacity: 8,
    created_by: 'usr-admin-001',
    description: 'Open co-working desk space for drop-in discussions.',
    active_participants: [],
  },
  {
    id: 'design-critique',
    name: 'Design Critique (Full Room Demo)',
    type: 'temporary',
    capacity: 2,
    created_by: 'usr-emp-002',
    description: 'Temporary sync room that has already reached maximum capacity (PRD 6.2 & 12 test).',
    active_participants: [
      { id: 'u6', name: 'Lead Designer', role: 'Employee' },
      { id: 'u7', name: 'Product Manager', role: 'Employee' },
    ],
  },
];

export const Lobby: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode switcher: 'space' (2D interactive map) vs 'rooms' (card list)
  const [viewMode, setViewMode] = useState<'space' | 'rooms'>('space');

  const [rooms, setRooms] = useState<RoomWithParticipants[]>(INITIAL_MOCK_ROOMS);
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const isAdmin = user?.role === 'Admin';
  const isEmployee = user?.role === 'Employee';

  // Load rooms from backend if available, fallback to mock state
  const fetchRooms = useCallback(async () => {
    try {
      const data = await roomsApi.getRooms();
      if (data && data.length > 0) {
        setRooms(data);
      }
    } catch {
      // Backend not running yet, retain local state
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async (payload: CreateRoomPayload) => {
    setCreateLoading(true);
    try {
      try {
        const newRoom = await roomsApi.createRoom(payload);
        setRooms((prev) => [newRoom, ...prev]);
      } catch {
        const localRoom: RoomWithParticipants = {
          id: `room-${Date.now()}`,
          name: payload.name,
          type: payload.type,
          capacity: payload.capacity,
          created_by: user?.id || 'usr-local',
          description: payload.description,
          active_participants: [],
        };
        setRooms((prev) => [localRoom, ...prev]);
      }

      message.success(`Room "${payload.name}" created successfully!`);
      setIsModalOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    try {
      try {
        await roomsApi.deleteRoom(roomId);
      } catch {
        // Fallback
      }
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      message.success(`Room "${roomName}" deleted.`);
    } catch {
      message.error('Failed to delete room.');
    }
  };

  const handleJoinRoom = (room: RoomWithParticipants) => {
    const currentCount = room.active_participants?.length || 0;
    if (currentCount >= room.capacity) {
      message.error({
        content: `Cannot join "${room.name}": Room has reached its maximum capacity of ${room.capacity} participants.`,
        duration: 4,
      });
      return;
    }

    navigate(`/room/${room.id}`);
  };

  const canDeleteRoom = (room: RoomWithParticipants) => {
    if (isAdmin) return true;
    if (isEmployee && room.type === 'temporary' && room.created_by === user?.id) return true;
    return false;
  };

  const filteredRooms = rooms.filter((r) => {
    if (filterType === 'permanent') return r.type === 'permanent';
    if (filterType === 'temporary') return r.type === 'temporary';
    return true;
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      {/* Top Mode Selector Bar (Space 2D Virtual Office vs Rooms Cards) */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '10px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <Space size={12}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="space">
              <CompassOutlined /> Space (2D Virtual Office)
            </Radio.Button>
            <Radio.Button value="rooms">
              <AppstoreOutlined /> Rooms Directory ({rooms.length})
            </Radio.Button>
          </Radio.Group>
        </Space>

        <Space>
          {(isAdmin || isEmployee) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              {isAdmin ? 'Create Permanent Room' : 'Create Temporary Room'}
            </Button>
          )}
        </Space>
      </div>

      {/* VIEW 1: Space (The 2D Interactive Virtual Office with Movable Avatars) */}
      {viewMode === 'space' ? (
        <OfficeCanvas />
      ) : (
        /* VIEW 2: Rooms Directory (Card Grid with capacity enforcement) */
        <Content style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0 }}>Office Rooms Directory</Title>
              <Text type="secondary">
                See who is online, monitor room occupancy, and drop into active rooms
              </Text>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Segmented
              options={[
                { label: `All Rooms (${rooms.length})`, value: 'all' },
                {
                  label: `Permanent (${rooms.filter((r) => r.type === 'permanent').length})`,
                  value: 'permanent',
                },
                {
                  label: `Temporary (${rooms.filter((r) => r.type === 'temporary').length})`,
                  value: 'temporary',
                },
              ]}
              value={filterType}
              onChange={(val) => setFilterType(val as string)}
            />

            <Text type="secondary" style={{ fontSize: 13 }}>
              <InfoCircleOutlined /> Capacities are strictly enforced per PRD Section 6.2
            </Text>
          </div>

          {/* Room Cards Grid */}
          {filteredRooms.length === 0 ? (
            <Empty description="No rooms found in this category" />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredRooms.map((room) => {
                const currentOccupancy = room.active_participants?.length || 0;
                const isFull = currentOccupancy >= room.capacity;
                const occupancyPercent = Math.min(
                  100,
                  Math.round((currentOccupancy / room.capacity) * 100)
                );

                return (
                  <Col xs={24} md={12} lg={8} key={room.id}>
                    <Badge.Ribbon
                      text={isFull ? 'FULL' : room.type.toUpperCase()}
                      color={isFull ? 'red' : room.type === 'permanent' ? 'blue' : 'orange'}
                    >
                      <Card
                        hoverable
                        style={{
                          borderRadius: 10,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          border: isFull ? '1px solid #ffccc7' : undefined,
                        }}
                        title={
                          <Space>
                            <TeamOutlined style={{ color: '#1677ff' }} />
                            <span style={{ fontWeight: 600 }}>{room.name}</span>
                          </Space>
                        }
                        extra={
                          canDeleteRoom(room) && (
                            <Popconfirm
                              title={`Delete "${room.name}"?`}
                              description="Are you sure you want to remove this room?"
                              onConfirm={() => handleDeleteRoom(room.id, room.name)}
                              okText="Delete"
                              okType="danger"
                              cancelText="Cancel"
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{ marginRight: 24 }}
                              />
                            </Popconfirm>
                          )
                        }
                        actions={[
                          <Button
                            key="join"
                            type={isFull ? 'default' : 'primary'}
                            danger={isFull}
                            block
                            icon={isFull ? <LockOutlined /> : <VideoCameraOutlined />}
                            onClick={() => handleJoinRoom(room)}
                            style={{ margin: '0 16px', width: 'calc(100% - 32px)' }}
                          >
                            {isFull ? 'Room Full' : 'Join Room (< 5s)'}
                          </Button>,
                        ]}
                      >
                        <Paragraph
                          type="secondary"
                          style={{ minHeight: 40, fontSize: 13, marginBottom: 12 }}
                          ellipsis={{ rows: 2 }}
                        >
                          {room.description || 'No description provided.'}
                        </Paragraph>

                        {/* Capacity progress */}
                        <div style={{ marginBottom: 16 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                              fontSize: 12,
                            }}
                          >
                            <Text type="secondary">Occupancy</Text>
                            <Text strong style={{ color: isFull ? '#cf1322' : undefined }}>
                              {currentOccupancy} / {room.capacity}
                            </Text>
                          </div>
                          <Progress
                            percent={occupancyPercent}
                            showInfo={false}
                            status={isFull ? 'exception' : 'active'}
                            strokeColor={isFull ? '#ff4d4f' : '#1677ff'}
                            size="small"
                          />
                        </div>

                        {/* Participant avatars */}
                        <div>
                          <Text
                            type="secondary"
                            style={{ fontSize: 12, display: 'block', marginBottom: 6 }}
                          >
                            People inside now:
                          </Text>
                          {currentOccupancy > 0 ? (
                            <Avatar.Group
                              max={{
                                count: 4,
                                style: { color: '#f56a00', backgroundColor: '#fde3cf' },
                              }}
                            >
                              {room.active_participants?.map((participant) => (
                                <Tooltip
                                  key={participant.id}
                                  title={`${participant.name} (${participant.role})`}
                                >
                                  <Avatar
                                    style={{
                                      backgroundColor:
                                        participant.role === 'Admin' ? '#f5222d' : '#1890ff',
                                    }}
                                    icon={<UserOutlined />}
                                  >
                                    {participant.name[0]}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </Avatar.Group>
                          ) : (
                            <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>
                              Empty room
                            </Text>
                          )}
                        </div>
                      </Card>
                    </Badge.Ribbon>
                  </Col>
                );
              })}
            </Row>
          )}
        </Content>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleCreateRoom}
        loading={createLoading}
      />
    </Layout>
  );
};

export default Lobby;
