import { Progress, Space, Typography } from 'antd';

interface WorkloadBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export default function WorkloadBar({ current, max = 20, showLabel = true, className }: WorkloadBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const color = percentage > 80 ? '#ba1a1a' : percentage > 50 ? '#f2994a' : '#2ecc71';

  return (
    <Space className={className} style={{ width: '100%' }}>
      <Progress percent={percentage} showInfo={false} strokeColor={color} size="small" style={{ width: 120 }} />
      {showLabel && <Typography.Text type="secondary">{current}</Typography.Text>}
    </Space>
  );
}
