import React from 'react';
import { Layout, Typography, Card, Form, Input, DatePicker, Button, TimePicker } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import Navbar from '../components/Navbar';

const { Content } = Layout;
const { Title, Text } = Typography;

export const ScheduleMeeting: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Navbar />
      <Content style={{ padding: '32px 48px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Schedule a Team Meeting</Title>
          <Text type="secondary">Send calendar invites and generate guest access links</Text>
        </div>

        <Card>
          <Form layout="vertical">
            <Form.Item label="Meeting Title" required>
              <Input placeholder="e.g. Weekly Product Sync" />
            </Form.Item>

            <Form.Item label="Date" required>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Time" required>
              <TimePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Invitees (Emails)">
              <Input.TextArea placeholder="Enter email addresses separated by commas" rows={3} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" icon={<SendOutlined />} disabled>
                Schedule & Send Invites (Wired in Step 7)
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default ScheduleMeeting;
