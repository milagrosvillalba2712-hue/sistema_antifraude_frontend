import { useState } from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Typography } from 'antd';

type ConfirmVariant = 'normal' | 'warning' | 'critical';

interface ConfirmOptions {
  title: string;
  description: string;
  detail?: string;
  confirmLabel?: string;
  variant?: ConfirmVariant;
  action: () => Promise<void> | void;
}

interface PendingConfirm extends ConfirmOptions {
  id: number;
}

export const useConfirmAction = () => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = (options: ConfirmOptions) => {
    setPending({ ...options, id: Date.now() });
  };

  const close = () => {
    if (!loading) setPending(null);
  };

  const execute = async () => {
    if (!pending) return;
    try {
      setLoading(true);
      await pending.action();
      setPending(null);
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <Modal
      open={Boolean(pending)}
      onCancel={close}
      title={pending?.title || 'Confirmar Acción'}
      footer={null}
      centered
      width={520}
    >
      {pending && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="start">
            <ExclamationCircleOutlined style={{ color: pending.variant === 'critical' ? '#ba1a1a' : '#de7426', fontSize: 22, marginTop: 2 }} />
            <div>
              <Typography.Text strong>{pending.description}</Typography.Text>
              {pending.detail && <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>{pending.detail}</Typography.Paragraph>}
            </div>
          </Space>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={close} disabled={loading}>Cancelar</Button>
            <Button type="primary" danger={pending.variant === 'critical'} loading={loading} onClick={execute}>
              {pending.confirmLabel || 'Confirmar'}
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );

  return { confirm, confirmationModal: modal };
};
