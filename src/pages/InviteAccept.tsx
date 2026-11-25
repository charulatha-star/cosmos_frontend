import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Tag, Modal, message } from 'antd';
import {
  VideoCameraOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { spacesApi } from '../api/spaces';

interface InviteAcceptProps {
  isGuestRoom?: boolean;
}

export const InviteAccept: React.FC<InviteAcceptProps> = ({ isGuestRoom: propIsGuestRoom }) => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, setGuestSession } = useAuth();
  const navigate = useNavigate();

  // Determine invitation mode: Guest Room Invitation vs Office Invitation
  const roomParam = searchParams.get('room');
  const isGuestRoom =
    Boolean(propIsGuestRoom) ||
    location.pathname.includes('/guest/') ||
    Boolean(roomParam);

  const [spaceInfo, setSpaceInfo] = useState<any>(null);
  const [guestRoomInfo, setGuestRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [guestName, setGuestName] = useState<string>('');
  const [joining, setJoining] = useState<boolean>(false);

  // Camera & Mic Permissions (Cosmos Image 3 Match)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(false);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!inviteCode) return;
    const checkInvite = async () => {
      try {
        setLoading(true);
        if (isGuestRoom) {
          const roomToValidate = roomParam || 'meeting-1';
          const data = await spacesApi.validateGuestRoomInvite(inviteCode, roomToValidate);
          setGuestRoomInfo(data);
          setSpaceInfo({
            space_id: data.space_id,
            space_name: data.space_name,
          });
        } else {
          const data = await spacesApi.validateInvite(inviteCode);
          setSpaceInfo(data);
        }
      } catch (err: any) {
        message.error(err?.response?.data?.detail || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    checkInvite();
  }, [inviteCode, isGuestRoom, roomParam]);

  // Handle granting media permissions (Matching Cosmos Image 3)
  const handleEnableMedia = async () => {
    setShowPermissionPrompt(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      setLocalStream(stream);
      setIsCameraEnabled(true);
      setIsMicEnabled(true);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      message.success('Camera and microphone enabled!');
    } catch (err) {
      console.warn('Could not acquire media stream:', err);
      setIsCameraEnabled(false);
      setIsMicEnabled(false);
      message.info('Continuing with camera and microphone off.');
    }
  };

  const handleSkipMedia = () => {
    setShowPermissionPrompt(false);
    setIsCameraEnabled(false);
    setIsMicEnabled(false);
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraEnabled && localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = false));
      setIsCameraEnabled(false);
    } else {
      try {
        let stream = localStream;
        if (!stream || stream.getVideoTracks().length === 0) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicEnabled });
          setLocalStream(stream);
        } else {
          stream.getVideoTracks().forEach((t) => (t.enabled = true));
        }
        setIsCameraEnabled(true);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      } catch {
        message.warning('Camera device not available or blocked in browser');
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStream && localStream.getAudioTracks().length > 0) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !isMicEnabled));
    }
    setIsMicEnabled(!isMicEnabled);
  };

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  // Office Invitation: Logged in team member joins
  const handleJoinOfficeLoggedIn = async () => {
    if (!inviteCode) return;
    try {
      setJoining(true);
      const res = await spacesApi.joinViaInvite(inviteCode);
      sessionStorage.removeItem('cosmos_pending_invite');
      message.success(`Welcome to ${spaceInfo?.space_name || 'the office'}!`);
      const gallery = searchParams.get('gallery') === 'true' ? '?gallery=true' : '';
      navigate(`/v/${res.space_id}/office${gallery}`);
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to join space');
    } finally {
      setJoining(false);
    }
  };

  // Office Invitation: Unauthenticated colleague redirected to login
  const handleRedirectToLogin = () => {
    if (inviteCode) {
      sessionStorage.setItem('cosmos_pending_invite', inviteCode);
    }
    navigate('/login');
  };

  // Guest Room Invitation: External guest enters directly without account/login (Cosmos Image 3 & 5 Match)
  const handleJoinGuestRoom = async () => {
    if (!inviteCode) return;
    const trimmed = guestName.trim() || `Guest ${Math.floor(100 + Math.random() * 900)}`;
    const roomId = guestRoomInfo?.room_id || roomParam || 'meeting-1';

    try {
      setJoining(true);
      const res = await spacesApi.joinGuestRoom(inviteCode, roomId, trimmed);

      // Save guest session directly into AuthContext & LocalStorage
      if (res.tokens && res.user) {
        setGuestSession(res.tokens, res.user);
      }

      // Save media intent
      localStorage.setItem('cosmos_initial_camera', isCameraEnabled ? 'true' : 'false');
      localStorage.setItem('cosmos_initial_mic', isMicEnabled ? 'true' : 'false');

      // Stop local preview tracks so OfficeSpace can take over devices cleanly
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }

      message.success(`Entering ${guestRoomInfo?.room_name || 'Meeting Room'} as ${trimmed}!`);
      // Directly navigate into the office without hitting login!
      navigate(`/v/${res.space_id}/office?room=${roomId}&guest=true`, { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to enter guest room');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: 60,
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {spaceInfo?.space_name || 'COSMOS'}
          </span>
        </div>

        <div>
          {!user && (
            <Button
              type="text"
              onClick={() => navigate('/login')}
              style={{ fontWeight: 600, color: '#475569' }}
            >
              Log In
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        {isGuestRoom ? (
          /* =========================================================================
             2. GUEST ROOM INVITATION (Cosmos Image 3 Match: Video Preview + Quick Name)
             ========================================================================= */
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 36,
              maxWidth: 920,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              padding: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Left Column: Live Camera Video Preview */}
            <div style={{ flex: '1 1 380px', maxWidth: 440 }}>
              <div
                style={{
                  width: '100%',
                  height: 280,
                  backgroundColor: '#0f172a',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {/* Live video feed */}
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: isCameraEnabled ? 'block' : 'none',
                    transform: 'scaleX(-1)', // Mirror preview
                  }}
                />

                {/* Camera off placeholder */}
                {!isCameraEnabled && (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        backgroundColor: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto',
                        color: '#64748b',
                        fontSize: 28,
                      }}
                    >
                      {guestName ? guestName.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Camera is off</div>
                  </div>
                )}

                {/* Bottom Overlay Controls on Camera Card */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    display: 'flex',
                    gap: 12,
                    zIndex: 10,
                  }}
                >
                  <Button
                    shape="circle"
                    size="large"
                    onClick={toggleMic}
                    icon={isMicEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
                    style={{
                      backgroundColor: isMicEnabled ? '#ffffff' : '#ef4444',
                      color: isMicEnabled ? '#0f172a' : '#ffffff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  />
                  <Button
                    shape="circle"
                    size="large"
                    onClick={toggleCamera}
                    icon={isCameraEnabled ? <VideoCameraOutlined /> : <StopOutlined />}
                    style={{
                      backgroundColor: isCameraEnabled ? '#ffffff' : '#ef4444',
                      color: isCameraEnabled ? '#0f172a' : '#ffffff',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              </div>

              {/* Status details below preview */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 14,
                  fontSize: 12,
                  color: '#64748b',
                  padding: '0 4px',
                }}
              >
                <span>Microphone: {isMicEnabled ? '🟢 Enabled' : '🔴 Muted'}</span>
                <span>Camera: {isCameraEnabled ? '🟢 Enabled' : '🔴 Off'}</span>
              </div>
            </div>

            {/* Right Column: Name Input & Instant Space Entry */}
            <div style={{ flex: '1 1 340px', maxWidth: 400 }}>
              <Tag
                color="orange"
                style={{
                  borderRadius: 12,
                  padding: '2px 10px',
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                Guest Access
              </Tag>

              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {guestRoomInfo?.room_name || 'Meeting Room'}
              </h1>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
                A designated room in <strong>{spaceInfo?.space_name}</strong>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 8,
                  }}
                >
                  Enter your name
                </label>
                <Input
                  size="large"
                  placeholder="e.g. Swathi Guest"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onPressEnter={handleJoinGuestRoom}
                  style={{
                    borderRadius: 10,
                    height: 48,
                    fontSize: 15,
                    border: '1.5px solid #cbd5e1',
                  }}
                />
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={joining}
                onClick={handleJoinGuestRoom}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  height: 50,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                }}
              >
                Enter Space →
              </Button>

              <div
                style={{
                  marginTop: 16,
                  fontSize: 12,
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                🔒 Guests enter directly without registering. Access is limited to this room.
              </div>
            </div>

            {/* Cosmos Media Permission Modal (Exact Cosmos Image 3 Match) */}
            <Modal
              open={showPermissionPrompt}
              footer={null}
              closable={true}
              onCancel={handleSkipMedia}
              width={420}
              centered
              styles={{ body: { padding: '24px 20px', textAlign: 'center' } }}
            >
              {/* Visual illustration banner matching Image 3 */}
              <div
                style={{
                  backgroundColor: '#eef2ff',
                  borderRadius: 16,
                  padding: '24px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  👋
                </div>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Do you want people to see and hear you?
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                You can turn off your camera and microphone at any time once inside the room.
              </p>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleEnableMedia}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  height: 46,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  marginBottom: 12,
                }}
              >
                Use camera and microphone
              </Button>

              <Button
                type="text"
                block
                onClick={handleSkipMedia}
                style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}
              >
                Continue without camera and microphone
              </Button>
            </Modal>
          </div>
        ) : (
          /* =========================================================================
             1. OFFICE INVITATION (Friends & Colleagues)
             ========================================================================= */
          <Card
            style={{
              width: '100%',
              maxWidth: 480,
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              padding: '24px 12px',
            }}
            loading={loading}
          >
            {spaceInfo ? (
              <div>
                <Tag color="blue" style={{ borderRadius: 12, padding: '2px 12px', marginBottom: 12, fontWeight: 600 }}>
                  Office Membership Invitation
                </Tag>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  {spaceInfo.space_name}
                </h2>
                <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                  You have been invited to join this company virtual office as a regular team member ({spaceInfo.members_count || 1} teammates online).
                </div>

                {user ? (
                  <div>
                    <div
                      style={{
                        backgroundColor: '#f1f5f9',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 20,
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Joining as</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: '#475569' }}>{user.email}</div>
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={joining}
                      onClick={handleJoinOfficeLoggedIn}
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: 8,
                        height: 44,
                        fontSize: 15,
                        fontWeight: 700,
                        border: 'none',
                      }}
                    >
                      Join Office as Member →
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '16px',
                        marginBottom: 20,
                        fontSize: 13,
                        color: '#475569',
                        lineHeight: 1.5,
                      }}
                    >
                      Please sign in with your company account to accept this invitation and enter the virtual office.
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleRedirectToLogin}
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: 8,
                        height: 46,
                        fontSize: 15,
                        fontWeight: 700,
                        border: 'none',
                        marginBottom: 12,
                      }}
                    >
                      Sign In to Accept & Join Office →
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>Invalid Invite Link</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 8, marginBottom: 20 }}>
                  This invite link does not exist or has been disabled.
                </div>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
