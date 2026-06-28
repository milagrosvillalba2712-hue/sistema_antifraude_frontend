import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({ width, height, className, variant = 'rectangular' }: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn('bg-surface-container animate-pulse', variantClasses[variant], className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonAlertCard() {
  return (
    <div className="p-4 border border-surface-container-highest rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="60px" height="16px" variant="text" />
        <Skeleton width="80px" height="20px" variant="text" />
      </div>
      <Skeleton width="100%" height="12px" variant="text" />
      <div className="flex items-center justify-between">
        <Skeleton width="100px" height="12px" variant="text" />
        <Skeleton width="60px" height="12px" variant="text" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  message,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
      <p className="text-secondary font-medium">{title}</p>
      <p className="text-secondary/60 text-sm mt-1">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
