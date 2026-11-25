import React, { useState, useEffect } from 'react';
import { Input, Button, Tag, Dropdown, Avatar, Checkbox, message } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, DownOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spacesApi } from '../api/spaces';
import { getAvatarUrl } from '../components/CosmosProfileStatusModal';

export const SetupInvite: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [emailChips, setEmailChips] = useState<string[]>([
    user?.email || 'charulatha@billiontags.co',
    'uma@billiontags.co',
  ]);
  const [emailInput, setEmailInput] = useState<string>('');
  const [allowLinkJoin, setAllowLinkJoin] = useState<boolean>(true);
  const [inviteCode, setInviteCode] = useState<string>('l0UrT1AXIBV1v2d5aaRdR7W0nqWrskLQwLvaZJLy5U');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!spaceId) return;
    const fetchInvite = async () => {
      try {
        const info = await spacesApi.getInviteInfo(spaceId);
        if (info.invite_code) {
          setInviteCode(info.invite_code);
          setAllowLinkJoin(info.allow_link_join);
        }
      } catch {
        // Local fallback
      }
    };
    fetchInvite();
  }, [spaceId]);

  const handleAddEmail = () => {
    const raw = emailInput.trim();
    if (!raw) return;
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    setEmailChips((prev) => Array.from(new Set([...prev, ...parts])));
    setEmailInput('');
  };

  const handleRemoveChip = (target: string) => {
    setEmailChips((prev) => prev.filter((e) => e !== target));
  };

  const shareableUrl = `${window.location.origin}/invite/${inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareableUrl);
    message.success('Invite link copied to clipboard!');
  };

  const handleToggleAllowLink = async (checked: boolean) => {
    setAllowLinkJoin(checked);
    if (spaceId) {
      try {
        await spacesApi.updateInviteSettings(spaceId, checked);
      } catch {}
    }
  };

  const handleGoToOffice = async () => {
    if (spaceId && emailChips.length > 0) {
      try {
        setLoading(true);
        await spacesApi.addMembers(spaceId, emailChips, 'Member');
      } catch {
        // Proceed anyway
      } finally {
        setLoading(false);
      }
    }
    navigate(`/v/${spaceId || 'billion'}/office`);
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
      {/* Top Navbar matching Cosmos Screenshot 4 */}
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

      {/* Main Body matching Screenshot 4 */}
      <main
        style={{
          flex: 1,
          maxWidth: 680,
          width: '100%',
          margin: '0 auto',
          padding: '60px 24px',
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: 36,
            letterSpacing: '-0.5px',
          }}
        >
          Add team members
        </h1>

        {/* 1. Invite people by email */}
        <div style={{ marginBottom: 36 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 12,
            }}
          >
            Invite people by email
          </label>

          {/* Email Chips Box */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {emailChips.map((em) => (
              <div
                key={em}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#334155',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <span>{em}</span>
                <CloseOutlined
                  onClick={() => handleRemoveChip(em)}
                  style={{ fontSize: 10, color: '#94a3b8', cursor: 'pointer' }}
                />
              </div>
            ))}
          </div>

          {/* Textarea for additional emails */}
          <Input.TextArea
            rows={3}
            placeholder="teammate@gmail.com, another@gmail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onBlur={handleAddEmail}
            onPressEnter={(e) => {
              e.preventDefault();
              handleAddEmail();
            }}
            style={{
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 14,
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
            }}
          />
        </div>

        {/* 2. Invite people by link */}
        <div style={{ marginBottom: 40 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 12,
            }}
          >
            Invite people by link
          </label>

          <Checkbox
            checked={allowLinkJoin}
            onChange={(e) => handleToggleAllowLink(e.target.checked)}
            style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', marginBottom: 12 }}
          >
            Allow anyone to join via an invite link
          </Checkbox>

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Share this link with your team to invite them to your office:
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 14px',
              gap: 10,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: 'monospace',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shareableUrl}
            </span>
            <CopyOutlined
              onClick={handleCopyLink}
              style={{ fontSize: 16, color: '#475569', cursor: 'pointer' }}
              title="Copy invite link"
            />
          </div>
        </div>

        {/* Action Button */}
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleGoToOffice}
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
          Go to your Office →
        </Button>
      </main>
    </div>
  );
};

export default SetupInvite;
