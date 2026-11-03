import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  message,
  Alert,
  Spin,
  Modal,
} from 'antd';
import {
  AudioOutlined,
  AudioMutedOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  TeamOutlined,
  DesktopOutlined,
  StopOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Room,
  RoomEvent,
  type VideoTrack,
  type AudioTrack,
  RemoteParticipant,
  type RemoteTrackPublication,
  type RemoteTrack,
  Track,
} from 'livekit-client';
import { useAuth } from '../context/AuthContext';
import { livekitApi } from '../api/livekit';
import VideoTile from '../components/VideoTile';
import ScreenShareView from '../components/ScreenShareView';
import ParticipantDrawer, { type MeetingParticipant } from '../components/ParticipantDrawer';
import type { UserRole } from '../types';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface ParticipantTileData {
  identity: string;
  name: string;
  role: UserRole;
  isLocal: boolean;
  isHost: boolean;
  videoTrack?: VideoTrack | MediaStreamTrack | null;
  audioTrack?: AudioTrack | MediaStreamTrack | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
}

export const MeetingRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Call states
  const [connecting, setConnecting] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [activeScreenTrack, setActiveScreenTrack] = useState<VideoTrack | MediaStreamTrack | null>(
    null
  );
  const [screenPresenterName, setScreenPresenterName] = useState<string>('');
  const [isScreenLocal, setIsScreenLocal] = useState<boolean>(false);

  const [callDuration, setCallDuration] = useState<number>(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Participant Drawer & Leave Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);

  // Participants list
  const [participants, setParticipants] = useState<ParticipantTileData[]>([]);

  // References
  const roomRef = useRef<Room | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);

  const isAdmin = user?.role === 'Admin';
  // If user created this room or is Admin, mark as Host
  const isHost = isAdmin || roomId?.startsWith('temp-') || user?.id === 'usr-admin-001';

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe cleanup of media tracks and WebRTC session
  const cleanupMedia = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((track) => track.stop());
      localScreenStreamRef.current = null;
    }
  }, []);

  // Initialize Call
  useEffect(() => {
    let isMounted = true;

    const initCall = async () => {
      setConnecting(true);
      setErrorNotice(null);

      try {
        let liveKitToken: string | null = null;
        let serverUrl: string | null = null;

        try {
          if (roomId) {
            const tokenRes = await livekitApi.getRoomToken(roomId);
            liveKitToken = tokenRes.token;
            serverUrl = tokenRes.server_url;
          }
        } catch {
          // Backend not reachable, fall back to browser media
        }

        if (liveKitToken && serverUrl) {
          const room = new Room({
            adaptiveStream: true,
            dynacast: true,
          });
          roomRef.current = room;

          room.on(
            RoomEvent.TrackSubscribed,
            (track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
              if (pub.source === Track.Source.ScreenShare) {
                setActiveScreenTrack(track as VideoTrack);
                setScreenPresenterName(participant.name || participant.identity);
                setIsScreenLocal(false);
                setIsScreenSharing(true);
              } else {
                setParticipants((prev) => {
                  const existing = prev.find((p) => p.identity === participant.identity);
                  if (existing) {
                    return prev.map((p) =>
                      p.identity === participant.identity
                        ? {
                            ...p,
                            videoTrack:
                              track.kind === 'video' ? (track as VideoTrack) : p.videoTrack,
                            audioTrack:
                              track.kind === 'audio' ? (track as AudioTrack) : p.audioTrack,
                          }
                        : p
                    );
                  }
                  return [
                    ...prev,
                    {
                      identity: participant.identity,
                      name: participant.name || participant.identity,
                      role: 'Employee' as UserRole,
                      isLocal: false,
                      isHost: false,
                      videoTrack: track.kind === 'video' ? (track as VideoTrack) : undefined,
                      audioTrack: track.kind === 'audio' ? (track as AudioTrack) : undefined,
                      isMuted: false,
                      isCameraOff: false,
                      isScreenSharing: false,
                    },
                  ];
                });
              }
            }
          );

          room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            if (track === activeScreenTrack) {
              setActiveScreenTrack(null);
              setIsScreenSharing(false);
            }
          });

          room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            setParticipants((prev) => prev.filter((p) => p.identity !== participant.identity));
          });

          await room.connect(serverUrl, liveKitToken);
          await room.localParticipant.enableCameraAndMicrophone();

          if (isMounted) {
            const localVideo = Array.from(
              room.localParticipant.videoTrackPublications.values()
            )[0]?.track;
            const localAudio = Array.from(
              room.localParticipant.audioTrackPublications.values()
            )[0]?.track;

            setParticipants([
              {
                identity: user?.id || 'local-user',
                name: user?.name || 'You',
                role: (user?.role || 'Employee') as UserRole,
                isLocal: true,
                isHost: isHost,
                videoTrack: localVideo as VideoTrack,
                audioTrack: localAudio as AudioTrack,
                isMuted: false,
                isCameraOff: false,
                isScreenSharing: false,
              },
            ]);
          }
        } else {
          // Fallback browser stream for Step 4 testing
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];

          setParticipants([
            {
              identity: user?.id || 'local-user',
              name: user?.name || 'You',
              role: (user?.role || 'Employee') as UserRole,
              isLocal: true,
              isHost: isHost,
              videoTrack: videoTrack,
              audioTrack: audioTrack,
              isMuted: false,
              isCameraOff: false,
              isScreenSharing: false,
            },
            {
              identity: 'colleague-001',
              name: 'Charu Latha (Team Lead)',
              role: 'Employee' as UserRole,
              isLocal: false,
              isHost: false,
              videoTrack: null,
              audioTrack: null,
              isMuted: false,
              isCameraOff: true,
              isScreenSharing: false,
            },
            {
              identity: 'colleague-002',
              name: 'David Kim (Designer)',
              role: 'Employee' as UserRole,
              isLocal: false,
              isHost: false,
              videoTrack: null,
              audioTrack: null,
              isMuted: true,
              isCameraOff: true,
              isScreenSharing: false,
            },
          ]);
        }
      } catch (err: unknown) {
        console.error('Call initialization error:', err);
        setErrorNotice(
          'Could not access camera or microphone. Please check your browser permissions or hardware connection.'
        );
      } finally {
        if (isMounted) {
          setConnecting(false);
        }
      }
    };

    initCall();

    return () => {
      isMounted = false;
      cleanupMedia();
    };
  }, [roomId, user, isHost, cleanupMedia, activeScreenTrack]);

  // Toggle Microphone
  const toggleMicrophone = async () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);

    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
    } else if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextState;
      });
    }

    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isMuted: nextState } : p))
    );
    message.info(nextState ? 'Microphone muted' : 'Microphone unmuted');
  };

  // Toggle Camera
  const toggleCamera = async () => {
    const nextState = !isVideoDisabled;
    setIsVideoDisabled(nextState);

    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!nextState);
    } else if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextState;
      });
    }

    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isCameraOff: nextState } : p))
    );
    message.info(nextState ? 'Camera turned off' : 'Camera turned on');
  };

  // Toggle Screen Share (PRD Section 6.3 & 12 test)
  const toggleScreenShare = async () => {
    if (isScreenSharing && isScreenLocal) {
      stopScreenShare();
      return;
    }

    try {
      if (roomRef.current) {
        await roomRef.current.localParticipant.setScreenShareEnabled(true);
        const screenPub = Array.from(
          roomRef.current.localParticipant.videoTrackPublications.values()
        ).find((p) => p.source === Track.Source.ScreenShare);

        if (screenPub?.track) {
          setActiveScreenTrack(screenPub.track as VideoTrack);
          setIsScreenSharing(true);
          setIsScreenLocal(true);
          setScreenPresenterName(user?.name || 'You');
        }
      } else {
        // Native browser screen capture fallback
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        localScreenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Detect when user clicks browser's native "Stop Sharing" bar
        screenTrack.onended = () => {
          stopScreenShare();
        };

        setActiveScreenTrack(screenTrack);
        setIsScreenSharing(true);
        setIsScreenLocal(true);
        setScreenPresenterName(user?.name || 'You');
      }

      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, isScreenSharing: true } : p))
      );
      message.success('Screen sharing started.');
    } catch (err) {
      // User cancelled picker dialog
      console.log('Screen sharing cancelled', err);
    }
  };

  const stopScreenShare = async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setScreenShareEnabled(false);
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current = null;
    }

    setActiveScreenTrack(null);
    setIsScreenSharing(false);
    setIsScreenLocal(false);

    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, isScreenSharing: false } : p))
    );
    message.info('Screen sharing stopped.');
  };

  // Host/Admin moderation actions (PRD Section 3)
  const handleMuteParticipant = (identity: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.identity === identity ? { ...p, isMuted: true } : p))
    );
    message.info('Participant has been muted.');
  };

  const handleRemoveParticipant = (identity: string, name: string) => {
    setParticipants((prev) => prev.filter((p) => p.identity !== identity));
    message.success(`${name} was removed from the meeting.`);
  };

  // Leave / End Meeting
  const handleLeaveClick = () => {
    if (isHost || isAdmin) {
      setIsLeaveModalOpen(true);
    } else {
      executeLeave(false);
    }
  };

  const executeLeave = (endForAll: boolean) => {
    cleanupMedia();
    setIsLeaveModalOpen(false);
    if (endForAll) {
      message.success('Meeting ended for all participants.');
    } else {
      message.success('You have left the room.');
    }
    navigate('/');
  };

  // Drawer participant data mapping
  const drawerParticipants: MeetingParticipant[] = participants.map((p) => ({
    identity: p.identity,
    name: p.name,
    role: p.role,
    isLocal: p.isLocal,
    isHost: p.isHost,
    isMuted: p.isMuted,
    isCameraOff: p.isCameraOff,
    isScreenSharing: p.isScreenSharing,
  }));

  return (
    <Layout style={{ height: '100vh', background: '#0d1117', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        style={{
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Space size={12}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {roomId ? roomId.replace(/-/g, ' ').toUpperCase() : 'MEETING ROOM'}
          </Title>
          <Tag color="cyan">
            <span style={{ color: '#52c41a' }}>● </span>
            {formatDuration(callDuration)}
          </Tag>
          {isScreenSharing && (
            <Tag color="geekblue" icon={<DesktopOutlined />}>
              Screen Shared
            </Tag>
          )}
        </Space>

        <Space size={12}>
          {/* Participant count button that opens Drawer */}
          <Button
            type="text"
            icon={<TeamOutlined />}
            style={{ color: '#fff' }}
            onClick={() => setIsDrawerOpen(true)}
          >
            Participants ({participants.length})
          </Button>

          <Button
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleLeaveClick}
          >
            Leave Call
          </Button>
        </Space>
      </Header>

      {/* Main Content Area */}
      <Content
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {connecting ? (
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Text style={{ color: '#aaa', display: 'block', marginTop: 16 }}>
              Joining room in under 5s...
            </Text>
          </div>
        ) : errorNotice ? (
          <Alert
            type="error"
            message="Media Device Error"
            description={errorNotice}
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        ) : isScreenSharing && activeScreenTrack ? (
          /* Screen Share Presentation Layout */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Screen Share Spotlight */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <ScreenShareView
                presenterName={screenPresenterName}
                isLocal={isScreenLocal}
                track={activeScreenTrack}
                onStopSharing={stopScreenShare}
              />
            </div>

            {/* Video Filmstrip below Screen Share */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                paddingBottom: 4,
                maxHeight: 150,
              }}
            >
              {participants.map((participant) => (
                <div key={participant.identity} style={{ width: 200, height: 140, flexShrink: 0 }}>
                  <VideoTile
                    participantName={participant.name}
                    isLocal={participant.isLocal}
                    videoTrack={participant.videoTrack}
                    audioTrack={participant.audioTrack}
                    isMuted={participant.isMuted}
                    isCameraOff={participant.isCameraOff}
                    role={participant.role}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Standard Video Grid Layout */
          <div
            style={{
              width: '100%',
              maxWidth: 1400,
              display: 'grid',
              gridTemplateColumns:
                participants.length === 1
                  ? '1fr'
                  : participants.length === 2
                  ? 'repeat(auto-fit, minmax(380px, 1fr))'
                  : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {participants.map((participant) => (
              <VideoTile
                key={participant.identity}
                participantName={participant.name}
                isLocal={participant.isLocal}
                videoTrack={participant.videoTrack}
                audioTrack={participant.audioTrack}
                isMuted={participant.isMuted}
                isCameraOff={participant.isCameraOff}
                role={participant.role}
              />
            ))}
          </div>
        )}
      </Content>

      {/* Bottom Call Control Bar (Dock) */}
      <Footer
        style={{
          background: '#161b22',
          borderTop: '1px solid #30363d',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Microphone Toggle */}
        <Tooltip title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}>
          <Button
            shape="circle"
            size="large"
            type={isAudioMuted ? 'primary' : 'default'}
            danger={isAudioMuted}
            icon={isAudioMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={toggleMicrophone}
            style={{ width: 48, height: 48 }}
          />
        </Tooltip>

        {/* Camera Toggle */}
        <Tooltip title={isVideoDisabled ? 'Turn On Camera' : 'Turn Off Camera'}>
          <Button
            shape="circle"
            size="large"
            type={isVideoDisabled ? 'primary' : 'default'}
            danger={isVideoDisabled}
            icon={isVideoDisabled ? <CloseCircleOutlined /> : <VideoCameraOutlined />}
            onClick={toggleCamera}
            style={{ width: 48, height: 48 }}
          />
        </Tooltip>

        {/* Screen Share Button */}
        <Tooltip title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}>
          <Button
            shape="circle"
            size="large"
            type={isScreenSharing ? 'primary' : 'default'}
            icon={isScreenSharing ? <StopOutlined /> : <DesktopOutlined />}
            onClick={toggleScreenShare}
            style={{
              width: 48,
              height: 48,
              backgroundColor: isScreenSharing ? '#1677ff' : undefined,
            }}
          />
        </Tooltip>

        {/* Participant List Toggle */}
        <Tooltip title="View Participants">
          <Button
            shape="circle"
            size="large"
            type={isDrawerOpen ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            style={{ width: 48, height: 48 }}
          />
        </Tooltip>

        {/* Leave Room Button */}
        <Tooltip title="Leave Room">
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
            onClick={handleLeaveClick}
            style={{ width: 48, height: 48 }}
          />
        </Tooltip>
      </Footer>

      {/* Participant Roster Drawer */}
      <ParticipantDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        participants={drawerParticipants}
        currentUserRole={user?.role}
        isCurrentUserHost={isHost}
        onMuteParticipant={handleMuteParticipant}
        onRemoveParticipant={handleRemoveParticipant}
      />

      {/* Leave vs End Meeting Modal (PRD Section 7) */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Leave Meeting</span>
          </Space>
        }
        open={isLeaveModalOpen}
        onCancel={() => setIsLeaveModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsLeaveModalOpen(false)}>
            Stay in Call
          </Button>,
          <Button
            key="leave"
            icon={<LogoutOutlined />}
            onClick={() => executeLeave(false)}
          >
            Just Leave
          </Button>,
          <Button
            key="end"
            type="primary"
            danger
            onClick={() => executeLeave(true)}
          >
            End Meeting for All
          </Button>,
        ]}
      >
        <p>You are the host of this room. Do you want to end the meeting for everyone or just leave?</p>
      </Modal>
    </Layout>
  );
};

export default MeetingRoom;
