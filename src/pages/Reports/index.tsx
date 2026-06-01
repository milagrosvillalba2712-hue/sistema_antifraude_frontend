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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes ROS</h1>

      {/* Export Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Exportar Reporte de Operaciones Sospechosas</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID de Alerta
            </label>
            <input
              type="number"
              value={alertaId}
              onChange={(e) => setAlertaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese el ID de la alerta"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={loading || !alertaId}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start">
          <FileText className="w-6 h-6 text-blue-600 mt-1" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold">Acerca de los Reportes ROS</h3>
            <p className="text-gray-600 mt-2">
              Los Reportes de Operaciones Sospechosas (ROS) se generan a partir de alertas
              del sistema. Cada reporte contiene información detallada sobre la transacción,
              la regla que se activó y la evaluación realizada.
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
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
