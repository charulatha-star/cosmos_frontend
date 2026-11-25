import React, { useState } from 'react';
import { Input, Button, Tag, Dropdown, Avatar, message } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, DownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spacesApi } from '../api/spaces';
import { getAvatarUrl } from '../components/CosmosProfileStatusModal';

export const SetupOffice: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState<string>('');
  const [teamSize, setTeamSize] = useState<'< 20' | '20 - 45' | '45+'>('< 20');
  const [style, setStyle] = useState<'Minimal' | 'Vibrant'>('Minimal');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateOffice = async () => {
    if (!teamName.trim()) {
      message.error('Please enter your team name');
      return;
    }

    try {
      setLoading(true);
      const res = await spacesApi.setupSpace({
        name: teamName.trim(),
        team_size: teamSize,
        style: style.toLowerCase(),
      });
      message.success('Office space created! Redirecting to manage members...');
      navigate(`/o/${res.space.id}/admin/manage-members`);
    } catch (err: any) {
      console.warn('Backend setup error:', err);
      const localSlug = teamName.trim().toLowerCase().replace(/\s+/g, '-');
      navigate(`/o/${localSlug}/admin/manage-members`);

    } finally {
      setLoading(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'email',
      disabled: true,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user?.name || 'Charulatha'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.email || 'charulatham312@gmail.com'}</div>
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
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* Top Navbar matching Cosmos Screenshot 3 */}
      <header
        style={{
          height: 64,
          padding: '0 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 15,
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

        {/* Marketing Links (Commented out per user request)
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
        */}

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <Avatar
              size={32}
              src={getAvatarUrl(user)}
              style={{ backgroundColor: '#fed7aa', border: '1px solid #fdba74' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {user?.name || 'Charulatha'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {user?.email || 'charulatham312@gmail.com'}
              </div>
            </div>
            <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
          </div>
        </Dropdown>
      </header>

      {/* Main Content Area matching Cosmos Screenshot 3 */}
      <main
        style={{
          flex: 1,
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
          padding: '60px 24px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 60,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Form */}
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: 32,
              letterSpacing: '-0.5px',
            }}
          >
            Set up your team
          </h1>

          {/* 1. Team Name Input */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: 10,
              }}
            >
              Team name
            </label>
            <Input
              size="large"
              placeholder="e.g. Acme Industries"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              style={{
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 15,
                border: '1.5px solid #cbd5e1',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            />
          </div>

          {/* 2. Team Size Selector */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: 10,
              }}
            >
              Team size
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                backgroundColor: '#f1f5f9',
                padding: 4,
                borderRadius: 10,
                gap: 4,
              }}
            >
              {(['< 20', '20 - 45', '45+'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTeamSize(size)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: teamSize === size ? '#ffffff' : 'transparent',
                    color: teamSize === size ? '#0f172a' : '#64748b',
                    boxShadow: teamSize === size ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Style Selector */}
          <div style={{ marginBottom: 36 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: 10,
              }}
            >
              Choose the style of your Cosmos space
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                backgroundColor: '#f1f5f9',
                padding: 4,
                borderRadius: 10,
                gap: 4,
              }}
            >
              {(['Minimal', 'Vibrant'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: style === s ? '#ffffff' : 'transparent',
                    color: style === s ? '#0f172a' : '#64748b',
                    boxShadow: style === s ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Action Button */}
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleCreateOffice}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 8,
              height: 48,
              padding: '0 28px',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            Create office →
          </Button>
        </div>

        {/* Right Column: Space Preview Blueprint */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: 10,
            }}
          >
            Space preview
          </label>
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              maxWidth: 380,
              backgroundColor: '#ffffff',
              borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* Blueprint Mini Map Rooms & Desks matching Screenshot 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, height: '100%' }}>
              {/* Meeting Room 1 */}
              <div
                style={{
                  border: `1.5px dashed ${style === 'Vibrant' ? '#ec4899' : '#94a3b8'}`,
                  borderRadius: 8,
                  backgroundColor: style === 'Vibrant' ? 'rgba(236,72,153,0.08)' : 'rgba(148,163,184,0.06)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>Room 1</div>
                <div style={{ width: 24, height: 12, backgroundColor: '#cbd5e1', borderRadius: 4, marginTop: 4 }} />
              </div>

              {/* Main Floor / Desks */}
              <div
                style={{
                  border: `1.5px dashed ${style === 'Vibrant' ? '#3b82f6' : '#94a3b8'}`,
                  borderRadius: 8,
                  backgroundColor: style === 'Vibrant' ? 'rgba(59,130,246,0.08)' : 'rgba(148,163,184,0.06)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>Open Desks</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <div style={{ width: 18, height: 14, backgroundColor: '#94a3b8', borderRadius: 3 }} />
                  <div style={{ width: 18, height: 14, backgroundColor: '#94a3b8', borderRadius: 3 }} />
                  <div style={{ width: 18, height: 14, backgroundColor: '#94a3b8', borderRadius: 3 }} />
                </div>
              </div>

              {/* Cafeteria / Lounge */}
              <div
                style={{
                  border: `1.5px dashed ${style === 'Vibrant' ? '#10b981' : '#94a3b8'}`,
                  borderRadius: 8,
                  backgroundColor: style === 'Vibrant' ? 'rgba(16,185,129,0.08)' : 'rgba(148,163,184,0.06)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gridColumn: 'span 2',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>Cafeteria & Lounge</div>
                <div style={{ width: 28, height: 16, borderRadius: '50%', backgroundColor: '#cbd5e1', marginTop: 4 }} />
              </div>

              {/* Meeting Room 2 */}
              <div
                style={{
                  border: `1.5px dashed ${style === 'Vibrant' ? '#f59e0b' : '#94a3b8'}`,
                  borderRadius: 8,
                  backgroundColor: style === 'Vibrant' ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.06)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#475569' }}>Room 2</div>
                <div style={{ width: 22, height: 12, backgroundColor: '#cbd5e1', borderRadius: 4, marginTop: 4 }} />
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                fontSize: 11,
                color: '#64748b',
                fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {teamSize} capacity • {style}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetupOffice;
