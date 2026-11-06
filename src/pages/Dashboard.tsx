import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Input,
  Tag,
  Modal,
  Form,
  Dropdown,
  Avatar,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  LogoutOutlined,
  DownOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spacesApi } from '../api/spaces';
import type { SpaceItem } from '../types';

const { Title, Text } = Typography;

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [spaces, setSpaces] = useState<SpaceItem[]>([
    {
      id: 'billion',
      name: 'billion',
      admin_access: true,
      is_free: true,
    },
  ]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Load spaces from backend if running
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await spacesApi.getSpaces();
        if (data && data.length > 0) {
          setSpaces(data);
        }
      } catch {
        // Backend offline, retain default
      }
    };
    fetchSpaces();
  }, []);

  const handleCreateSpace = async () => {
    try {
      const values = await form.validateFields();
      setCreateLoading(true);

      try {
        const newSpace = await spacesApi.createSpace(values.name);
        setSpaces((prev) => [...prev, newSpace]);
      } catch {
        // Local fallback
        const localSpace: SpaceItem = {
          id: values.name.toLowerCase().replace(/\s+/g, '-'),
          name: values.name,
          admin_access: true,
          is_free: true,
        };
        setSpaces((prev) => [...prev, localSpace]);
      }

      message.success(`Space "${values.name}" created!`);
      setIsModalOpen(false);
      form.resetFields();
    } catch {
      // Form error
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEnterOffice = (spaceId: string) => {
    navigate(`/v/${spaceId}/office`);
  };

  const filteredSpaces = spaces.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'email',
      disabled: true,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user?.name || 'Guest 470'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.email || 'kuma1412002@gmail.com'}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Sign out',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fbfcfe',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* Top Navbar matching Screenshots 1 & 2 */}
      <header
        style={{
          height: 64,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {/* Left: Brand & Changelog */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              O
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              COSMOS
            </span>
          </div>

          <Tag
            color="processing"
            style={{
              borderRadius: 12,
              padding: '1px 10px',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ● Changelog
          </Tag>
        </div>

        {/* Center: Marketing Links */}
        <div style={{ display: 'flex', gap: 28 }}>
          <span style={{ color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Solutions
          </span>
          <span style={{ color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Product
          </span>
          <span style={{ color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Pricing
          </span>
          <span style={{ color: '#64748b', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Resources
          </span>
        </div>

        {/* Right: User Profile Dropdown matching screenshot */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 12px',
              borderRadius: 24,
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
            }}
          >
            <Avatar
              size={30}
              src="https://api.dicebear.com/7.x/bottts/svg?seed=Guest470"
              style={{ backgroundColor: '#1e293b' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                {user?.name || 'Guest 470'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                {user?.email || 'kuma1412002@gmail.com'}
              </div>
            </div>
            <DownOutlined style={{ fontSize: 10, color: '#64748b', marginLeft: 4 }} />
          </div>
        </Dropdown>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: 960, margin: '0 auto', width: '100%', padding: '48px 24px' }}>
        {/* Welcome Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: 32 }}>
            Welcome {user?.name || 'Guest 470'}!
          </Title>
          <Text style={{ fontSize: 15, color: '#64748b', display: 'block', marginTop: 8 }}>
            Your spaces for {user?.email || 'kuma1412002@gmail.com'}
          </Text>

          {/* Search Space Input */}
          <div style={{ maxWidth: 440, margin: '24px auto 0' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search Space"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: 44,
                borderRadius: 10,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            />
          </div>
        </div>

        {/* Space Cards List (Matching Screenshot 1) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredSpaces.map((sp) => (
            <Card
              key={sp.id}
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden',
                padding: '16px 20px',
              }}
              styles={{
                body: {
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                },
              }}
            >
              {/* Top Tags */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Tag
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 12,
                    padding: '2px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Admin access
                </Tag>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Free</span>
              </div>

              {/* Organization Logo & Title */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  margin: '12px 0 24px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '3px solid #f43f5e',
                      borderTopColor: '#38bdf8',
                    }}
                  />
                </div>
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                  {sp.name}
                </Title>
              </div>

              {/* Action Buttons matching screenshot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleEnterOffice(sp.id)}
                  style={{
                    backgroundColor: '#1e293b',
                    borderColor: '#1e293b',
                    borderRadius: 8,
                    padding: '0 28px',
                    height: 42,
                    fontWeight: 600,
                  }}
                >
                  Enter office
                </Button>

                <Button
                  type="link"
                  icon={<TeamOutlined />}
                  style={{ color: '#0f172a', fontWeight: 600, fontSize: 14 }}
                  onClick={() => message.info('Team management panel ready!')}
                >
                  Manage Team
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create New Space Box (Matching Screenshot 2) */}
        <div
          style={{
            marginTop: 56,
            textAlign: 'center',
            padding: '36px 24px',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            position: 'relative',
          }}
        >
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            Want to use Cosmos with a different team?
          </Title>

          <Button
            size="large"
            onClick={() => setIsModalOpen(true)}
            style={{
              marginTop: 20,
              borderRadius: 8,
              padding: '0 24px',
              height: 44,
              fontWeight: 600,
              borderColor: '#0f172a',
              color: '#0f172a',
            }}
          >
            Create a new space
          </Button>
        </div>
      </main>

      {/* Create Space Modal */}
      <Modal
        title="Create a New Workspace"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleCreateSpace}
        confirmLoading={createLoading}
        okText="Create Space"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Space Name"
            rules={[{ required: true, message: 'Please enter your space or company name' }]}
          >
            <Input placeholder="e.g. Billiontags_Team or Engineering" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
