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
  Filter,
} from 'lucide-react';
import { rulesApi, escenariosApi } from '../../api';
import { reglaSchema, type ReglaFormData } from '../../utils';
import type { ReglaRiesgo, Escenario, SeveridadRegla, EstadoRegla } from '../../types';

const Rules = () => {
  const [rules, setRules] = useState<ReglaRiesgo[]>([]);
  const [escenarios, setEscenarios] = useState<Escenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ReglaRiesgo | null>(null);
  const [filterEscenario, setFilterEscenario] = useState<number | ''>('');
  const [filterEstado, setFilterEstado] = useState<EstadoRegla | ''>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReglaFormData>({
    resolver: zodResolver(reglaSchema),
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rulesData, escenariosData] = await Promise.all([
        rulesApi.getAll(),
        escenariosApi.getAll(),
      ]);
      setRules(rulesData);
      setEscenarios(escenariosData);
    } catch (err) {
      setError('Error al cargar las reglas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRules = rules.filter((rule) => {
    if (filterEscenario && rule.escenarioId !== filterEscenario) return false;
    if (filterEstado && rule.estado !== filterEstado) return false;
    return true;
  });

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
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (rule: ReglaRiesgo) => {
    try {
      if (rule.estado === 'ACTIVA') {
        await rulesApi.desactivar(rule.id);
      } else {
        await rulesApi.activar(rule.id);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (rule: ReglaRiesgo) => {
    setEditingRule(rule);
    setShowForm(true);
    reset({
      escenarioId: rule.escenarioId,
      codigo: rule.codigo,
      nombre: rule.nombre,
      descripcion: rule.descripcion || '',
      severidad: rule.severidad,
      prioridad: rule.prioridad,
      score: rule.score,
      estado: rule.estado,
    });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
    reset();
  };

  const getSeveridadColor = (severidad: SeveridadRegla) => {
    switch (severidad) {
      case 'CRITICA': return 'bg-critical/10 text-critical';
      case 'ALTA': return 'bg-warning/10 text-warning';
      case 'MEDIA': return 'bg-primary-container/10 text-primary-container';
      case 'BAJA': return 'bg-success/10 text-success';
      default: return 'bg-surface-container text-secondary/60';
    }
  };

  const getEstadoColor = (estado: EstadoRegla) => {
    switch (estado) {
      case 'ACTIVA': return 'bg-success/10 text-success';
      case 'INACTIVA': return 'bg-surface-container text-secondary/60';
      case 'EN_PRUEBA': return 'bg-warning/10 text-warning';
      case 'BORRADOR': return 'bg-secondary/10 text-secondary';
      default: return 'bg-surface-container text-secondary/60';
    }
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
          onClick={fetchData}
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
        <h1 className="text-secondary font-semibold text-2xl">Reglas Drools</h1>
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

      {/* Filters */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-secondary/60" />
          <div className="flex-1">
            <select
              value={filterEscenario}
              onChange={(e) => setFilterEscenario(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary text-sm focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            >
              <option value="">Todos los escenarios</option>
              {escenarios.map((esc) => (
                <option key={esc.id} value={esc.id}>{esc.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as EstadoRegla | '')}
              className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary text-sm focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
              <option value="EN_PRUEBA">En Prueba</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </div>
        </div>
      </section>

      {/* Rules Table */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container-highest">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Código</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Nombre</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Escenario</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Severidad</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Versión</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Estado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="row-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary">
                    {rule.codigo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-secondary">{rule.nombre}</div>
                    {rule.descripcion && (
                      <div className="text-xs text-secondary/60 truncate max-w-xs mt-1">
                        {rule.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {rule.escenarioNombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${getSeveridadColor(rule.severidad)}`}>
                      {rule.severidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary">
                    {rule.score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    v{rule.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase ${getEstadoColor(rule.estado)}`}>
                      {rule.estado}
                    </span>
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
                        onClick={() => handleToggle(rule)}
                        className={`p-2 rounded-full transition-colors ${
                          rule.estado === 'ACTIVA'
                            ? 'text-critical hover:bg-critical/10'
                            : 'text-success hover:bg-success/10'
                        }`}
                        title={rule.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}
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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 border border-surface-container-highest shadow-lg max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Escenario *
                  </label>
                  <select
                    {...register('escenarioId', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                  >
                    <option value="">Seleccionar</option>
                    {escenarios.map((esc) => (
                      <option key={esc.id} value={esc.id}>{esc.nombre}</option>
                    ))}
                  </select>
                  {errors.escenarioId && (
                    <p className="mt-1 text-sm text-error">{errors.escenarioId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Código *
                  </label>
                  <input
                    {...register('codigo')}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none font-mono"
                    placeholder="AML001"
                  />
                  {errors.codigo && (
                    <p className="mt-1 text-sm text-error">{errors.codigo.message}</p>
                  )}
                </div>
              </div>

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
                  rows={2}
                  placeholder="Descripción de la regla"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Severidad *
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
                  {errors.severidad && (
                    <p className="mt-1 text-sm text-error">{errors.severidad.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Prioridad *
                  </label>
                  <input
                    type="number"
                    {...register('prioridad', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                    placeholder="10"
                  />
                  {errors.prioridad && (
                    <p className="mt-1 text-sm text-error">{errors.prioridad.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Score *
                  </label>
                  <input
                    type="number"
                    {...register('score', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
                    placeholder="0"
                  />
                  {errors.score && (
                    <p className="mt-1 text-sm text-error">{errors.score.message}</p>
                  )}
                </div>
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
