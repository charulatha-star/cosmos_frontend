import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, Tooltip, message } from 'antd';
import {
  EditOutlined,
  SettingOutlined,
  CloseOutlined,
  CheckOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { User } from '../types';
import { authApi } from '../api/auth';
import { presenceApi } from '../api/presence';

export interface CosmosProfileStatusModalProps {
  user: User | null;
  currentSpace: string;
  onUpdateUser: (updatedData: Partial<User>) => void;
  // Controls visibility from parent
  isPopoverOpen: boolean;
  onClosePopover: () => void;
  onOpenEditProfile: () => void;
  isEditProfileOpen: boolean;
  onCloseEditProfile: () => void;
  isCustomStatusOpen: boolean;
  onOpenCustomStatus: () => void;
  onCloseCustomStatus: () => void;
}

// Detect gender based on name given (Indian & International names)
export const isFemaleName = (inputName: string): boolean => {
  if (!inputName) return false;
  const name = inputName.trim().toLowerCase().split(/[\s@._-]+/)[0];

  const femaleNames = [
    'charu', 'charulatha', 'uma', 'swathi', 'swati', 'priya', 'divya', 'anita', 'pooja',
    'deepa', 'kavita', 'kavitha', 'sneha', 'lakshmi', 'sarah', 'sara', 'emma', 'anna',
    'olivia', 'sophia', 'emily', 'mia', 'chloe', 'maya', 'grace', 'lily', 'claire',
    'mary', 'jessica', 'latha', 'devi', 'shree', 'sree', 'kumari', 'amrita', 'aishwarya',
    'meera', 'radha', 'shreya', 'shruthi', 'shruti', 'ananya', 'aarti', 'neha', 'preeti',
    'rashmi', 'sunita', 'geeta', 'rekha', 'bhavana', 'sandhya', 'vidya', 'monica', 'monika',
    'jenny', 'jennifer', 'rachel', 'laura', 'helen', 'rose', 'victoria', 'eva',
    'nisha', 'meena', 'rani', 'revathi', 'kala', 'kamala', 'anusha', 'malathi', 'bhanu',
    'gayathri', 'gayu', 'soundarya', 'pavithra', 'keerthi', 'abirami', 'sharmila', 'janani',
  ];

  if (femaleNames.some((f) => name.includes(f))) return true;

  // Explicit male names
  const maleNames = ['vishnu', 'jagan', 'alex', 'alexander', 'vinoth', 'kumar', 'vijay', 'rahul', 'ram', 'arun', 'karthik', 'suresh', 'raj', 'john', 'david', 'michael', 'daniel', 'robert', 'sam', 'samuel', 'prem', 'manoj', 'pradeep', 'anand', 'dinesh'];
  if (maleNames.some((m) => name.includes(m))) return false;

  // Indian and common feminine endings: tha, thi, ya, na, la, ka, ri, ni, ee, sha
  const femaleEndings = ['tha', 'thi', 'ya', 'na', 'la', 'ka', 'ri', 'ni', 'ee', 'sha'];
  const maleExceptions = ['shiva', 'krishna', 'ravi', 'hari', 'muthu', 'bala', 'chandra', 'rama', 'surya', 'joshua', 'luca', 'ezra'];
  if (maleExceptions.includes(name)) return false;

  if (femaleEndings.some((ending) => name.endsWith(ending))) return true;

  if (name.endsWith('a') && name.length > 3) {
    return true;
  }

  return false;
};

// 9 Beautiful Employee Corporate Avatars Matching Reference Image
export const AVATAR_PRESETS = [
  // Top Row (Reference Image)
  { id: 'alex-executive', name: 'Alex (Executive Suit)', gender: 'male', style: 'avataaars', seed: 'AlexExecutive' },
  { id: 'emma-blonde', name: 'Emma (Blonde Corporate)', gender: 'female', style: 'avataaars', seed: 'EmmaCorporate' },
  { id: 'daniel-modern', name: 'Daniel (Modern Blue)', gender: 'male', style: 'avataaars', seed: 'DanielModern' },
  // Middle Row
  { id: 'maya-glasses', name: 'Maya (Design Glasses)', gender: 'female', style: 'avataaars', seed: 'MayaDesignGlasses' },
  { id: 'david-smart', name: 'David (Smart Glasses)', gender: 'male', style: 'avataaars', seed: 'DavidGlasses' },
  { id: 'sarah-burgundy', name: 'Sarah (Burgundy Blazer)', gender: 'female', style: 'avataaars', seed: 'SarahBurgundy' },
  // Bottom Row
  { id: 'robert-distinguished', name: 'Robert (Distinguished)', gender: 'male', style: 'avataaars', seed: 'RobertExecutive' },
  { id: 'sam-bold', name: 'Sam (Bold Corporate)', gender: 'male', style: 'avataaars', seed: 'SamCorporate' },
  { id: 'charu-chic', name: 'Charu (Corporate Chic)', gender: 'female', style: 'avataaars', seed: 'CharuCorporate' },
];

export const FEMALE_SEEDS = [
  { seed: 'EmmaCorporate', bg: 'ffd5dc' },
  { seed: 'MayaDesignGlasses', bg: 'd1d4f9' },
  { seed: 'SarahBurgundy', bg: 'ffdfbf' },
  { seed: 'CharuCorporate', bg: 'ffd5dc' },
  { seed: 'SophiaExecutive', bg: 'e0e7ff' },
  { seed: 'AmeliaBiz', bg: 'fae8ff' },
];

export const MALE_SEEDS = [
  { seed: 'AlexExecutive', bg: 'b6e3f4' },
  { seed: 'DanielModern', bg: 'c0aede' },
  { seed: 'DavidGlasses', bg: 'e2e8f0' },
  { seed: 'RobertExecutive', bg: 'e2e8f0' },
  { seed: 'SamCorporate', bg: 'b6e3f4' },
  { seed: 'MarcusDirector', bg: 'c0aede' },
];

export const getAvatarUrl = (user?: User | { name?: string; email?: string; avatar_seed?: string; avatar_style?: string } | null, customSeed?: string, _customStyle?: string): string => {
  const name = user?.name || user?.email || customSeed || 'CosmosMember';
  const female = isFemaleName(name);

  // Check if a preset was explicitly chosen
  const presetMatch = AVATAR_PRESETS.find(
    (p) => p.seed === customSeed || p.seed === user?.avatar_seed || p.id === user?.avatar_seed
  );

  let seed = customSeed || user?.avatar_seed;
  let bg = female ? 'ffd5dc' : 'b6e3f4';

  if (presetMatch) {
    seed = presetMatch.seed;
    if (presetMatch.id === 'alex-executive' || presetMatch.id === 'sam-bold') bg = 'b6e3f4';
    else if (presetMatch.id === 'emma-blonde' || presetMatch.id === 'charu-chic') bg = 'ffd5dc';
    else if (presetMatch.id === 'daniel-modern') bg = 'c0aede';
    else if (presetMatch.id === 'maya-glasses') bg = 'd1d4f9';
    else if (presetMatch.id === 'david-smart' || presetMatch.id === 'robert-distinguished') bg = 'e2e8f0';
    else if (presetMatch.id === 'sarah-burgundy') bg = 'ffdfbf';
  } else if (!seed || seed === 'Felix' || seed === 'Abby' || seed === 'Whiskers' || seed.length < 3) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = (hash * 31 + cleanName.charCodeAt(i)) >>> 0;
    }

    if (female) {
      if (cleanName.includes('charulatham') || cleanName.includes('312')) {
        seed = 'EmmaCorporate';
        bg = 'ffd5dc';
      } else if (cleanName.includes('charu')) {
        seed = 'CharuCorporate';
        bg = 'ffd5dc';
      } else if (cleanName.includes('uma')) {
        seed = 'SarahBurgundy';
        bg = 'ffdfbf';
      } else {
        const item = FEMALE_SEEDS[hash % FEMALE_SEEDS.length];
        seed = item.seed;
        bg = item.bg;
      }
    } else {
      if (cleanName.includes('vishnu')) {
        seed = 'AlexExecutive';
        bg = 'b6e3f4';
      } else if (cleanName.includes('jagan')) {
        seed = 'DanielModern';
        bg = 'c0aede';
      } else if (cleanName.includes('vinoth')) {
        seed = 'DavidGlasses';
        bg = 'e2e8f0';
      } else {
        const item = MALE_SEEDS[hash % MALE_SEEDS.length];
        seed = item.seed;
        bg = item.bg;
      }
    }
  }

  // Pure, clean DiceBear 7.x endpoint returning guaranteed HTTP 200 SVG circular portraits
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundColor=${bg}`;
};

export const CosmosProfileStatusModal: React.FC<CosmosProfileStatusModalProps> = ({
  user,
  currentSpace,
  onUpdateUser,
  isPopoverOpen,
  onClosePopover,
  onOpenEditProfile,
  isEditProfileOpen,
  onCloseEditProfile,
  isCustomStatusOpen,
  onOpenCustomStatus,
  onCloseCustomStatus,
}) => {
  // Current active status mode: Available, Listening, Away (Focus removed per user request)
  const [activeStatusMode, setActiveStatusMode] = useState<'Available' | 'Listening' | 'Away'>(() => {
    return (user?.status_mode as any) === 'Away' || user?.status === 'offline'
      ? 'Away'
      : (user?.status_mode as any) === 'Listening'
      ? 'Listening'
      : 'Available';
  });

  const [customStatusText, setCustomStatusText] = useState<string>(() => user?.custom_status || '');
  const [autoClearTime, setAutoClearTime] = useState<string>('0h 00m');

  // Edit Profile Form State
  const [editName, setEditName] = useState<string>('');
  const [editCountry, setEditCountry] = useState<string>('India');
  const [editCity, setEditCity] = useState<string>('Chennai');
  const [editTimeZone, setEditTimeZone] = useState<string>('(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi');
  const [editLanguage, setEditLanguage] = useState<string>('English');
  const [editCommunity, setEditCommunity] = useState<string>('');
  const [editAbout, setEditAbout] = useState<string>('');
  const [editInterests, setEditInterests] = useState<string>('');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number>(0);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Load user profile details on open
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditCountry(user.country || 'India');
      setEditCity(user.city || 'Chennai');
      setEditTimeZone(user.time_zone || '(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi');
      setEditLanguage(user.language || 'English');
      setEditCommunity(user.community_groups || '');
      setEditAbout(user.about || '');
      setEditInterests(user.interests || '');
      setCustomStatusText(user.custom_status || '');
      if (user.status_mode === 'Away' || user.status === 'offline') {
        setActiveStatusMode('Away');
      } else if (user.status_mode === 'Listening') {
        setActiveStatusMode('Listening');
      } else {
        setActiveStatusMode('Available');
      }
    }
  }, [user, isEditProfileOpen, isPopoverOpen]);

  // Handle Quick Status Selection (Available, Listening, Away)
  const handleSelectStatus = async (mode: 'Available' | 'Listening' | 'Away') => {
    setActiveStatusMode(mode);
    const backendStatus = mode === 'Away' ? 'offline' : 'online';

    // Update in auth context & local storage
    onUpdateUser({
      status_mode: mode,
      status: backendStatus,
    });

    // Sync to backend presence
    try {
      await presenceApi.updatePresence({
        status: backendStatus,
        space: currentSpace,
      });
      await authApi.updateProfile({ status: backendStatus });
    } catch {
      // Local state persists
    }

    onClosePopover();

    if (mode === 'Away') {
      // Automatically pop open the dedicated "You're Away" modal (Image 3)
      onOpenCustomStatus();
    } else {
      message.success(`Status updated to ${mode}`);
    }
  };

  // Handle Custom Status Save
  const handleSaveCustomStatus = async () => {
    onUpdateUser({
      custom_status: customStatusText,
      status_mode: activeStatusMode,
    });
    message.success('Status updated');
    onCloseCustomStatus();
  };

  // Handle Clear Status (clears text, sets to Available, closes modal matching Images 2 & 3)
  const handleClearStatus = async () => {
    setCustomStatusText('');
    await handleSelectStatus('Available');
    onUpdateUser({
      custom_status: '',
      status_mode: 'Available',
      status: 'online',
    });
    message.info('Status cleared. Switched to Available');
    onCloseCustomStatus();
  };

  // Cycle / Change Avatar
  const handleChangeAvatar = () => {
    const nextIdx = (selectedAvatarIndex + 1) % AVATAR_PRESETS.length;
    setSelectedAvatarIndex(nextIdx);
  };

  // Save Full Profile
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      message.error('Name cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    const activePreset = AVATAR_PRESETS[selectedAvatarIndex];
    const updatedData: Partial<User> = {
      name: editName.trim(),
      country: editCountry,
      city: editCity,
      time_zone: editTimeZone,
      language: editLanguage,
      community_groups: editCommunity,
      about: editAbout,
      interests: editInterests,
      avatar_seed: activePreset.seed,
      avatar_style: activePreset.style,
      avatar_url: getAvatarUrl(user, activePreset.seed, activePreset.style),
    };

    try {
      await authApi.updateProfile({ name: editName.trim() });
    } catch {
      // Backend offline or local mock
    }

    onUpdateUser(updatedData);
    setIsSavingProfile(false);
    message.success('Profile updated successfully!');
    onCloseEditProfile();
  };

  const currentAvatarSeed = AVATAR_PRESETS[selectedAvatarIndex]?.seed || user?.avatar_seed || user?.name || 'Charu';
  const currentAvatarStyle = AVATAR_PRESETS[selectedAvatarIndex]?.style || user?.avatar_style || 'adventurer';
  const currentAvatarDisplayUrl = getAvatarUrl(user, currentAvatarSeed, currentAvatarStyle);

  return (
    <>
      {/* 1. Status Popover Menu (Matching Image 5: media_1795161083324_00f9bfbe.jpg) */}
      {isPopoverOpen && (
        <>
          {/* Backdrop to click away */}
          <div
            onClick={onClosePopover}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />

          <div
            style={{
              position: 'fixed',
              bottom: 74,
              left: 18,
              width: 270,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
              border: '1px solid #e2e8f0',
              padding: 12,
              zIndex: 999,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              animation: 'popoverSlideUp 0.18s ease-out',
            }}
          >
            {/* User Profile Header Card */}
            <div
              style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 12,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar with Status Dot */}
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <img
                    src={getAvatarUrl(user)}
                    alt="User Avatar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      backgroundColor:
                        activeStatusMode === 'Available'
                          ? '#22c55e'
                          : activeStatusMode === 'Away'
                          ? '#ef4444'
                          : '#f59e0b',
                      border: '2px solid #ffffff',
                    }}
                  />
                </div>

                {/* Name & Status */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.2 }}>
                    {user?.name || 'Charu'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {customStatusText || activeStatusMode}
                  </div>
                </div>
              </div>

              {/* Edit Profile Pencil Icon */}
              <Tooltip title="Edit Profile" placement="top">
                <button
                  onClick={() => {
                    onClosePopover();
                    onOpenEditProfile();
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 8,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e2e8f0';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <EditOutlined style={{ fontSize: 15 }} />
                </button>
              </Tooltip>
            </div>

            {/* Status Section */}
            <div style={{ marginTop: 14, padding: '0 4px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
                Status
              </div>

              {/* 3 Status Icon Circles (Focus removed per user request) */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 14 }}>
                {/* 1. Available */}
                <div
                  onClick={() => handleSelectStatus('Available')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: activeStatusMode === 'Available' ? '#22c55e' : '#f1f5f9',
                      color: activeStatusMode === 'Available' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      boxShadow: activeStatusMode === 'Available' ? '0 0 0 3px rgba(34, 197, 94, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ✋
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Available</span>
                </div>

                {/* 2. Listening */}
                <div
                  onClick={() => handleSelectStatus('Listening')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: activeStatusMode === 'Listening' ? '#f59e0b' : '#f1f5f9',
                      color: activeStatusMode === 'Listening' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      boxShadow: activeStatusMode === 'Listening' ? '0 0 0 3px rgba(245, 158, 11, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    👂
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Listening</span>
                </div>

                {/* 3. Away */}
                <div
                  onClick={() => handleSelectStatus('Away')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: activeStatusMode === 'Away' ? '#ef4444' : '#f1f5f9',
                      color: activeStatusMode === 'Away' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      boxShadow: activeStatusMode === 'Away' ? '0 0 0 3px rgba(239, 68, 68, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    🏃
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Away</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '8px 0' }} />

            {/* Set Custom Status */}
            <div
              onClick={() => {
                onClosePopover();
                onOpenCustomStatus();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#334155',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <EditOutlined style={{ fontSize: 15, color: '#64748b' }} />
              <span>Set Custom Status</span>
            </div>

            {/* User Preferences */}
            <div
              onClick={() => {
                message.info('User preferences panel opened');
                onClosePopover();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#334155',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <SettingOutlined style={{ fontSize: 15, color: '#64748b' }} />
              <span>User Preferences</span>
            </div>
          </div>
        </>
      )}

      {/* 2. Edit Profile Modal (Matching Image 6: media_1795161100980_399d8a1e.jpg) */}
      <Modal
        open={isEditProfileOpen}
        onCancel={onCloseEditProfile}
        footer={null}
        width={720}
        centered
        closable={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          {/* Header */}
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Profile</h2>
            <button
              onClick={onCloseEditProfile}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 8,
                color: '#64748b',
              }}
            >
              <CloseOutlined style={{ fontSize: 16 }} />
            </button>
          </div>

          {/* Body: Two Columns */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              padding: '24px 28px',
              maxHeight: 'calc(85vh - 120px)',
              overflowY: 'auto',
            }}
          >
            {/* Left Column: Avatar Preview & Change Avatar */}
            <div style={{ width: 180, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 16,
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  border: '1px solid #bae6fd',
                }}
              >
                <img
                  src={currentAvatarDisplayUrl}
                  alt="3D Character Avatar"
                  style={{
                    width: 160,
                    height: 160,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.12))',
                  }}
                />
              </div>

              {/* Change Avatar Button */}
              <button
                onClick={handleChangeAvatar}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <SyncOutlined />
                Change Avatar
              </button>

              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textAlign: 'center', marginTop: 8 }}>
                {AVATAR_PRESETS[selectedAvatarIndex]?.name}
              </div>

              {/* 9 Corporate Avatars Picker (Reference Image Match) */}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8, textAlign: 'center' }}>
                  Choose Your Corporate Look
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, justifyItems: 'center' }}>
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = selectedAvatarIndex === idx;
                    const avatarUrl = getAvatarUrl({ name: preset.name }, preset.seed, preset.style);
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedAvatarIndex(idx)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          padding: 2,
                          border: isSelected ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={preset.name}
                      >
                        <img
                          src={avatarUrl}
                          alt={preset.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Form Inputs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                  style={{ height: 40, borderRadius: 8 }}
                />
              </div>

              {/* Country & City (Row) */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Country
                  </label>
                  <Select
                    value={editCountry}
                    onChange={setEditCountry}
                    style={{ width: '100%', height: 40 }}
                    options={[
                      { value: 'India', label: 'India' },
                      { value: 'United States', label: 'United States' },
                      { value: 'United Kingdom', label: 'United Kingdom' },
                      { value: 'Canada', label: 'Canada' },
                      { value: 'Germany', label: 'Germany' },
                      { value: 'Australia', label: 'Australia' },
                      { value: 'Singapore', label: 'Singapore' },
                    ]}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    City
                  </label>
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Choose city"
                    style={{ height: 40, borderRadius: 8 }}
                  />
                </div>
              </div>

              {/* Time Zone & Language (Row) */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Time Zone
                  </label>
                  <Select
                    value={editTimeZone}
                    onChange={setEditTimeZone}
                    style={{ width: '100%', height: 40 }}
                    options={[
                      { value: '(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi', label: '(GMT+5:30) Chennai, Kolkata...' },
                      { value: '(GMT-8:00) Pacific Time (US & Canada)', label: '(GMT-8:00) Pacific Time' },
                      { value: '(GMT-5:00) Eastern Time (US & Canada)', label: '(GMT-5:00) Eastern Time' },
                      { value: '(GMT+0:00) UTC / London', label: '(GMT+0:00) UTC' },
                      { value: '(GMT+1:00) Central European Time', label: '(GMT+1:00) CET' },
                      { value: '(GMT+8:00) Singapore / Perth', label: '(GMT+8:00) Singapore' },
                    ]}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Language
                  </label>
                  <Select
                    value={editLanguage}
                    onChange={setEditLanguage}
                    style={{ width: '100%', height: 40 }}
                    options={[
                      { value: 'English', label: 'English' },
                      { value: 'Tamil', label: 'Tamil' },
                      { value: 'Hindi', label: 'Hindi' },
                      { value: 'Spanish', label: 'Spanish' },
                      { value: 'French', label: 'French' },
                    ]}
                  />
                </div>
              </div>

              {/* Community groups */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Community groups
                </label>
                <Input
                  value={editCommunity}
                  onChange={(e) => setEditCommunity(e.target.value)}
                  placeholder="Type local community groups, like Student, Visitor..."
                  style={{ height: 40, borderRadius: 8 }}
                />
              </div>

              {/* About */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>About</label>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{editAbout.length} / 240</span>
                </div>
                <Input.TextArea
                  value={editAbout}
                  maxLength={240}
                  onChange={(e) => setEditAbout(e.target.value)}
                  placeholder="Tell about yourself"
                  rows={3}
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* Interests */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Interests
                </label>
                <Input
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  placeholder="Type interests like Books, Music..."
                  style={{ height: 40, borderRadius: 8 }}
                />
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              padding: '16px 28px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              backgroundColor: '#f8fafc',
            }}
          >
            <button
              onClick={onCloseEditProfile}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              style={{
                padding: '8px 22px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 13,
                cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                opacity: isSavingProfile ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckOutlined />
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. "You're Away" / Custom Status Modal (Exact Match to Images 2 & 3: media_1795168160876_2cb42e33.jpg) */}
      <Modal
        open={isCustomStatusOpen}
        onCancel={onCloseCustomStatus}
        footer={null}
        width={420}
        centered
        closable={false}
        bodyStyle={{ padding: '24px 28px' }}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          {/* Header with Title and Close 'X' */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: activeStatusMode === 'Available' ? '#22c55e' : '#ef4444',
                  display: 'inline-block',
                }}
              />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                You're {activeStatusMode}
              </h3>
            </div>
            <button
              onClick={onCloseCustomStatus}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: 16,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            {activeStatusMode === 'Away'
              ? "Your camera and mic are off, and you won't hear others."
              : 'Teammates can see your current availability across the office.'}
          </p>

          {/* Quick Switch to Available button (matching Images 2 & 3) */}
          <button
            onClick={() => handleSelectStatus('Available')}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#1c223c',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1c223c')}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
            Switch to Available
          </button>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                What are you up to?
              </label>
              <Input
                prefix={<span style={{ marginRight: 6, fontSize: 14 }}>💬</span>}
                suffix={
                  customStatusText ? (
                    <CloseOutlined
                      style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
                      onClick={() => setCustomStatusText('')}
                    />
                  ) : null
                }
                value={customStatusText}
                onChange={(e) => setCustomStatusText(e.target.value)}
                placeholder="e.g. In a meeting, Lunch break"
                style={{ height: 40, borderRadius: 8 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                Auto-clear after
              </label>
              <Select
                value={autoClearTime}
                onChange={setAutoClearTime}
                style={{ width: '100%', height: 40 }}
                options={[
                  { value: '0h 00m', label: '0h 00m' },
                  { value: '30m', label: '30 minutes' },
                  { value: '1h', label: '1 hour' },
                  { value: '4h', label: '4 hours' },
                  { value: 'Today', label: 'Today' },
                  { value: "Don't clear", label: "Don't clear" },
                ]}
              />
            </div>

            {/* Bottom Actions: Update status & Clear status (matching Images 2 & 3) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 }}>
              <button
                onClick={handleSaveCustomStatus}
                style={{
                  padding: '9px 24px',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                Update status
              </button>
              <button
                onClick={handleClearStatus}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Clear status
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CosmosProfileStatusModal;
