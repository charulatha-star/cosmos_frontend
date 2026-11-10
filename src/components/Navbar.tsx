import React, { useState } from 'react';
import { Layout, Menu, Button, Tag, Dropdown, Space, Avatar, Badge, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  SettingOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DirectChatDrawer from './DirectChatDrawer';
import type { UserRole } from '../types';

const { Header } = Layout;

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDMsOpen, setIsDMsOpen] = useState<boolean>(false);

  if (!user) return null;

  const roleColors: Record<UserRole, string> = {
    Admin: 'volcano',
    Employee: 'blue',
    Guest: 'gold',
  };

  const navMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <VideoCameraOutlined />,
      label: 'Office Lobby',
    },
    {
      key: '/schedule',
      icon: <CalendarOutlined />,
      label: 'Schedule Meeting',
      disabled: user.role === 'Guest',
    },
    ...(user.role === 'Admin'
      ? [
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: 'Admin Panel',
          },
        ]
      : []),
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Log out',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#001529',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            C
          </div>
          Cosmos
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{ minWidth: 320, background: 'transparent' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Tooltip title="Direct Messages">
          <Button
            type="text"
            icon={<MessageOutlined style={{ color: '#fff', fontSize: 18 }} />}
            onClick={() => setIsDMsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Tooltip>

        <Tag color={roleColors[user.role]} style={{ fontWeight: 600 }}>
          {user.role}
        </Tag>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
              height: 40,
              padding: '0 8px',
            }}
          >
            <Space>
              <Badge status="success" dot offset={[-4, 28]}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              </Badge>
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name.split(' ')[0]}
              </span>
            </Space>
          </Button>
        </Dropdown>
      </div>

      <DirectChatDrawer open={isDMsOpen} onClose={() => setIsDMsOpen(false)} />
    </Header>
  );
};

export default Navbar;
