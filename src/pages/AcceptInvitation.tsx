import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Spin, message } from 'antd';
import { TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spacesApi } from '../api/spaces';

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [invitationData, setInvitationData] = useState<{
    valid: boolean;
    token: string;
    space_id: string;
    space_name: string;
    email: string;
    role: string;
    invited_by?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No invitation token provided in the link.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        const data = await spacesApi.validateEmailInvitation(token);
        setInvitationData(data);
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.detail || 'This invitation is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      // Redirect to login preserving the invitation token
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      setAccepting(true);
      const res = await spacesApi.acceptEmailInvitation(token);
      message.success(`Welcome to ${res.space_name}! You've joined as a ${res.role}.`);
      navigate(`/v/${res.space_id}/office`);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to accept invitation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafaf9',
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 14 }}>
          Validating your invitation...
        </div>
      </div>
    );
  }

  if (errorMsg || !invitationData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafaf9',
          padding: 24,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
        }}
      >
        <Card
          style={{
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            padding: '24px 16px',
          }}
        >
          <CloseCircleOutlined style={{ fontSize: 52, color: '#ef4444', marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            Invitation Expired or Invalid
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
            {errorMsg || 'This invitation link is no longer valid or has already been accepted.'}
          </p>
          <Button
            type="primary"
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 8,
              height: 42,
              fontWeight: 700,
              padding: '0 24px',
            }}
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafaf9',
        padding: 24,
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 20,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          padding: '28px 20px',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div
            style={{
              width: 34,
              height: 34,
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

        <Avatar
          size={68}
          icon={<TeamOutlined style={{ fontSize: 32, color: '#0f172a' }} />}
          style={{ backgroundColor: '#f1f5f9', border: '2px solid #e2e8f0', marginBottom: 16 }}
        />

        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
          Join {invitationData.space_name}
        </h2>

        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
          {invitationData.invited_by || 'A teammate'} invited you to join the virtual office as an{' '}
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{invitationData.role}</span>.
        </div>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Invited Email:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {invitationData.email}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Assigned Role:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>
              {invitationData.role}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Space Access:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              All offices
            </span>
          </div>
        </div>

        {isAuthenticated ? (
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              Logged in as <strong style={{ color: '#0f172a' }}>{user?.email}</strong>
            </div>
            <Button
              type="primary"
              size="large"
              loading={accepting}
              onClick={handleAccept}
              icon={<CheckCircleOutlined />}
              style={{
                width: '100%',
                height: 46,
                backgroundColor: '#0f172a',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
              }}
            >
              Accept Invitation & Enter Office
            </Button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Please sign in to accept this invitation:
            </div>
            <Button
              type="primary"
              size="large"
              onClick={handleAccept}
              icon={<ArrowRightOutlined />}
              style={{
                width: '100%',
                height: 46,
                backgroundColor: '#0f172a',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
              }}
            >
              Sign In to Accept
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AcceptInvitation;
