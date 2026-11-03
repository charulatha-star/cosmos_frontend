import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Typography } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { CreateRoomPayload } from '../api/rooms';

const { Text } = Typography;

interface CreateRoomModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateRoomPayload) => Promise<void>;
  loading: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  open,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<CreateRoomPayload>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        type: isAdmin ? 'permanent' : 'temporary',
        capacity: 10,
      });
    }
  }, [open, isAdmin, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch {
      // Form validation failed
    }
  };

  return (
    <Modal
      title={isAdmin ? 'Create Office Room' : 'Create Temporary Room'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Create Room"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ capacity: 10 }}>
        <Form.Item
          name="name"
          label="Room Name"
          rules={[
            { required: true, message: 'Please provide a room name' },
            { min: 3, message: 'Room name must be at least 3 characters' },
          ]}
        >
          <Input placeholder="e.g. Design Sprint or Quick Sync" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Room Type"
          extra={
            !isAdmin ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Employees can create temporary rooms. Only Admins can create permanent office rooms.
              </Text>
            ) : null
          }
        >
          <Select disabled={!isAdmin}>
            <Select.Option value="permanent">Permanent (Always-on office space)</Select.Option>
            <Select.Option value="temporary">Temporary (Ad-hoc huddle)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Capacity Limit (Max Participants)"
          rules={[{ required: true, message: 'Please specify room capacity' }]}
          extra="The system strictly blocks extra joins once this limit is reached (PRD 6.2)."
        >
          <InputNumber min={2} max={100} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="description" label="Description (Optional)">
          <Input.TextArea placeholder="What is this room used for?" rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateRoomModal;
