import { cn } from '../../utils';
import type { EstadoUsuario } from '../../types';

interface StatusDotProps {
  status: EstadoUsuario | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<string, string> = {
  DISPONIBLE: 'bg-success',
  EN_REUNION: 'bg-warning',
  ALMUERZO: 'bg-primary-container',
  VACACIONES: 'bg-tertiary',
  CAPACITACION: 'bg-secondary-container',
  FUERA_OFICINA: 'bg-secondary/40',
  NO_DISPONIBLE: 'bg-error',
  PENDIENTE: 'bg-warning',
  ASIGNADA: 'bg-tertiary',
  INVESTIGANDO: 'bg-secondary-container',
  RESUELTA: 'bg-success',
  DESCARTADA: 'bg-secondary/40',
};

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export default function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status] || 'bg-secondary/40',
        sizeClasses[size],
        className
      )}
    />
  );
}
