import { forwardRef } from 'react';
import { cn } from '../../utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const statusColors: Record<string, string> = {
  DISPONIBLE: 'bg-success',
  EN_REUNION: 'bg-warning',
  ALMUERZO: 'bg-primary-container',
  VACACIONES: 'bg-tertiary',
  CAPACITACION: 'bg-secondary-container',
  FUERA_OFICINA: 'bg-secondary/40',
  NO_DISPONIBLE: 'bg-error',
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name = '', size = 'md', status, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative inline-flex', className)} {...props}>
        {src ? (
          <img
            src={src}
            alt={name}
            className={cn('rounded-full object-cover', sizeClasses[size])}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-primary-container text-white flex items-center justify-center font-bold',
              sizeClasses[size]
            )}
          >
            {getInitials(name)}
          </div>
        )}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
              statusColors[status] || 'bg-secondary/40'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
