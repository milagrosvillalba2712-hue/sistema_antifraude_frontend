import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';

interface ScheduleFormProps {
  onSubmit: (schedule: {
    tipoEstado: string;
    fechaInicio: string;
    fechaFin?: string;
    esProgramado: boolean;
    motivo?: string;
  }) => Promise<void>;
}

const tipoOptions = [
  { value: 'VACACIONES', label: 'Vacaciones' },
  { value: 'ALMUERZO', label: 'Almuerzo' },
  { value: 'EN_REUNION', label: 'Reunión' },
  { value: 'FUERA_OFICINA', label: 'Fuera de oficina' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'NO_DISPONIBLE', label: 'No disponible' },
];

export default function ScheduleForm({ onSubmit }: ScheduleFormProps) {
  const [tipoEstado, setTipoEstado] = useState('VACACIONES');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio) return;
    setLoading(true);
    try {
      await onSubmit({
        tipoEstado,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: fechaFin ? new Date(fechaFin).toISOString() : undefined,
        esProgramado: true,
        motivo: motivo || undefined,
      });
      setFechaInicio('');
      setFechaFin('');
      setMotivo('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
      <h3 className="text-sm font-bold text-secondary/60 uppercase mb-4">Programar estado</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">
            Tipo de estado
          </label>
          <select
            value={tipoEstado}
            onChange={(e) => setTipoEstado(e.target.value)}
            className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
          >
            {tipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">
              Fecha/hora inicio
            </label>
            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">
              Fecha/hora fin
            </label>
            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">Motivo</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Opcional"
            className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !fechaInicio}
          className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-bold disabled:opacity-50"
        >
          <CalendarPlus className="w-4 h-4" />
          {loading ? 'Programando...' : 'Programar'}
        </button>
      </form>
    </div>
  );
}
