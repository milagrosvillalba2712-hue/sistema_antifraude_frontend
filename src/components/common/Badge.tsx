import { Tag } from 'antd';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const colorMap = {
  default: 'default',
  success: 'green',
  warning: 'gold',
  danger: 'red',
  info: 'blue',
} as const;

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return <Tag color={colorMap[variant]} className={className}>{children}</Tag>;
}
