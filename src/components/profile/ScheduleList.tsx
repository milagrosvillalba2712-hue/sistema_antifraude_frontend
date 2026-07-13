import { useState } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils';
import type { Disponibilidad } from '../../types';

interface ScheduleListProps {
  schedules: Disponibilidad[];
  onCancel: (id: number) => Promise<void>;
}

const tipoEstadoLabels: Record<string, string> = {
  VACACIONES: 'Vacaciones',
  ALMUERZO: 'Almuerzo',
  EN_REUNION: 'Reunión',
  FUERA_OFICINA: 'Fuera de oficina',
  CAPACITACION: 'Capacitación',
  NO_DISPONIBLE: 'No disponible',
};

export default function ScheduleList({ schedules, onCancel }: ScheduleListProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const activeSchedules = schedules.filter((s) => s.activo);

  if (activeSchedules.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
        <h3 className="text-sm font-bold text-secondary/60 uppercase mb-4">Programaciones activas</h3>
        <div className="text-center py-6">
          <Calendar className="w-8 h-8 text-secondary/30 mx-auto mb-2" />
          <p className="text-sm text-secondary/60">No hay programaciones activas</p>
        </div>
      </div>
    );
  }

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await onCancel(id);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
      <h3 className="text-sm font-bold text-secondary/60 uppercase mb-4">Programaciones activas</h3>
      <div className="space-y-3">
        {activeSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between p-3 bg-surface-container-low/50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-secondary">
                {schedule.tipoEstado ? (tipoEstadoLabels[schedule.tipoEstado] || schedule.tipoEstado) : schedule.estado}
              </p>
              <p className="text-xs text-secondary/60">
                {schedule.fechaInicio && formatDate(schedule.fechaInicio)}
                {schedule.fechaFin && ` - ${formatDate(schedule.fechaFin)}`}
              </p>
              {schedule.motivo && (
                <p className="text-xs text-secondary/40 mt-1">{schedule.motivo}</p>
              )}
            </div>
            <button
              onClick={() => handleCancel(schedule.id)}
              disabled={cancellingId === schedule.id}
              className="p-2 text-error hover:bg-error/10 rounded-full transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
