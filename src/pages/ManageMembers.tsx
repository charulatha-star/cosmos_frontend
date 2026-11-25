import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Tag,
  Dropdown,
  Avatar,
  Checkbox,
  Table,
  Modal,
  Select,
  Popconfirm,
  Badge,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  DownOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  UsergroupAddOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../components/CosmosProfileStatusModal';
import { spacesApi } from '../api/spaces';
import type { SpaceMemberItem, SpaceInvitationItem, SpaceRole } from '../types';

export const ManageMembers: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const activeSpace = spaceId || 'billion';
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [spaceName, setSpaceName] = useState<string>(activeSpace);
  const [members, setMembers] = useState<SpaceMemberItem[]>([]);
  const [invitations, setInvitations] = useState<SpaceInvitationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [allowLinkJoin, setAllowLinkJoin] = useState<boolean>(true);
  const [inviteCode, setInviteCode] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addEmails, setAddEmails] = useState<string>('');
  const [addRole, setAddRole] = useState<'Member' | 'Admin'>('Member');
  const [addLoading, setAddLoading] = useState<boolean>(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<SpaceMemberItem | null>(null);
  const [editRole, setEditRole] = useState<SpaceRole>('Member');
  const [editLoading, setEditLoading] = useState<boolean>(false);

  // Delete Organization modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Active view tab ('members' | 'delete')
  const [activeTab, setActiveTab] = useState<'members' | 'delete'>('members');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await spacesApi.getMembers(activeSpace);
      if (data) {
        setMembers(data);
      }
    } catch (err: any) {
      console.warn('Could not fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const data = await spacesApi.getInvitations(activeSpace);
      if (data) {
        setInvitations(data);
      }
    } catch (err: any) {
      console.warn('Could not fetch invitations:', err);
    }
  };

  const fetchSpaceInfo = async () => {
    try {
      const info = await spacesApi.getInviteInfo(activeSpace);
      if (info) {
        setInviteCode(info.invite_code);
        setAllowLinkJoin(info.allow_link_join);
        if (info.space_name) {
          setSpaceName(info.space_name);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
    fetchSpaceInfo();
  }, [activeSpace]);

  // Check if current user is Primary Owner
  const currentMember = members.find((m) => m.email === user?.email);
  const isPrimaryOwner = currentMember?.role === 'Owner';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invite/${inviteCode || activeSpace}`;
    navigator.clipboard?.writeText(url);
    message.success('Invite link copied to clipboard!');
  };

  const handleToggleAllowLink = async (checked: boolean) => {
    setAllowLinkJoin(checked);
    try {
      await spacesApi.updateInviteSettings(activeSpace, checked);
      message.success(checked ? 'Public invite link enabled' : 'Public invite link disabled');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to update invite settings');
    }
  };

  // Add People / Email Invites
  const handleAddPeople = async () => {
    if (!addEmails.trim()) {
      message.error('Please enter at least one email address');
      return;
    }
    try {
      setAddLoading(true);
      const res = await spacesApi.addMembers(activeSpace, addEmails, addRole);
      message.success(res.detail || 'Invitation(s) sent successfully!');
      setIsAddModalOpen(false);
      setAddEmails('');
      fetchMembers();
      fetchInvitations();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to send invitations');
    } finally {
      setAddLoading(false);
    }
  };

  // Resend Email Invite
  const handleResendInvite = async (inviteId: string) => {
    try {
      await spacesApi.resendInvitation(activeSpace, inviteId);
      message.success('Invitation resent successfully!');
      fetchInvitations();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to resend invitation');
    }
  };

  // Cancel Email Invite
  const handleCancelInvite = async (inviteId: string) => {
    try {
      await spacesApi.cancelInvitation(activeSpace, inviteId);
      message.success('Invitation cancelled');
      fetchInvitations();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to cancel invitation');
    }
  };

  // Edit Member Role
  const handleSaveEditRole = async () => {
    if (!selectedMember) return;
    try {
      setEditLoading(true);
      await spacesApi.updateMember(activeSpace, selectedMember.id, { role: editRole });
      message.success('Member role updated!');
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to update role');
    } finally {
      setEditLoading(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await spacesApi.removeMember(activeSpace, memberId);
      message.success('Member removed');
      fetchMembers();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to remove member');
    }
  };

  // Delete Organization
  const handleDeleteOrganization = async () => {
    if (deleteConfirmName.trim().toLowerCase() !== spaceName.toLowerCase()) {
      message.error(`Please type "${spaceName}" exactly to confirm deletion.`);
      return;
    }
    try {
      setDeleteLoading(true);
      const res = await spacesApi.deleteSpace(activeSpace, deleteConfirmName.trim());
      message.success(res.detail || 'Organization deleted.');
      setIsDeleteModalOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Failed to delete organization');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered members by search query and role filter
  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    const matchesRole =
      roleFilter === 'ALL' || m.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const memberColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SpaceMemberItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={32}
            src={getAvatarUrl({ name: text, email: record.email || undefined })}
            style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
          />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{text || 'Teammate'}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <span style={{ color: '#475569' }}>{email || '—'}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const isOwner = role === 'Owner';
        const isAdmin = role === 'Admin';
        return (
          <Tag
            color={isOwner ? 'purple' : isAdmin ? 'blue' : 'default'}
            style={{
              fontWeight: 600,
              borderRadius: 6,
              padding: '2px 8px',
            }}
          >
            {isOwner ? 'Primary Owner' : role}
          </Tag>
        );
      },
    },
    {
      title: 'Office Access',
      dataIndex: 'access',
      key: 'access',
      render: () => <span style={{ color: '#475569' }}>All offices</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SpaceMemberItem) => {
        const isTargetOwner = record.role === 'Owner';
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setSelectedMember(record);
                setEditRole(record.role);
                setIsEditModalOpen(true);
              }}
              style={{ color: '#0f172a', fontWeight: 600, padding: 0 }}
            >
              Edit
            </Button>
            {!isTargetOwner && (
              <Popconfirm
                title="Remove Member"
                description={`Are you sure you want to remove ${record.name || record.email}?`}
                onConfirm={() => handleRemoveMember(record.id)}
                okText="Remove"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" size="small" danger style={{ fontWeight: 600, padding: 0 }}>
                  Remove
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');

  const invitationColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{email}</span>
      ),
    },
    {
      title: 'Invited Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Invited By',
      dataIndex: 'invited_by_name',
      key: 'invited_by_name',
      render: (name: string) => <span style={{ color: '#64748b' }}>{name || 'Teammate'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'expired' ? 'error' : status === 'accepted' ? 'success' : 'warning'}
          style={{ borderRadius: 6, textTransform: 'capitalize' }}
        >
          {status}
        </Tag>
      ),
    },

    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: SpaceInvitationItem) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleResendInvite(record.id)}
            style={{ padding: 0, fontWeight: 600, color: '#3b82f6' }}
          >
            Resend
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleCancelInvite(record.id)}
            style={{ padding: 0, fontWeight: 600 }}
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'email',
      disabled: true,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{user?.name || 'Teammate'}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.email}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Back to Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Sign out',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  // Clean Navigation Tabs per Requirement 5:
  // Removed Billing, API keys, Single sign-on, and Insights.
  const adminTabs = [
    { key: 'members', label: 'Members', active: activeTab === 'members' },
    ...(isPrimaryOwner
      ? [{ key: 'delete', label: 'Delete organization', danger: true, active: activeTab === 'delete' }]
      : []),
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      }}
    >
      {/* Top Navbar matching Cosmos Screenshot 5 */}
      <header
        style={{
          height: 64,
          padding: '0 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              O
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              COSMOS
            </span>
          </div>

          <Tag
            color="processing"
            style={{
              borderRadius: 12,
              padding: '1px 10px',
              backgroundColor: '#eff6ff',
              color: '#3b82f6',
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ● {spaceName}
          </Tag>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            icon={<HomeOutlined />}
            onClick={() => navigate(`/v/${activeSpace}/office`)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              color: '#0f172a',
              border: '1px solid #e2e8f0',
            }}
          >
            Go to Office
          </Button>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
              }}
            >
              <Avatar
                size={32}
                src={getAvatarUrl(user)}
                style={{ backgroundColor: '#fed7aa', border: '1px solid #fdba74' }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  {user?.name || 'Teammate'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.email}</div>
              </div>
              <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
            </div>
          </Dropdown>
        </div>
      </header>

      {/* Admin Tabs Navigation Bar - Completely Cleaned per Requirement 5 */}
      <div
        style={{
          borderBottom: '1px solid #f1f5f9',
          padding: '0 36px',
          display: 'flex',
          gap: 24,
          backgroundColor: '#ffffff',
        }}
      >
        {adminTabs.map((tab) => (
          <div
            key={tab.key}
            onClick={() => {
              if (tab.key === 'delete') {
                setIsDeleteModalOpen(true);
              } else {
                setActiveTab(tab.key as any);
              }
            }}
            style={{
              padding: '16px 0',
              fontSize: 13,
              fontWeight: tab.active ? 700 : 500,
              color: tab.danger ? '#ef4444' : tab.active ? '#0f172a' : '#64748b',
              borderBottom: tab.active && !tab.danger ? '2px solid #0f172a' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.danger && <DeleteOutlined style={{ fontSize: 13 }} />}
            {tab.label}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {/* Title & Add People Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Members
            </h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              See who's in {spaceName}, invite new colleagues, and manage member roles.
            </div>
          </div>

          <Button
            type="primary"
            icon={<UsergroupAddOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 8,
              height: 38,
              padding: '0 20px',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
            }}
          >
            Add people
          </Button>
        </div>

        {/* Shareable Invite Link Checkbox & Banner */}
        <div style={{ marginBottom: 28 }}>
          <Checkbox
            checked={allowLinkJoin}
            onChange={(e) => handleToggleAllowLink(e.target.checked)}
            style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 8 }}
          >
            Allow anyone to join via an invite link
          </Checkbox>

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
            Share this link with your team to invite them to your office:
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '8px 14px',
              gap: 10,
              maxWidth: 580,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {`${window.location.origin}/invite/${inviteCode || activeSpace}`}
            </span>
            <CopyOutlined
              onClick={handleCopyLink}
              style={{ fontSize: 14, color: '#475569', cursor: 'pointer' }}
              title="Copy link"
            />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Search members by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: 8,
              maxWidth: 320,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          />

          <Select
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            style={{ width: 140 }}
            options={[
              { value: 'ALL', label: 'All Roles' },
              { value: 'Owner', label: 'Owners' },
              { value: 'Admin', label: 'Admins' },
              { value: 'Member', label: 'Members' },
              { value: 'Guest', label: 'Guests' },
            ]}
          />
        </div>

        {/* Members Table */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            marginBottom: 40,
          }}
        >
          <Table
            columns={memberColumns}
            dataSource={filteredMembers.map((m) => ({ ...m, key: m.id }))}
            loading={loading}
            pagination={false}
          />
        </div>

        {/* Pending Email Invitations Section per Requirement 2 */}
        {pendingInvitations.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Pending Email Invitations
              </h2>
              <Badge count={pendingInvitations.length} style={{ backgroundColor: '#f59e0b' }} />
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}
            >
              <Table
                columns={invitationColumns}
                dataSource={pendingInvitations.map((inv) => ({ ...inv, key: inv.id }))}
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Add People / Send Email Invitations Modal */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Add people to {spaceName}
          </div>
        }
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={460}
      >
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            Email Addresses (comma or space separated)
          </label>
          <Input.TextArea
            rows={4}
            placeholder="colleague@domain.com, teammate@domain.com"
            value={addEmails}
            onChange={(e) => setAddEmails(e.target.value)}
            style={{ borderRadius: 8, marginBottom: 20 }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            Assigned Role
          </label>
          <Select
            value={addRole}
            onChange={(val) => setAddRole(val as any)}
            style={{ width: '100%', marginBottom: 24 }}
            options={[
              { value: 'Member', label: 'Member - Can join all rooms and interact' },
              { value: 'Admin', label: 'Admin - Can manage members and office settings' },
            ]}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setIsAddModalOpen(false)} style={{ borderRadius: 8, height: 38 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={addLoading}
              onClick={handleAddPeople}
              icon={<SendOutlined />}
              style={{
                backgroundColor: '#0f172a',
                borderRadius: 8,
                fontWeight: 700,
                border: 'none',
                height: 38,
                padding: '0 20px',
              }}
            >
              Send Invitations
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Edit Member Role Modal */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Edit Member Role
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={440}
      >
        {selectedMember && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Name</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                {selectedMember.name}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Email</div>
              <div style={{ fontSize: 14, color: '#334155', marginTop: 2 }}>
                {selectedMember.email || '—'}
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Member Role
            </label>
            <Select
              value={editRole}
              onChange={(val) => setEditRole(val as SpaceRole)}
              style={{ width: '100%', marginBottom: 24 }}
              options={[
                { value: 'Admin', label: 'Admin' },
                { value: 'Member', label: 'Member' },
                ...(isPrimaryOwner ? [{ value: 'Owner', label: 'Primary Owner (Transfer Ownership)' }] : []),
              ]}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsEditModalOpen(false)} style={{ borderRadius: 8, height: 38 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={editLoading}
                onClick={handleSaveEditRole}
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: 8,
                  fontWeight: 700,
                  border: 'none',
                  height: 38,
                  padding: '0 20px',
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Delete Organization Confirmation Modal per Requirement 6 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 16, fontWeight: 700 }}>
            <ExclamationCircleOutlined />
            Delete Organization
          </div>
        }
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmName('');
        }}
        footer={null}
        width={480}
      >
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: 8,
              padding: 14,
              color: '#991b1b',
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete the organization <strong>{spaceName}</strong>, all rooms, memberships, and real-time meeting history.
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            To confirm deletion, please type <strong style={{ color: '#0f172a' }}>{spaceName}</strong> below:
          </label>
          <Input
            placeholder={spaceName}
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            style={{ borderRadius: 8, marginBottom: 24, height: 40 }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmName('');
              }}
              style={{ borderRadius: 8, height: 38 }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              danger
              loading={deleteLoading}
              disabled={deleteConfirmName.trim().toLowerCase() !== spaceName.toLowerCase()}
              onClick={handleDeleteOrganization}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                height: 38,
                padding: '0 20px',
              }}
            >
              I understand, delete this organization
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageMembers;
