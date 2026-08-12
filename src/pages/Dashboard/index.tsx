import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Progress, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi } from '../../api';
import { formatNumber } from '../../utils';
import type { DashboardResponse } from '../../types';
import { connectWebSocket, disconnectWebSocket } from '../../websocket';

const COLORS = ['#de7426', '#f2994a', '#009bd5', '#2ecc71', '#4e616e'];

const Dashboard = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await dashboardApi.get());
    } catch (err) {
      console.error(err);
      setError('Error al cargar el dashboard');
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

  const transactionStateData = useMemo(() => Object.entries(data?.transaccionesPorEstado || {}).map(([name, value]) => ({ name, value })), [data]);
  const scoreData = useMemo(() => [
    { name: 'Promedio', score: data?.promedioScoreRiesgo || 0 },
    { name: 'Maximo', score: 100 },
  ], [data]);
  const alertRows = useMemo(() => [
    { key: 'pendientes', evento: 'Alertas pendientes', estado: 'EN_REVISION', valor: data?.alertasPendientes || 0 },
    { key: 'sospechosas', evento: 'Transacciones sospechosas', estado: 'ALTA', valor: data?.transaccionesSospechosas || 0 },
    { key: 'resueltas', evento: 'Alertas resueltas', estado: 'CERRADA', valor: data?.alertasResueltas || 0 },
  ], [data]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="end" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>Dashboard</Typography.Title>
          <Typography.Text type="secondary">Monitoreo operativo del sistema antifraude.</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>Actualizar</Button>
      </Space>

      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={fetchData}>Reintentar</Button>} />}

      <Row gutter={[16, 16]}>
        <Metric title="Total Alertas 24h" value={(data?.alertasPendientes || 0) + (data?.alertasResueltas || 0)} icon={<AlertOutlined />} loading={loading} />
        <Metric title="Casos Criticos" value={data?.transaccionesSospechosas || 0} icon={<WarningOutlined />} loading={loading} color="#ba1a1a" />
        <Metric title="Casos Resueltos" value={data?.alertasResueltas || 0} icon={<CheckCircleOutlined />} loading={loading} />
        <Metric title="Score Riesgo Promedio" value={Number(data?.promedioScoreRiesgo || 0).toFixed(1)} icon={<ThunderboltOutlined />} loading={loading} />
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title={<Space><DashboardOutlined />Actividad Reciente</Space>} extra={<Tag color="processing">Tiempo real</Tag>}>
            <Table
              rowKey="key"
              size="middle"
              loading={loading}
              dataSource={alertRows}
              pagination={false}
              columns={[
                { title: 'Evento', dataIndex: 'evento' },
                { title: 'Estado', dataIndex: 'estado', render: (value) => <Tag color={value === 'CERRADA' ? 'green' : value === 'ALTA' ? 'red' : 'blue'}>{value}</Tag> },
                { title: 'Cantidad', dataIndex: 'valor', align: 'right', render: (value) => formatNumber(value) },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Carga Del Sistema">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Progress percent={Math.min(100, Math.round(data?.promedioScoreRiesgo || 0))} status={(data?.promedioScoreRiesgo || 0) > 70 ? 'exception' : 'active'} />
              <Statistic title="Alertas Pendientes" value={data?.alertasPendientes || 0} />
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Alertas Por Estado" extra={<Select size="small" defaultValue="24h" options={[{ value: '24h', label: '24h' }, { value: '7d', label: '7 dias' }]} />}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={transactionStateData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {transactionStateData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Tendencia De Score">
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#de7426" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

const Metric = ({ title, value, icon, loading, color }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean; color?: string }) => (
  <Col xs={24} sm={12} xl={6}>
    <Card>
      <Statistic title={title} value={value} prefix={icon} loading={loading} valueStyle={color ? { color } : undefined} />
    </Card>
  </Col>
);

export default Dashboard;
