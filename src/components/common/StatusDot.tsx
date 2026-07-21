import type { EstadoUsuario } from '../../types';

interface StatusDotProps {
  status: EstadoUsuario | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<string, string> = {
  DISPONIBLE: '#2ecc71',
  EN_REUNION: '#f2994a',
  ALMUERZO: '#de7426',
  VACACIONES: '#00658d',
  CAPACITACION: '#cee2f2',
  FUERA_OFICINA: '#8c8c8c',
  NO_DISPONIBLE: '#ba1a1a',
  PENDIENTE: '#f2994a',
  ASIGNADA: '#009bd5',
  INVESTIGANDO: '#cee2f2',
  RESUELTA: '#2ecc71',
  DESCARTADA: '#8c8c8c',
};

const sizeClasses = {
  sm: 8,
  md: 12,
  lg: 16,
};

export default function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: sizeClasses[size],
        height: sizeClasses[size],
        borderRadius: '50%',
        backgroundColor: statusColors[status] || '#8c8c8c',
      }}
    />
  );
}
