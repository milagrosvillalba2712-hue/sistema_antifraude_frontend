import { Camera, Save } from 'lucide-react';
import { useState } from 'react';
import Avatar from '../common/Avatar';
import StatusDot from '../common/StatusDot';
import type { PerfilUsuario, EstadoUsuario } from '../../types';

interface ProfileCardProps {
  profile: PerfilUsuario;
  onSave: (data: { nombreVisible?: string; imagenPerfil?: string }) => Promise<void>;
}

const statusLabels: Record<EstadoUsuario, string> = {
  DISPONIBLE: 'Disponible',
  EN_REUNION: 'En reunión',
  ALMUERZO: 'Almorzando',
  VACACIONES: 'Vacaciones',
  CAPACITACION: 'Capacitación',
  FUERA_OFICINA: 'Fuera de oficina',
  NO_DISPONIBLE: 'No disponible',
  OCUPADO: 'Ocupado',
  AUSENTE: 'Ausente',
};

export default function ProfileCard({ profile, onSave }: ProfileCardProps) {
  const [nombreVisible, setNombreVisible] = useState(profile.nombreVisible || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ nombreVisible });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
      <div className="flex items-start gap-6">
        <div className="relative">
          <Avatar
            src={profile.imagenPerfil}
            name={profile.nombreVisible || ''}
            size="lg"
            status={profile.estado}
          />
          <button className="absolute bottom-0 right-0 p-1 bg-primary-container text-white rounded-full hover:opacity-90 transition-opacity">
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">
              Nombre visible
            </label>
            <input
              type="text"
              value={nombreVisible}
              onChange={(e) => setNombreVisible(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary/60 uppercase mb-1">
              Estado actual
            </label>
            <div className="flex items-center gap-2">
              <StatusDot status={profile.estado || 'DISPONIBLE'} />
              <span className="text-sm text-secondary">
                {profile.estado ? (statusLabels[profile.estado as EstadoUsuario] || profile.estado) : 'Sin estado'}
              </span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
