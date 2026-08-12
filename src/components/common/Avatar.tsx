import { forwardRef } from 'react';
import { Avatar as AntAvatar, Badge } from 'antd';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: string;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
};

const statusColors: Record<string, string> = {
  DISPONIBLE: '#2ecc71',
  EN_REUNION: '#f2994a',
  ALMUERZO: '#de7426',
  VACACIONES: '#00658d',
  CAPACITACION: '#cee2f2',
  FUERA_OFICINA: '#9ca3af',
  NO_DISPONIBLE: '#ba1a1a',
};

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ src, name = '', size = 'md', status, ...props }, ref) => {
  const avatar = (
    <AntAvatar src={src || undefined} size={sizeMap[size]} style={{ backgroundColor: '#de7426', fontWeight: 700 }}>
      {!src && getInitials(name)}
    </AntAvatar>
  );
  return (
    <div ref={ref} {...props}>
      {status ? <Badge dot color={statusColors[status] || '#9ca3af'} offset={[-4, sizeMap[size] - 8]}>{avatar}</Badge> : avatar}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
