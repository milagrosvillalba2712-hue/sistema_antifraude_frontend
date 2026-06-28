import { useState } from 'react';
import { FileText, Download, Loader2, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../../api';

const Reports = () => {
  const [alertaId, setAlertaId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!alertaId) {
      setError('Ingrese un ID de alerta');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const blob = await reportsApi.exportRos(parseInt(alertaId));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ROS_${alertaId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Error al exportar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-gutter">
      <h1 className="text-secondary font-semibold text-2xl">Reportes ROS</h1>

      {/* Export Form */}
      <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
        <h2 className="text-secondary font-semibold text-lg mb-4">Exportar Reporte de Operaciones Sospechosas</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">
              ID de Alerta
            </label>
            <input
              type="number"
              value={alertaId}
              onChange={(e) => setAlertaId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
              placeholder="Ingrese el ID de la alerta"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={loading || !alertaId}
            className="px-6 py-2 bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center font-bold text-sm transition-opacity"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container/30 border border-error-container rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-error mr-2" />
            <p className="text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-white rounded-xl border border-surface-container-highest shadow-sm p-6">
        <div className="flex items-start">
          <FileText className="w-6 h-6 text-primary-container mt-1" />
          <div className="ml-4">
            <h3 className="text-secondary font-semibold text-lg">Acerca de los Reportes ROS</h3>
            <p className="text-secondary/70 mt-2">
              Los Reportes de Operaciones Sospechosas (ROS) se generan a partir de alertas
              del sistema. Cada reporte contiene información detallada sobre la transacción,
              la regla que se activó y la evaluación realizada.
            </p>
            <ul className="list-disc list-inside text-secondary/70 mt-2 space-y-1">
              <li>El reporte se exporta en formato CSV</li>
              <li>Se incluye información de la alerta y la transacción asociada</li>
              <li>Los reportes son generados por el usuario actual</li>
              <li>Se registra la fecha y hora de generación</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
