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
  Clock,
  FileText,
  History,
} from 'lucide-react';
import { alertsApi } from '../../api';
import { formatDate } from '../../utils';
import type {
  Alerta,
  AlertaDetalle,
  AnalistaDisponible,
  EstadoAlerta,
  HistorialAsignacion,
  PrioridadAlerta,
  ResolucionAlertaRequest,
  TimelineEvent,
} from '../../types';

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
  const [detail, setDetail] = useState<AlertaDetalle | null>(null);
  const [analysts, setAnalysts] = useState<AnalistaDisponible[]>([]);
  const [assignTo, setAssignTo] = useState('');
  const [showResolution, setShowResolution] = useState(false);
  const [resolution, setResolution] = useState<ResolucionAlertaRequest>({
    resultado: 'FALSO_POSITIVO',
    conclusion: '',
    decision: '',
    justificacion: '',
    evidenciaDescripcion: '',
    contactoCliente: '',
    fondosRetenidos: false,
    movimientoLiberable: true,
    requiereRos: false,
    requiereBloqueo: false,
    requiereEscalamientoLegal: false,
  });

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
      const [historyData, timelineData, detailData, analystsData] = await Promise.all([
        alertsApi.getHistory(alertId),
        alertsApi.getTimeline(alertId),
        alertsApi.getDetail(alertId),
        alertsApi.getAnalistasDisponibles(),
      ]);
      setHistory(historyData);
      setTimeline(timelineData);
      setDetail(detailData);
      setAnalysts(analystsData);
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

  const handleAutoAsignarme = async (id: number) => {
    try {
      await alertsApi.autoasignarme(id);
      fetchAlerts();
      if (selectedAlert?.id === id) {
        const updated = await alertsApi.getById(id);
        setSelectedAlert(updated);
        loadAlertDetails(id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsignarAnalista = async (id: number) => {
    if (!assignTo) return;
    await alertsApi.asignar(id, Number(assignTo));
    await fetchAlerts();
    const updated = await alertsApi.getById(id);
    setSelectedAlert(updated);
    loadAlertDetails(id);
  };

  const handleResolverFormal = async () => {
    if (!selectedAlert) return;
    await alertsApi.resolverFormal(selectedAlert.id, resolution);
    setShowResolution(false);
    await fetchAlerts();
    const updated = await alertsApi.getById(selectedAlert.id);
    setSelectedAlert(updated);
    loadAlertDetails(selectedAlert.id);
  };

  const renderMap = (record?: Record<string, unknown>) => {
    const entries = Object.entries(record || {}).filter(([, value]) => value !== null && value !== undefined);
    if (!entries.length) return <p className="text-sm text-secondary/50">Sin datos disponibles</p>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-md bg-surface-container-low p-3">
            <p className="text-[10px] uppercase font-bold text-secondary/40">{key}</p>
            <p className="text-sm text-secondary break-words">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderHistoryRows = (rows: Record<string, unknown>[]) => (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="text-sm text-secondary/50">No hay historial transaccional para este cliente.</p>
      ) : rows.map((row, index) => (
        <div key={index} className="grid grid-cols-2 lg:grid-cols-4 gap-2 rounded-md bg-surface-container-low p-3 text-xs">
          {['codigo', 'monto', 'moneda', 'canal', 'fechaTransaccion', 'scoreRiesgo', 'estadoEvaluacion'].map((key) => (
            <div key={key}>
              <p className="font-bold uppercase text-secondary/40">{key}</p>
              <p className="text-secondary">{String(row[key] ?? '-')}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const updateResolution = (patch: Partial<ResolucionAlertaRequest>) => {
    setResolution((current) => {
      const next = { ...current, ...patch };
      if (patch.resultado === 'FRAUDE_CONFIRMADO') {
        next.requiereBloqueo = true;
        next.fondosRetenidos = true;
        next.movimientoLiberable = false;
      }
      if (patch.resultado === 'ROS_REQUERIDO') next.requiereRos = true;
      if (patch.resultado === 'FALSO_POSITIVO' || patch.resultado === 'OPERACION_JUSTIFICADA') {
        next.movimientoLiberable = true;
        next.fondosRetenidos = false;
      }
      return next;
    });
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
                      <div className="flex items-center gap-2">
                        <select
                          value={assignTo}
                          onChange={(event) => setAssignTo(event.target.value)}
                          className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs text-secondary outline-none"
                        >
                          <option value="">Analista disponible</option>
                          {analysts.map((analyst) => (
                            <option key={analyst.usuarioId} value={analyst.usuarioId}>
                              {analyst.nombre} - {analyst.estado} - {analyst.alertasActivas} activas
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAsignarAnalista(selectedAlert.id)}
                          disabled={!assignTo}
                          className="flex items-center gap-1 px-3 py-1.5 bg-tertiary text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
                        >
                          <UserPlus className="w-3 h-3" />
                          Asignar
                        </button>
                        <button
                          onClick={() => handleAutoAsignarme(selectedAlert.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-container text-white rounded-lg text-xs font-bold hover:opacity-90"
                        >
                          Autoasignarme
                        </button>
                      </div>
                    )}
                    {(selectedAlert.estado === 'ASIGNADA' || selectedAlert.estado === 'EN_REVISION') && (
                      <button
                        onClick={() => setShowResolution(true)}
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
                          Transacción Completa
                        </h3>
                        {renderMap(detail?.transaccion)}
                      </div>
                    )}
                    {selectedAlert.reglaId && (
                      <div>
                        <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                          Regla Y Escenario
                        </h3>
                        {renderMap(detail?.regla)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                        Cliente Y KYC
                      </h3>
                      {renderMap(detail?.cliente)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                        Servicios Externos
                      </h3>
                      {renderMap(detail?.serviciosExternos?.[0])}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                        Historial Transaccional Del Cliente
                      </h3>
                      {renderHistoryRows(detail?.historialTransaccional || [])}
                    </div>
                    {detail?.resolucion && (
                      <div>
                        <h3 className="text-xs font-bold text-secondary/60 uppercase mb-3">
                          Resolución Formal
                        </h3>
                        {renderMap(detail.resolucion as unknown as Record<string, unknown>)}
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
      {showResolution && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-surface-container-highest px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary">Resolución Formal</h2>
                <p className="text-xs text-secondary/50">Documenta evidencia, conclusión y decisión para la alerta #{selectedAlert.id}.</p>
              </div>
              <button onClick={() => setShowResolution(false)} className="rounded-md p-2 text-secondary hover:bg-surface-container-low">×</button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label className="text-sm font-medium text-secondary">
                Resultado
                <select value={resolution.resultado} onChange={(event) => updateResolution({ resultado: event.target.value as ResolucionAlertaRequest['resultado'] })} className="mt-1 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none">
                  <option value="FRAUDE_CONFIRMADO">Fraude Confirmado</option>
                  <option value="FALSO_POSITIVO">Falso Positivo</option>
                  <option value="OPERACION_JUSTIFICADA">Operación Justificada</option>
                  <option value="ESCALAR">Escalar</option>
                  <option value="ROS_REQUERIDO">ROS Requerido</option>
                </select>
                <span className="mt-1 block text-xs font-normal text-secondary/50">Define el resultado final de la investigación.</span>
              </label>
              {[
                ['conclusion', 'Conclusión', 'Resumen final del análisis realizado.'],
                ['decision', 'Decisión', 'Acción operativa que se tomará sobre la alerta.'],
                ['justificacion', 'Justificación', 'Motivo por el cual se toma esta decisión.'],
                ['evidenciaDescripcion', 'Evidencia', 'Documentos, capturas o referencias recopiladas.'],
                ['contactoCliente', 'Contacto Con Cliente', 'Resultado de validaciones o comunicación con el cliente.'],
              ].map(([key, label, help]) => (
                <label key={key} className="text-sm font-medium text-secondary md:col-span-2">
                  {label}
                  <textarea
                    value={String(resolution[key as keyof ResolucionAlertaRequest] ?? '')}
                    onChange={(event) => updateResolution({ [key]: event.target.value } as Partial<ResolucionAlertaRequest>)}
                    className="mt-1 min-h-20 w-full rounded-md bg-surface-container-low px-3 py-2 text-sm outline-none"
                    placeholder={help}
                  />
                  <span className="mt-1 block text-xs font-normal text-secondary/50">{help}</span>
                </label>
              ))}
              {[
                ['fondosRetenidos', 'Fondos Retenidos'],
                ['movimientoLiberable', 'Movimiento Liberable'],
                ['requiereRos', 'Requiere ROS'],
                ['requiereBloqueo', 'Requiere Bloqueo'],
                ['requiereEscalamientoLegal', 'Requiere Escalamiento Legal'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-md bg-surface-container-low p-3 text-sm font-medium text-secondary">
                  <input
                    type="checkbox"
                    checked={Boolean(resolution[key as keyof ResolucionAlertaRequest])}
                    onChange={(event) => updateResolution({ [key]: event.target.checked } as Partial<ResolucionAlertaRequest>)}
                  />
                  {label}
                </label>
              ))}
              <div className="flex justify-end gap-2 md:col-span-2">
                <button onClick={() => setShowResolution(false)} className="rounded-md border border-surface-container-highest px-4 py-2 text-sm font-semibold text-secondary">Cancelar</button>
                <button onClick={handleResolverFormal} className="rounded-md bg-success px-4 py-2 text-sm font-bold text-white">Guardar Resolución</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
