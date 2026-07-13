import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  UserPlus,
  Users,
  Clock,
  FileText,
  History,
} from 'lucide-react';
import { alertsApi, assignmentApi } from '../../api';
import { formatDate } from '../../utils';
import type { Alerta, EstadoAlerta, PrioridadAlerta, HistorialAsignacion, TimelineEvent } from '../../types';

const ITEMS_PER_PAGE = 10;

const estadoColors: Record<EstadoAlerta, string> = {
  NUEVA: 'bg-warning/10 text-warning',
  ASIGNADA: 'bg-tertiary/10 text-tertiary',
  EN_REVISION: 'bg-secondary-container text-secondary',
  CERRADA: 'bg-success/10 text-success',
};

const prioridadColors: Record<PrioridadAlerta, string> = {
  BAJA: 'bg-surface-container text-secondary',
  MEDIA: 'bg-warning text-white',
  ALTA: 'bg-warning text-white',
  CRITICA: 'bg-critical text-white',
};

const prioridadBorder: Record<PrioridadAlerta, string> = {
  BAJA: 'border-l-secondary',
  MEDIA: 'border-l-warning',
  ALTA: 'border-l-warning',
  CRITICA: 'border-l-critical',
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoAlerta | ''>('');
  const [prioridadFilter, setPrioridadFilter] = useState<PrioridadAlerta | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'acciones'>('info');
  const [history, setHistory] = useState<HistorialAsignacion[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await alertsApi.getAll();
      setAlerts(data);
    } catch (err) {
      setError('Error al cargar las alertas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlertDetails = useCallback(async (alertId: number) => {
    try {
      const [historyData, timelineData] = await Promise.all([
        alertsApi.getHistory(alertId),
        alertsApi.getTimeline(alertId),
      ]);
      setHistory(historyData);
      setTimeline(timelineData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (selectedAlert) {
      loadAlertDetails(selectedAlert.id);
    }
  }, [selectedAlert, loadAlertDetails]);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.observacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.id.toString().includes(searchTerm);
    const matchesEstado = !estadoFilter || alert.estado === estadoFilter;
    const matchesPrioridad = !prioridadFilter || alert.prioridad === prioridadFilter;
    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAsignar = async (id: number) => {
    try {
      await assignmentApi.run(id);
      fetchAlerts();
      if (selectedAlert?.id === id) {
        const updated = await alertsApi.getById(id);
        setSelectedAlert(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolver = async (id: number) => {
    const observacion = prompt('Ingrese la observación de resolución:');
    if (observacion !== null) {
      try {
        await alertsApi.resolver(id, observacion);
        fetchAlerts();
        if (selectedAlert?.id === id) {
          const updated = await alertsApi.getById(id);
          setSelectedAlert(updated);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAutoAssign = async () => {
    try {
      await assignmentApi.autoAssign();
      fetchAlerts();
    } catch (err) {
      console.error(err);
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
        <AlertTriangle className="w-12 h-12 text-critical mx-auto mb-4" />
        <p className="text-critical">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-4 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--spacing-header-height)-var(--spacing-gutter)*2)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-secondary font-semibold text-2xl">Alertas</h1>
          <p className="text-secondary/60 text-sm mt-1">
            {filteredAlerts.length} alerta(s) encontrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoAssign}
            className="flex items-center px-4 py-2 bg-tertiary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-bold"
          >
            <Users className="w-4 h-4 mr-2" />
            Auto-asignar
          </button>
          <button
            onClick={fetchAlerts}
            className="flex items-center px-4 py-2 text-secondary/60 hover:text-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary/40" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary/40" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoAlerta | '')}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="NUEVA">Nueva</option>
              <option value="ASIGNADA">Asignada</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary/40" />
            <select
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value as PrioridadAlerta | '')}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-md text-sm text-secondary focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            >
              <option value="">Todas las prioridades</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>
          <div className="text-sm text-secondary/60 flex items-center">
            {filteredAlerts.length} resultado(s)
          </div>
        </div>
      </div>

      {/* Split Panel */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left Panel - Alert List */}
        <div className="w-2/5 flex flex-col bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {paginatedAlerts.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                <p className="text-secondary/60">No se encontraron alertas</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container-highest">
                {paginatedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 cursor-pointer border-l-4 transition-colors hover:bg-surface-container-low/50 ${
                      prioridadBorder[alert.prioridad]
                    } ${selectedAlert?.id === alert.id ? 'bg-primary-container/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-secondary/60">#{alert.id}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
                          prioridadColors[alert.prioridad]
                        }`}
                      >
                        {alert.prioridad}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          estadoColors[alert.estado]
                        }`}
                      >
                        {alert.estado}
                      </span>
                      {alert.asignadoA && (
                        <span className="text-xs text-secondary/60 flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />
                          Asignada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-secondary/60 truncate">
                      {alert.observacion || 'Sin observación'}
                    </p>
                    <p className="text-xs text-secondary/40 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(alert.fechaGeneracion)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-surface-container-low/20 border-t border-surface-container-highest flex items-center justify-between">
              <span className="text-xs text-secondary/60">
                {currentPage}/{totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-surface-container-highest rounded text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-surface-container-highest rounded text-secondary hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Alert Detail */}
        <div className="w-3/5 flex flex-col bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
          {selectedAlert ? (
            <>
              {/* Detail Header */}
              <div className="px-6 py-4 border-b border-surface-container-highest">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-secondary">
                      Alerta #{selectedAlert.id}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase ${
                        prioridadColors[selectedAlert.prioridad]
                      }`}
                    >
                      {selectedAlert.prioridad}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        estadoColors[selectedAlert.estado]
                      }`}
                    >
                      {selectedAlert.estado}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {selectedAlert.estado === 'NUEVA' && (
                      <button
                        onClick={() => handleAsignar(selectedAlert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-tertiary text-white rounded-lg text-xs font-bold hover:opacity-90"
                      >
                        <UserPlus className="w-3 h-3" />
                        Asignar
                      </button>
                    )}
                    {(selectedAlert.estado === 'ASIGNADA' || selectedAlert.estado === 'EN_REVISION') && (
                      <button
                        onClick={() => handleResolver(selectedAlert.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success text-white rounded-lg text-xs font-bold hover:opacity-90"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-surface-container-highest">
                {[
                  { key: 'info', label: 'Información', icon: FileText },
                  { key: 'timeline', label: 'Timeline', icon: History },
                  { key: 'acciones', label: 'Acciones', icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'text-primary-container border-b-2 border-primary-container'
                        : 'text-secondary/60 hover:text-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                        Observación
                      </h3>
                      <p className="text-sm text-secondary">
                        {selectedAlert.observacion || 'Sin observación'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                        Fechas
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-secondary/40">Generación</p>
                          <p className="text-sm text-secondary">
                            {formatDate(selectedAlert.fechaGeneracion)}
                          </p>
                        </div>
                        {selectedAlert.fechaResolucion && (
                          <div>
                            <p className="text-xs text-secondary/40">Resolución</p>
                            <p className="text-sm text-secondary">
                              {formatDate(selectedAlert.fechaResolucion)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedAlert.transaccionId && (
                      <div>
                        <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                          Transacción
                        </h3>
                        <p className="text-sm text-secondary">
                          ID: #{selectedAlert.transaccionId}
                        </p>
                      </div>
                    )}
                    {selectedAlert.reglaId && (
                      <div>
                        <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                          Regla activada
                        </h3>
                        <p className="text-sm text-secondary">
                          ID: #{selectedAlert.reglaId}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {timeline.length === 0 ? (
                      <p className="text-sm text-secondary/60 text-center py-8">
                        Sin eventos registrados
                      </p>
                    ) : (
                      timeline.map((event, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary-container" />
                            {idx < timeline.length - 1 && (
                              <div className="w-0.5 flex-1 bg-surface-container-highest mt-1" />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className="text-sm font-medium text-secondary">
                              {event.descripcion}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-secondary/40">
                                {formatDate(event.fecha)}
                              </p>
                              {event.usuario && (
                                <p className="text-xs text-secondary/60">
                                  por {event.usuario}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'acciones' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-secondary/60 uppercase">
                      Historial de asignaciones
                    </h3>
                    {history.length === 0 ? (
                      <p className="text-sm text-secondary/60 text-center py-8">
                        Sin historial de asignaciones
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {history.map((h) => (
                          <div
                            key={h.id}
                            className="p-3 bg-surface-container-low/50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                                  h.tipo === 'ASIGNACION'
                                    ? 'bg-tertiary/10 text-tertiary'
                                    : h.tipo === 'REASIGNACION'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-secondary-container text-secondary'
                                }`}
                              >
                                {h.tipo}
                              </span>
                              <span className="text-xs text-secondary/40">
                                {formatDate(h.fecha)}
                              </span>
                            </div>
                            <p className="text-sm text-secondary mt-2">
                              {h.usuarioOrigenNombre && `${h.usuarioOrigenNombre} → `}
                              {h.usuarioDestinoNombre}
                            </p>
                            {h.motivo && (
                              <p className="text-xs text-secondary/60 mt-1">{h.motivo}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Eye className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                <p className="text-secondary/60">Selecciona una alerta para ver los detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
