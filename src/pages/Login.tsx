import React, { useState } from 'react';
import { Button, Card, Typography, Space, Input, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('kuma1412002@gmail.com');
  const [name, setName] = useState<string>('Guest 470');
  const [loading, setLoading] = useState<boolean>(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(email, name);
      navigate('/dashboard', { replace: true });
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
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          O
        </div>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
          COSMOS
        </span>
      </div>

      <Card
        style={{
          width: 440,
          borderRadius: 16,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          padding: '16px 8px',
          textAlign: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          Sign in to Cosmos Video
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 28, fontSize: 14 }}>
          Enter your workspace and persistent virtual office
        </Paragraph>

        {/* Google Sign In Button */}
        <Button
          type="default"
          size="large"
          block
          loading={loading}
          onClick={handleGoogleLogin}
          style={{
            height: 50,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            fontSize: 15,
            fontWeight: 600,
            color: '#1e293b',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: 20,
          }}
        >
          {/* Authentic Google Multi-color G Icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Continue with Google
        </Button>

        <Divider style={{ margin: '16px 0', fontSize: 12, color: '#94a3b8' }}>
          Customize Account (Optional)
        </Divider>

        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div style={{ textAlign: 'left' }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Google Email</Text>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              style={{ marginTop: 4, height: 40 }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <Text style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Display Name</Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Guest 470"
              style={{ marginTop: 4, height: 40 }}
            />
          </div>
        </Space>

        <div style={{ marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
          By continuing, you agree to Cosmos Terms of Service & Privacy Policy.
        </div>
      </Card>
    </div>
  );
};

export default Login;
