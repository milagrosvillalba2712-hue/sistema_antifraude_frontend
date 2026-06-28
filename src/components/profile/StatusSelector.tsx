import { useState } from 'react';
import StatusDot from '../common/StatusDot';
import type { EstadoUsuario } from '../../types';

interface StatusSelectorProps {
  currentStatus: EstadoUsuario;
  onSelect: (status: EstadoUsuario) => Promise<void>;
}

const statuses: { value: EstadoUsuario; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'EN_REUNION', label: 'En reunión' },
  { value: 'ALMUERZO', label: 'Almorzando' },
  { value: 'VACACIONES', label: 'Vacaciones' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'FUERA_OFICINA', label: 'Fuera de oficina' },
  { value: 'NO_DISPONIBLE', label: 'No disponible' },
];

export default function StatusSelector({ currentStatus, onSelect }: StatusSelectorProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (status: EstadoUsuario) => {
    setLoading(true);
    try {
      await onSelect(status);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
      <h3 className="text-sm font-bold text-secondary/60 uppercase mb-4">Cambiar estado</h3>
      <div className="space-y-2">
        {statuses.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleSelect(value)}
            disabled={loading || currentStatus === value}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentStatus === value
                ? 'bg-primary-container/10 text-primary-container font-bold'
                : 'text-secondary hover:bg-surface-container-low'
            } disabled:opacity-50`}
          >
            <StatusDot status={value} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
