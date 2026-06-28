import { cn } from '../../utils';

interface WorkloadBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}

export default function WorkloadBar({ current, max = 20, showLabel = true, className }: WorkloadBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const color =
    percentage > 80 ? 'bg-error' : percentage > 50 ? 'bg-warning' : 'bg-success';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 bg-surface-container rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-secondary/60 font-medium min-w-[2rem] text-right">
          {current}
        </span>
      )}
    </div>
  );
}
