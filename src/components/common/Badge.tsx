import { cn } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-container text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-critical text-white',
  info: 'bg-tertiary/10 text-tertiary',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-bold rounded-full uppercase',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
