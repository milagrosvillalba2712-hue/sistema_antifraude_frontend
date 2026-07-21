import { Spin, Space, Typography } from 'antd';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = {
  sm: 'small',
  md: 'default',
  lg: 'large',
} as const;

export const Loading = ({ className, size = 'md', text }: LoadingProps) => (
  <Space className={className} direction="vertical" align="center" style={{ width: '100%', justifyContent: 'center' }}>
    <Spin size={sizeMap[size]} />
    {text && <Typography.Text type="secondary">{text}</Typography.Text>}
  </Space>
);
