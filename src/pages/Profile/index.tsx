import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ProfileCard from '../../components/profile/ProfileCard';
import StatusSelector from '../../components/profile/StatusSelector';
import ScheduleForm from '../../components/profile/ScheduleForm';
import ScheduleList from '../../components/profile/ScheduleList';
import { useProfileStore } from '../../store/profileStore';
import type { EstadoUsuario } from '../../types';

const Profile = () => {
  const {
    profile,
    availability,
    loading,
    fetchProfile,
    fetchAvailability,
    updateProfile,
    updateStatus,
    createSchedule,
    cancelSchedule,
  } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    fetchAvailability();
  }, [fetchProfile, fetchAvailability]);

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-container" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-gutter">
      <div>
        <h1 className="text-secondary font-semibold text-2xl">Mi Perfil</h1>
        <p className="text-secondary/60 text-sm mt-1">Administra tu información y disponibilidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 space-y-gutter">
          <ProfileCard
            profile={profile}
            onSave={updateProfile}
          />
          <ScheduleForm onSubmit={createSchedule} />
        </div>
        <div className="space-y-gutter">
          <StatusSelector
            currentStatus={profile.estado as EstadoUsuario}
            onSelect={(status: EstadoUsuario) => updateStatus(status)}
          />
          <ScheduleList schedules={availability} onCancel={cancelSchedule} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
