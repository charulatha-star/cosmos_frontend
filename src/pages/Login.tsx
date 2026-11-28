import React, { useState } from 'react';
import { Button, Card, Typography, Input, Alert } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your work email address.');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login(cleanEmail, cleanPassword);
      const pendingInvite = sessionStorage.getItem('cosmos_pending_invite');
      if (pendingInvite) {
        navigate(`/invite/${pendingInvite}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Incorrect email or password. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* Cosmos Header Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 22,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
          }}
        >
          O
        </div>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
          COSMOS
        </span>
      </div>

      <Card
        style={{
          width: 440,
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          padding: '28px 24px',
          textAlign: 'left',
          background: '#ffffff',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            Sign in to Cosmos
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
            Enter your official company email and password
          </Paragraph>
        </div>

        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 20, borderRadius: 8, fontSize: 13 }}
          />
        )}

        <form onSubmit={handleSubmit}>
          {/* Work Email Input */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Work Email
            </label>
            <Input
              autoFocus
              size="large"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. charulatha@billiontags.co"
              prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 14,
                borderColor: '#cbd5e1',
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 26 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <Input.Password
              size="large"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter your password"
              prefix={<LockOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 14,
                borderColor: '#cbd5e1',
              }}
            />
          </div>

          {/* Sign In Button */}
          <Button
            type="primary"
            size="large"
            block
            htmlType="submit"
            loading={loading}
            style={{
              height: 48,
              borderRadius: 8,
              backgroundColor: '#0f172a',
              borderColor: '#0f172a',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Sign In <ArrowRightOutlined style={{ fontSize: 13 }} />
          </Button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: 12,
            color: '#64748b',
            lineHeight: 1.5,
          }}
        >
          Need an account or password reset? <br />
          <Text style={{ color: '#0f172a', fontWeight: 600 }}>
            Contact your Cosmos workspace administrator
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;

