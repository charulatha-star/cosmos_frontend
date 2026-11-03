import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, Space, Tag } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

const { Title, Text, Paragraph } = Typography;

interface LoginFormValues {
  email: string;
  password?: string;
}

export const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, loginAsMock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Failed to connect to backend auth server. You can use Quick Test Login below.';
      setErrorMessage(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = (role: UserRole) => {
    loginAsMock(role);
    navigate(from, { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            C
          </div>
          <Title level={3} style={{ margin: 0 }}>Cosmos Virtual Office</Title>
          <Text type="secondary">Sign in with your company credentials</Text>
        </div>

        {errorMessage && (
          <Alert
            message="Sign In Notice"
            description={errorMessage}
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 20 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your work email' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="name@yourcompany.com" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<LoginOutlined />}
              style={{ height: 44, fontSize: 16 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <SafetyCertificateOutlined /> Quick Test Login (Step 1 Dev Mode)
          </Text>
        </Divider>

        <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
          Test client-side role permissions before connecting the live backend:
        </Paragraph>

        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button block onClick={() => handleMockLogin('Admin')}>
            <Space>
              <Tag color="volcano">Admin</Tag>
              <span>Login as Sarah Connor</span>
            </Space>
          </Button>

          <Button block onClick={() => handleMockLogin('Employee')}>
            <Space>
              <Tag color="blue">Employee</Tag>
              <span>Login as Alex Rivera</span>
            </Space>
          </Button>

          <Button block onClick={() => handleMockLogin('Guest')}>
            <Space>
              <Tag color="gold">Guest</Tag>
              <span>Login as External Guest</span>
            </Space>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
