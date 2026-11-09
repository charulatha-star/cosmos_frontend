import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, Avatar, Tag, Space, Empty } from 'antd';
import { SendOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import type { Message } from '../types';

interface InRoomChatDrawerProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onNewMessageReceived?: () => void;
}

export const InRoomChatDrawer: React.FC<InRoomChatDrawerProps> = ({
  open,
  onClose,
  roomId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history from backend and poll every 3 seconds while open
  useEffect(() => {
    if (!open || !roomId) return;

    let isSubscribed = true;

    const fetchMessages = async () => {
      try {
        const data = await chatApi.getRoomMessages(roomId);
        if (isSubscribed && data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load room messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [open, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !roomId) return;

    setSending(true);
    setInputText('');

    try {
      const newMsg = await chatApi.sendRoomMessage(roomId, text);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send room message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <span>Meeting Chat</span>
          <Tag color="cyan">In-Room</Tag>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={380}
      styles={{
        body: {
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#0f172a',
        },
      }}
    >
      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingRight: 6,
        }}
      >
        {messages.length === 0 ? (
          <Empty description={<span style={{ color: '#94a3b8' }}>No messages yet in this room</span>} style={{ margin: 'auto' }} />
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id || msg.sender_name === user?.name || msg.sender_name === 'You';
            const isBot = msg.sender_id === 'sys';
            const timeStr = msg.timestamp || (msg as any).created_at;

            if (isBot) {
              return (
                <div
                  key={msg.id}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px dashed #38bdf8',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#7dd3fc',
                    textAlign: 'center',
                  }}
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  {!isMe && (
                    <Avatar
                      size={20}
                      style={{ backgroundColor: '#722ed1', fontSize: 10 }}
                      icon={<UserOutlined />}
                    >
                      {msg.sender_name ? msg.sender_name[0].toUpperCase() : 'U'}
                    </Avatar>
                  )}
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                    {isMe ? 'You' : msg.sender_name}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>
                    <ClockCircleOutlined style={{ fontSize: 9 }} /> {formatTime(timeStr)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe ? '#1677ff' : '#1e293b',
                    color: '#ffffff',
                    fontSize: 13,
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    border: isMe ? 'none' : '1px solid #334155',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & Send Bar */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid #334155',
          display: 'flex',
          gap: 8,
        }}
      >
        <Input
          placeholder="Send a message to everyone..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPressEnter={handleSendMessage}
          size="middle"
          disabled={sending}
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            color: '#fff',
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={sending}
        />
      </div>
    </Drawer>
  );
};

export default InRoomChatDrawer;
