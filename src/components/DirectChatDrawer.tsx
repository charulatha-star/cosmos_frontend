import React, { useState, useEffect, useRef } from 'react';
import { Drawer, List, Avatar, Input, Button, Space, Badge, Empty } from 'antd';
import { SendOutlined, MessageOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import type { Message, User } from '../types';

interface DirectChatDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedContact?: User | null;
}

export const DirectChatDrawer: React.FC<DirectChatDrawerProps> = ({
  open,
  onClose,
  selectedContact: initialContact,
}) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<User | null>(initialContact || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback initial team contacts if backend is offline
  const DEFAULT_TEAMMATES: User[] = [
    {
      id: 'c1',
      name: 'Charu Latha',
      email: 'charu.latha@billiontags.com',
      role: 'Employee',
      status: 'online',
    },
    {
      id: 'c2',
      name: 'Alex Rivera',
      email: 'alex.rivera@billiontags.com',
      role: 'Employee',
      status: 'online',
    },
    {
      id: 'c3',
      name: 'Sarah Connor',
      email: 'sarah.admin@billiontags.com',
      role: 'Admin',
      status: 'busy',
    },
  ];

  // Load office contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await chatApi.getContacts();
        if (data && data.length > 0) {
          setContacts(data);
          if (!activeContact) setActiveContact(data[0]);
        } else {
          setContacts(DEFAULT_TEAMMATES.filter((c) => c.email !== user?.email));
          if (!activeContact) setActiveContact(DEFAULT_TEAMMATES[0]);
        }
      } catch {
        setContacts(DEFAULT_TEAMMATES.filter((c) => c.email !== user?.email));
        if (!activeContact) setActiveContact(DEFAULT_TEAMMATES[0]);
      }
    };

    if (open) {
      fetchContacts();
    }
  }, [open, user]);

  useEffect(() => {
    if (initialContact) {
      setActiveContact(initialContact);
    }
  }, [initialContact]);

  // Load message thread with active contact
  useEffect(() => {
    const fetchDMs = async () => {
      if (!activeContact) return;
      try {
        const dms = await chatApi.getDirectMessages(activeContact.id);
        setMessages(dms);
      } catch {
        // Fallback demo thread
        setMessages([
          {
            id: 'dm-1',
            sender_id: activeContact.id,
            sender_name: activeContact.name,
            text: `Hey ${user?.name?.split(' ')[0] || 'there'}! Are you available to sync on the roadmap?`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            is_direct: true,
          },
        ]);
      }
    };

    if (open && activeContact) {
      fetchDMs();
    }
  }, [open, activeContact, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !activeContact) return;

    setInputText('');
    setLoading(true);

    try {
      try {
        const newMsg = await chatApi.sendDirectMessage(activeContact.id, text);
        setMessages((prev) => [...prev, newMsg]);
      } catch {
        const localMsg: Message = {
          id: `dm-${Date.now()}`,
          sender_id: user?.id || 'me',
          sender_name: user?.name || 'You',
          recipient_id: activeContact.id,
          text: text,
          timestamp: new Date().toISOString(),
          is_direct: true,
        };
        setMessages((prev) => [...prev, localMsg]);

        // Demo response after 2.5s
        setTimeout(() => {
          const reply: Message = {
            id: `reply-${Date.now()}`,
            sender_id: activeContact.id,
            sender_name: activeContact.name,
            text: 'Got it, let me check and get back to you in 5 minutes!',
            timestamp: new Date().toISOString(),
            is_direct: true,
          };
          setMessages((prev) => [...prev, reply]);
        }, 2200);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <MessageOutlined style={{ color: '#1677ff' }} />
          <span>Office Messages</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={440}
      styles={{
        body: { padding: 0, display: 'flex', height: '100%', overflow: 'hidden' },
      }}
    >
      {/* Left Teammates List */}
      <div
        style={{
          width: 140,
          borderRight: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
          TEAMMATES
        </div>
        <List
          dataSource={contacts}
          renderItem={(contact) => {
            const isSelected = activeContact?.id === contact.id;
            return (
              <div
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                style={{
                  padding: '10px 10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
                  borderLeft: isSelected ? '3px solid #0284c7' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background-color 0.15s',
                }}
              >
                <Badge
                  status={contact.status === 'online' ? 'success' : 'warning'}
                  dot
                  offset={[-2, 22]}
                >
                  <Avatar size={28} style={{ backgroundColor: '#1677ff', fontSize: 12 }}>
                    {contact.name[0]}
                  </Avatar>
                </Badge>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {contact.name.split(' ')[0]}
                  </div>
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Right Chat Thread */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          height: '100%',
        }}
      >
        {activeContact ? (
          <>
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Space>
                <Avatar style={{ backgroundColor: '#722ed1' }}>{activeContact.name[0]}</Avatar>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{activeContact.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    <span style={{ color: activeContact.status === 'online' ? '#22c55e' : '#f59e0b' }}>
                      ● {activeContact.status}
                    </span>{' '}
                    • {activeContact.role}
                  </div>
                </div>
              </Space>
            </div>

            {/* Messages Scroll */}
            <div
              style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id || msg.sender_name === user?.name || msg.sender_name === 'You';
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
                    <div
                      style={{
                        padding: '9px 13px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMe ? '#1677ff' : '#f1f5f9',
                        color: isMe ? '#ffffff' : '#0f172a',
                        fontSize: 13,
                        lineHeight: 1.4,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: 8,
              }}
            >
              <Input
                placeholder={`Message ${activeContact.name.split(' ')[0]}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={handleSend}
                disabled={loading}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} />
            </div>
          </>
        ) : (
          <Empty description="Select a teammate to chat" style={{ margin: 'auto' }} />
        )}
      </div>
    </Drawer>
  );
};

export default DirectChatDrawer;
