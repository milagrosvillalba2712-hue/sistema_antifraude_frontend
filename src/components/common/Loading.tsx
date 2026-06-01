import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const Loading = ({ className, size = 'md', text }: LoadingProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};
