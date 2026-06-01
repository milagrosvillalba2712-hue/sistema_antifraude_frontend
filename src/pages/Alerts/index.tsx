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
} from 'lucide-react';
import { alertsApi } from '../../api';
import { formatDate } from '../../utils';
import type { Alerta, EstadoAlerta, PrioridadAlerta } from '../../types';

const ITEMS_PER_PAGE = 10;

const estadoColors: Record<EstadoAlerta, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  ASIGNADA: 'bg-blue-100 text-blue-800',
  INVESTIGANDO: 'bg-purple-100 text-purple-800',
  RESUELTA: 'bg-green-100 text-green-800',
  DESCARTADA: 'bg-gray-100 text-gray-800',
};

const prioridadColors: Record<PrioridadAlerta, string> = {
  BAJA: 'bg-gray-100 text-gray-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
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

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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
      await alertsApi.asignar(id);
      fetchAlerts();
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
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAlerts}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
        <button
          onClick={fetchAlerts}
          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoAlerta | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="ASIGNADA">Asignada</option>
              <option value="INVESTIGANDO">Investigando</option>
              <option value="RESUELTA">Resuelta</option>
              <option value="DESCARTADA">Descartada</option>
            </select>
          </div>

          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value as PrioridadAlerta | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las prioridades</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>

          <div className="text-sm text-gray-500 flex items-center">
            {filteredAlerts.length} alerta(s) encontrada(s)
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prioridad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedAlerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{alert.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      prioridadColors[alert.prioridad]
                    }`}
                  >
                    {alert.prioridad}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      estadoColors[alert.estado]
                    }`}
                  >
                    {alert.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {alert.observacion || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(alert.fechaGeneracion)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {alert.estado === 'PENDIENTE' && (
                      <button
                        onClick={() => handleAsignar(alert.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Asignar"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    {(alert.estado === 'ASIGNADA' || alert.estado === 'INVESTIGANDO') && (
                      <button
                        onClick={() => handleResolver(alert.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Resolver"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              Detalle de Alerta #{selectedAlert.id}
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Prioridad:</span>{' '}
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    prioridadColors[selectedAlert.prioridad]
                  }`}
                >
                  {selectedAlert.prioridad}
                </span>
              </div>
              <div>
                <span className="font-medium">Estado:</span>{' '}
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    estadoColors[selectedAlert.estado]
                  }`}
                >
                  {selectedAlert.estado}
                </span>
              </div>
              <div>
                <span className="font-medium">Observación:</span>{' '}
                {selectedAlert.observacion || '-'}
              </div>
              <div>
                <span className="font-medium">Fecha de generación:</span>{' '}
                {formatDate(selectedAlert.fechaGeneracion)}
              </div>
              {selectedAlert.fechaResolucion && (
                <div>
                  <span className="font-medium">Fecha de resolución:</span>{' '}
                  {formatDate(selectedAlert.fechaResolucion)}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
