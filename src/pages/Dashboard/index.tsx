import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../../api';
import { formatNumber } from '../../utils';
import type { DashboardResponse } from '../../types';
import { connectWebSocket, disconnectWebSocket } from '../../websocket';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.get();
      setData(response);
    } catch (err) {
      setError('Error al cargar el dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = connectWebSocket();
    socket.on('dashboard:update', fetchData);

    return () => {
      socket.off('dashboard:update', fetchData);
      disconnectWebSocket();
    };
  }, [fetchData]);

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
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const alertasPorPrioridadData = Object.entries(data.alertasPorPrioridad).map(
    ([name, value]) => ({ name, value })
  );

  const transaccionesPorEstadoData = Object.entries(data.transaccionesPorEstado).map(
    ([name, value]) => ({ name, value })
  );

  const scoreData = [
    { name: 'Promedio', score: data.promedioScoreRiesgo },
    { name: 'Máximo', score: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchData}
          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.totalTransacciones)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Sospechosas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.transaccionesSospechosas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Alertas Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.alertasPendientes)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Alertas Resueltas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data.alertasResueltas)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas por Prioridad */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas por Prioridad
          </h2>
          <BarChart width={400} height={300} data={alertasPorPrioridadData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </div>

        {/* Transacciones por Estado */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Transacciones por Estado
          </h2>
          <PieChart width={400} height={300}>
            <Pie
              data={transaccionesPorEstadoData}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) =>
                `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
              outerRadius={100}
              fill="#8884D8"
              dataKey="value"
            >
              {transaccionesPorEstadoData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Score de Riesgo Promedio */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Score de Riesgo Promedio
          </h2>
          <LineChart width={400} height={300} data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 6 }}
            />
          </LineChart>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Score Promedio:</span>
              <span className="font-semibold">{data.promedioScoreRiesgo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasa de Detección:</span>
              <span className="font-semibold">
                {data.totalTransacciones > 0
                  ? ((data.transaccionesSospechosas / data.totalTransacciones) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasa de Resolución:</span>
              <span className="font-semibold">
                {data.alertasPendientes + data.alertasResueltas > 0
                  ? (
                      (data.alertasResueltas /
                        (data.alertasPendientes + data.alertasResueltas)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
