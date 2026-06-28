import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users as UsersIcon,
  Loader2,
  Plus,
  Pencil,
  UserX,
  X,
} from 'lucide-react';
import { usersApi } from '../../api';
import { formatDate, usuarioSchema, type UsuarioFormData } from '../../utils';
import type { Usuario } from '../../types';

const Users = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, data);
      } else {
        await usersApi.create(data);
      }
      setShowForm(false);
      setEditingUser(null);
      reset();
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (window.confirm('¿Está seguro de desactivar este usuario?')) {
      try {
        await usersApi.deactivate(id);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setShowForm(true);
    reset({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="w-12 h-12 text-critical mx-auto mb-4" />
        <p className="text-critical">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-gutter">
      <div className="flex items-center justify-between">
        <h1 className="text-secondary font-semibold text-2xl">Gestión de Usuarios</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
            reset();
          }}
          className="flex items-center px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity font-bold text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container-highest">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Rol</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Estado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {users.map((user) => (
                <tr key={user.id} className="row-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary">
                    {user.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${
                      user.rol === 'ADMINISTRADOR'
                        ? 'bg-primary-container/10 text-primary-container'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${
                      user.activo
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {formatDate(user.fechaCreacion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-secondary hover:bg-secondary/5 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {user.activo && (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="p-2 text-critical hover:bg-critical/10 rounded-full transition-colors"
                          title="Desactivar"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 border border-surface-container-highest shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-secondary/40 hover:text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Nombre *
                </label>
                <input
                  {...register('nombre')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  placeholder="Nombre del usuario"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-error">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Email *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Rol *
                </label>
                <select
                  {...register('rol')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                >
                  <option value="ANALISTA">Analista</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
                {errors.rol && (
                  <p className="mt-1 text-sm text-error">{errors.rol.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-surface-container-highest rounded-lg text-secondary hover:bg-surface-container-low transition-colors text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-bold text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingUser ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
