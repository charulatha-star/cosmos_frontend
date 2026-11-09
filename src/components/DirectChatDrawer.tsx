import React, { useState, useEffect, useRef } from 'react';
import { Drawer, List, Avatar, Input, Button, Space, Badge, Empty } from 'antd';
import { SendOutlined, MessageOutlined, SyncOutlined } from '@ant-design/icons';
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
  const [fetchingContacts, setFetchingContacts] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real office contacts from backend
  const fetchContacts = async () => {
    setFetchingContacts(true);
    try {
      const data = await chatApi.getContacts();
      if (data && data.length > 0) {
        const filtered = data.filter((c) => c.id !== user?.id && c.email !== user?.email);
        setContacts(filtered);
        if (!activeContact && filtered.length > 0) {
          setActiveContact(filtered[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch office contacts:', err);
    } finally {
      setFetchingContacts(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open, user]);

  useEffect(() => {
    if (initialContact) {
      setActiveContact(initialContact);
    }
  }, [initialContact]);

  // Load message thread with active contact and poll for incoming messages
  useEffect(() => {
    if (!open || !activeContact?.id) return;

    let isSubscribed = true;

    const fetchDMs = async () => {
      try {
        const dms = await chatApi.getDirectMessages(activeContact.id);
        if (isSubscribed) {
          setMessages(dms);
        }
      } catch (err) {
        console.error('Failed to fetch direct messages:', err);
      }
    };

    fetchDMs();
    // Live polling every 3 seconds while drawer is open
    const interval = setInterval(fetchDMs, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [open, activeContact?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !activeContact?.id) return;

    setInputText('');
    setLoading(true);

    try {
      const newMsg = await chatApi.sendDirectMessage(activeContact.id, text);
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send direct message:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return '';
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
      width={460}
      styles={{
        body: { padding: 0, display: 'flex', height: '100%', overflow: 'hidden' },
      }}
    >
      {/* Left Teammates List */}
      <div
        style={{
          width: 150,
          borderRight: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '12px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>TEAMMATES</span>
          {fetchingContacts && <SyncOutlined spin style={{ fontSize: 10 }} />}
        </div>
        {contacts.length === 0 ? (
          <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
            No other teammates online
          </div>
        ) : (
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
                      {contact.name ? contact.name[0].toUpperCase() : 'U'}
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
                      {contact.name || contact.email.split('@')[0]}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
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
                <Avatar style={{ backgroundColor: '#722ed1' }}>
                  {activeContact.name ? activeContact.name[0].toUpperCase() : 'U'}
                </Avatar>
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
              {messages.length === 0 ? (
                <Empty description="No messages yet. Send a message to start the conversation!" style={{ margin: 'auto' }} />
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id || msg.sender_name === user?.name;
                  const timeStr = msg.timestamp || (msg as any).created_at;
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
                        {formatTime(timeStr)}
                      </span>
                    </div>
                  );
                })
              )}
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
                placeholder={`Message ${activeContact.name?.split(' ')[0] || 'teammate'}...`}
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
