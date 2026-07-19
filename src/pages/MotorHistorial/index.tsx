import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  History,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { motorApi } from '../../api';
import { formatDate } from '../../utils';
import type { EjecucionRegla } from '../../types';

const MotorHistorial = () => {
  const [historial, setHistorial] = useState<EjecucionRegla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTransaccion, setFilterTransaccion] = useState('');
  const [filterRegla, setFilterRegla] = useState('');

  const fetchHistorial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await motorApi.getHistorial();
      setHistorial(data);
    } catch (err) {
      setError('Error al cargar el historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const filteredHistorial = historial.filter((item) => {
    if (filterTransaccion && !item.transaccionCodigo?.toLowerCase().includes(filterTransaccion.toLowerCase())) {
      return false;
    }
    if (filterRegla && !item.reglaCodigo.toLowerCase().includes(filterRegla.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalScore = filteredHistorial.reduce((sum, item) => sum + item.scoreAportado, 0);
  const totalTime = filteredHistorial.reduce((sum, item) => sum + (item.tiempoEjecucionMs || 0), 0);

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
        <History className="w-12 h-12 text-critical mx-auto mb-4" />
        <p className="text-critical">{error}</p>
        <button
          onClick={fetchHistorial}
          className="mt-4 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-gutter">
      <div>
        <h1 className="text-secondary font-semibold text-2xl">Historial de Ejecución del Motor</h1>
        <p className="text-secondary/60 text-sm mt-1">
          Registro de todas las evaluaciones realizadas por Drools
        </p>
      </div>

      {/* Filters */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-secondary/60" />
          <input
            type="text"
            value={filterTransaccion}
            onChange={(e) => setFilterTransaccion(e.target.value)}
            placeholder="Filtrar por transacción..."
            className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary text-sm focus:ring-2 focus:ring-primary-container/20 focus:outline-none flex-1"
          />
          <input
            type="text"
            value={filterRegla}
            onChange={(e) => setFilterRegla(e.target.value)}
            placeholder="Filtrar por regla..."
            className="px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary text-sm focus:ring-2 focus:ring-primary-container/20 focus:outline-none flex-1"
          />
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4 text-center">
          <p className="text-sm text-secondary/60 mb-1">Total Reglas</p>
          <p className="text-2xl font-bold text-secondary">{filteredHistorial.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4 text-center">
          <p className="text-sm text-secondary/60 mb-1">Score Total</p>
          <p className="text-2xl font-bold text-secondary">{totalScore}</p>
        </div>
        <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-4 text-center">
          <p className="text-sm text-secondary/60 mb-1">Tiempo Total</p>
          <p className="text-2xl font-bold text-secondary">{totalTime}ms</p>
        </div>
      </div>

      {/* Table */}
      <section className="bg-white rounded-xl border border-surface-container-highest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container-highest">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Transacción</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Regla</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Versión</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Resultado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Tiempo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-secondary/60">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
              {filteredHistorial.map((item) => (
                <tr key={item.id} className="row-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary">
                    {item.transaccionCodigo || `TX-${item.transaccionId}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-secondary">{item.reglaCodigo}</div>
                    <div className="text-xs text-secondary/60">{item.reglaNombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    v{item.versionReglaEvaluada}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.resultadoBooleano ? (
                      <span className="flex items-center gap-1 text-success text-sm">
                        <CheckCircle className="w-4 h-4" /> Cumplió
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-secondary/40 text-sm">
                        <XCircle className="w-4 h-4" /> No cumplió
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary">
                    +{item.scoreAportado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {item.tiempoEjecucionMs ? `${item.tiempoEjecucionMs}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {formatDate(item.fechaHoraEjecucion)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MotorHistorial;
