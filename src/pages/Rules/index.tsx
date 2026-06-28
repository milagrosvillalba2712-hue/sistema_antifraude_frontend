import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileText,
  Loader2,
  Plus,
  Pencil,
  Power,
  X,
} from 'lucide-react';
import { rulesApi } from '../../api';
import { formatDate, reglaSchema, type ReglaFormData } from '../../utils';
import type { ReglaRiesgo } from '../../types';

const Rules = () => {
  const [rules, setRules] = useState<ReglaRiesgo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ReglaRiesgo | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReglaFormData>({
    resolver: zodResolver(reglaSchema),
  });

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rulesApi.getAll();
      setRules(data);
    } catch (err) {
      setError('Error al cargar las reglas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const onSubmit = async (data: ReglaFormData) => {
    try {
      if (editingRule) {
        await rulesApi.update(editingRule.id, data);
      } else {
        await rulesApi.create(data);
      }
      setShowForm(false);
      setEditingRule(null);
      reset();
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await rulesApi.toggle(id);
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (rule: ReglaRiesgo) => {
    setEditingRule(rule);
    setShowForm(true);
    reset({
      nombre: rule.nombre,
      descripcion: rule.descripcion || '',
      tipoRegla: rule.tipoRegla || '',
      severidad: rule.severidad || '',
      condicion: rule.condicion,
      activa: rule.activa,
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
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
        <FileText className="w-12 h-12 text-critical mx-auto mb-4" />
        <p className="text-critical">{error}</p>
        <button
          onClick={fetchRules}
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
        <h1 className="text-secondary font-semibold text-2xl">Reglas de Negocio</h1>
        <button
          onClick={() => {
            setEditingRule(null);
            setShowForm(true);
            reset();
          }}
          className="flex items-center px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity font-bold text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Regla
        </button>
      </div>

      {/* Rules Table */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container-highest">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Severidad</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Estado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {rules.map((rule) => (
                <tr key={rule.id} className="row-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-secondary">{rule.nombre}</div>
                    {rule.descripcion && (
                      <div className="text-xs text-secondary/60 truncate max-w-xs mt-1">
                        {rule.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {rule.tipoRegla || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {rule.severidad || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${
                      rule.activa
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-container text-secondary/60'
                    }`}>
                      {rule.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {formatDate(rule.fechaCreacion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-secondary hover:bg-secondary/5 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(rule.id)}
                        className={`p-2 rounded-full transition-colors ${
                          rule.activa
                            ? 'text-critical hover:bg-critical/10'
                            : 'text-success hover:bg-success/10'
                        }`}
                        title={rule.activa ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
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
                {editingRule ? 'Editar Regla' : 'Nueva Regla'}
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
                  placeholder="Nombre de la regla"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-error">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Descripción
                </label>
                <textarea
                  {...register('descripcion')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  rows={3}
                  placeholder="Descripción de la regla"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Tipo
                  </label>
                  <input
                    {...register('tipoRegla')}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                    placeholder="Tipo de regla"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Severidad
                  </label>
                  <select
                    {...register('severidad')}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Condición *
                </label>
                <textarea
                  {...register('condicion')}
                  className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none font-mono text-sm"
                  rows={4}
                  placeholder="Condición de la regla (Drools)"
                />
                {errors.condicion && (
                  <p className="mt-1 text-sm text-error">{errors.condicion.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('activa')}
                  id="activa"
                  className="h-4 w-4 text-primary-container focus:ring-primary-container/20 border-surface-container-highest rounded"
                />
                <label htmlFor="activa" className="ml-2 text-sm text-secondary">
                  Activa
                </label>
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
                  ) : editingRule ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Regla'
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

export default Rules;
