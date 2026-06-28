import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2,
  Activity,
  Zap,
} from 'lucide-react';
import { dashboardApi } from '../../api';
import { formatNumber } from '../../utils';
import type { DashboardResponse } from '../../types';
import { connectWebSocket, disconnectWebSocket } from '../../websocket';

const COLORS = ['#DE7426', '#F2994A', '#009bd5', '#2ECC71', '#4e616e'];

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
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-primary-container text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const transaccionesPorEstadoData = Object.entries(data.transaccionesPorEstado).map(
    ([name, value]) => ({ name, value })
  );

  const scoreData = [
    { name: 'Promedio', score: data.promedioScoreRiesgo },
    { name: 'Máximo', score: 100 },
  ];

  return (
    <div className="space-y-gutter">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Total Alertas */}
        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-success text-xs font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 12%
            </span>
          </div>
          <p className="text-secondary/60 text-sm mb-1">Total Alertas (24h)</p>
          <h3 className="text-secondary text-2xl font-bold">{formatNumber(data.alertasPendientes + data.alertasResueltas)}</h3>
        </div>

        {/* Riesgo Crítico */}
        <div className="bg-white p-5 rounded-xl border-l-4 border-l-critical border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-critical/10 rounded-lg">
              <Activity className="w-5 h-5 text-critical" />
            </div>
            <span className="text-critical text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> +3 hoy
            </span>
          </div>
          <p className="text-secondary/60 text-sm mb-1">Casos Críticos</p>
          <h3 className="text-critical text-2xl font-bold">{formatNumber(data.transaccionesSospechosas)}</h3>
        </div>

        {/* Casos Resueltos */}
        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <span className="text-success text-xs font-bold">
              {data.alertasResueltas + data.alertasPendientes > 0
                ? Math.round((data.alertasResueltas / (data.alertasResueltas + data.alertasPendientes)) * 100)
                : 0}% Eff.
            </span>
          </div>
          <p className="text-secondary/60 text-sm mb-1">Casos Resueltos</p>
          <h3 className="text-secondary text-2xl font-bold">{formatNumber(data.alertasResueltas)}</h3>
        </div>

        {/* Score Promedio */}
        <div className="bg-white p-5 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <Zap className="w-5 h-5 text-tertiary" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-3 bg-tertiary rounded-full animate-pulse"></div>
              <div className="w-1 h-4 bg-tertiary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-2 bg-tertiary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <p className="text-secondary/60 text-sm mb-1">Score Riesgo Promedio</p>
          <h3 className="text-secondary text-2xl font-bold">{data.promedioScoreRiesgo.toFixed(1)}</h3>
        </div>
      </div>

      {/* Live Feed Section */}
      <div className="bg-secondary rounded-xl p-6 overflow-hidden relative soc-glow">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-critical rounded-full animate-ping"></div>
            <h2 className="text-white font-semibold text-lg">Live Fraud Monitoring Feed</h2>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/10 text-white/70 text-[10px] font-bold rounded-full uppercase tracking-widest border border-white/10">
              Engine Status: Active
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3 h-[320px] overflow-y-auto scrollbar-hide pr-2">
            {data.alertasPendientes > 0 && (
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-2 h-10 bg-critical rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-bold text-sm">ALERT_{data.alertasPendientes}_PENDIENTE</span>
                    <span className="text-critical font-bold text-xs">CRITICAL</span>
                  </div>
                  <p className="text-white/50 text-xs font-medium">Alertas pendientes de revisión • Monitoreo activo</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-mono">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}
            {data.transaccionesSospechosas > 0 && (
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-2 h-10 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-white font-bold text-sm">TX_{data.transaccionesSospechosas}_SOSPECHOSA</span>
                    <span className="text-warning font-bold text-xs">HIGH RISK</span>
                  </div>
                  <p className="text-white/50 text-xs font-medium">Transacciones sospechosas detectadas • Monitoreo activo</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-xs font-mono">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-2 h-10 bg-success rounded-full"></div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-white font-bold text-sm">SYSTEM_NORMAL</span>
                  <span className="text-success font-bold text-xs">CLEARED</span>
                </div>
                <p className="text-white/50 text-xs font-medium">Sistema operando normalmente • Monitoreo activo</p>
              </div>
              <div className="text-right">
                <p className="text-white text-xs font-mono">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col justify-between">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase mb-4">Resumen del Sistema</p>
              <div className="aspect-video bg-secondary-container/10 rounded flex items-center justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
                <div className="z-10 text-center">
                  <Activity className="w-12 h-12 text-white/20" />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-white/40 text-[10px] font-bold uppercase mb-2">System Load</p>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary-container w-[65%]"></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/60 text-[10px]">Score: {data.promedioScoreRiesgo.toFixed(1)}</span>
                <span className="text-white/60 text-[10px]">Alertas: {data.alertasPendientes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Alertas por Severidad */}
        <div className="bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-secondary font-semibold text-lg">Alertas por Severidad</h3>
            <select className="text-xs bg-surface-container-low border-none rounded-md px-3 py-1 text-secondary font-bold focus:ring-0">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
          </div>
          <div className="flex items-center gap-12 py-4">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-[12px] border-surface-container"></div>
              <div className="absolute inset-0 rounded-full border-[12px] border-critical" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)' }}></div>
              <div className="absolute inset-0 rounded-full border-[12px] border-warning" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-secondary font-bold text-xl">{formatNumber(data.alertasPendientes + data.alertasResueltas)}</span>
                <span className="text-secondary/40 text-[10px] font-bold uppercase">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-critical"></div>
                  <span className="text-sm font-medium text-secondary">Crítico</span>
                </div>
                <span className="text-sm font-bold text-secondary">
                  {data.alertasPendientes + data.alertasResueltas > 0
                    ? Math.round((data.transaccionesSospechosas / (data.alertasPendientes + data.alertasResueltas)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium text-secondary">Alto</span>
                </div>
                <span className="text-sm font-bold text-secondary">35%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                  <span className="text-sm font-medium text-secondary">Medio</span>
                </div>
                <span className="text-sm font-bold text-secondary">40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tendencia Semanal */}
        <div className="bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-secondary font-semibold text-lg">Tendencia Semanal de Riesgo</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                <span className="text-[10px] font-bold text-secondary/60">Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-surface-variant"></div>
                <span className="text-[10px] font-bold text-secondary/60">Sem. Pasada</span>
              </div>
            </div>
          </div>
          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((day) => (
              <div key={day} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full bg-surface-container-low rounded-t h-16 relative">
                  <div className="absolute bottom-0 w-full bg-primary-container rounded-t" style={{ height: `${40 + Math.random() * 60}%` }}></div>
                </div>
                <span className="text-[10px] text-secondary/40 font-bold">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score de Riesgo Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm">
          <h3 className="text-secondary font-semibold text-lg mb-6">Transacciones por Estado</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={transaccionesPorEstadoData}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              outerRadius={100}
              fill="#DE7426"
              dataKey="value"
            >
              {transaccionesPorEstadoData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm">
          <h3 className="text-secondary font-semibold text-lg mb-6">Score de Riesgo Promedio</h3>
          <LineChart width={400} height={300} data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef1" />
            <XAxis dataKey="name" stroke="#4e616e" />
            <YAxis domain={[0, 100]} stroke="#4e616e" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#DE7426"
              strokeWidth={2}
              dot={{ r: 6, fill: '#DE7426' }}
            />
          </LineChart>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white p-6 rounded-xl border border-surface-container-highest shadow-sm">
        <h3 className="text-secondary font-semibold text-lg mb-4">Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-surface-container-low rounded-lg">
            <p className="text-secondary/60 text-sm mb-1">Score Promedio</p>
            <p className="text-2xl font-bold text-secondary">{data.promedioScoreRiesgo.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-surface-container-low rounded-lg">
            <p className="text-secondary/60 text-sm mb-1">Tasa de Detección</p>
            <p className="text-2xl font-bold text-secondary">
              {data.totalTransacciones > 0
                ? ((data.transaccionesSospechosas / data.totalTransacciones) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-surface-container-low rounded-lg">
            <p className="text-secondary/60 text-sm mb-1">Tasa de Resolución</p>
            <p className="text-2xl font-bold text-secondary">
              {data.alertasPendientes + data.alertasResueltas > 0
                ? ((data.alertasResueltas / (data.alertasPendientes + data.alertasResueltas)) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
