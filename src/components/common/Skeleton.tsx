import { AlertOutlined } from '@ant-design/icons';
import { Card, Empty, Skeleton as AntSkeleton } from 'antd';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({ width, height, className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <AntSkeleton.Avatar
      active
      shape={variant === 'circular' ? 'circle' : 'square'}
      className={className}
      style={{ width, height, borderRadius: variant === 'text' ? 4 : undefined }}
    />
  );
}

export function SkeletonAlertCard() {
  return (
    <Card>
      <AntSkeleton active paragraph={{ rows: 2 }} />
    </Card>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return <Empty image={<AlertOutlined style={{ fontSize: 42, color: '#8c8c8c' }} />} description={<><strong>{title}</strong><br />{message}</>}>{action}</Empty>;
}
