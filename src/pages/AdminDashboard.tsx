import React from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { UserOutlined, VideoCameraOutlined, ClockCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const { Content } = Layout;
const { Title, Text } = Typography;

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const mockUsers = [
    { key: '1', name: 'Sarah Connor', email: 'sarah.admin@billiontags.com', role: 'Admin', status: 'online' },
    { key: '2', name: 'Alex Rivera', email: 'alex.rivera@billiontags.com', role: 'Employee', status: 'online' },
    { key: '3', name: 'John Doe', email: 'john.doe@billiontags.com', role: 'Employee', status: 'offline' },
  ];

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'Admin' ? 'volcano' : 'blue'}>{role}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'green' : 'default'}>{status.toUpperCase()}</Tag>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Navbar />
      <Content style={{ padding: '32px 48px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Admin Control Panel</Title>
          <Text type="secondary">
            Authorized administrator view for: <Tag color="volcano">{user?.name}</Tag>
          </Text>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Total Office Headcount" value={14} prefix={<UserOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Active Rooms" value={3} prefix={<VideoCameraOutlined />} valueStyle={{ color: '#1677ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Total Meeting Hours" value={42.5} prefix={<ClockCircleOutlined />} precision={1} />
            </Card>
          </Col>
        </Row>

        <Card
          title={<span><SafetyCertificateOutlined /> Office Directory & Role Management</span>}
        >
          <Table dataSource={mockUsers} columns={columns} pagination={false} />
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminDashboard;
