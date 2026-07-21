import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Input, Row, Col, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
    setLoading(true);
    setError(null);
    try {
      setHistorial(await motorApi.getHistorial());
    } catch (err) {
      console.error(err);
      setError('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const filteredHistorial = useMemo(() => historial.filter((item) => {
    const matchesTransaction = !filterTransaccion || item.transaccionCodigo?.toLowerCase().includes(filterTransaccion.toLowerCase());
    const matchesRule = !filterRegla || item.reglaCodigo.toLowerCase().includes(filterRegla.toLowerCase());
    return matchesTransaction && matchesRule;
  }), [filterRegla, filterTransaccion, historial]);

  const columns: ColumnsType<EjecucionRegla> = [
    { title: 'Transacción', render: (_, item) => item.transaccionCodigo || `TX-${item.transaccionId}` },
    { title: 'Regla', render: (_, item) => <Space direction="vertical" size={0}><Typography.Text strong>{item.reglaCodigo}</Typography.Text><Typography.Text type="secondary">{item.reglaNombre}</Typography.Text></Space> },
    { title: 'Version', dataIndex: 'versionReglaEvaluada', render: (value) => `v${value}` },
    { title: 'Resultado', dataIndex: 'resultadoBooleano', render: (value) => value ? <Tag icon={<CheckCircleOutlined />} color="green">Cumplio</Tag> : <Tag icon={<CloseCircleOutlined />} color="default">No Cumplio</Tag> },
    { title: 'Score', dataIndex: 'scoreAportado', render: (value) => `+${value}` },
    { title: 'Tiempo', dataIndex: 'tiempoEjecucionMs', render: (value) => `${value || 0} ms` },
    { title: 'Fecha', dataIndex: 'fechaEjecucion', render: (value) => formatDate(value) },
  ];

  const totalScore = filteredHistorial.reduce((sum, item) => sum + item.scoreAportado, 0);
  const totalTime = filteredHistorial.reduce((sum, item) => sum + (item.tiempoEjecucionMs || 0), 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="end" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>Historial de Ejecución del Motor</Typography.Title>
          <Typography.Text type="secondary">Registro de evaluaciones realizadas por el motor de reglas.</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchHistorial}>Actualizar</Button>
      </Space>
      {error && <Alert type="error" showIcon message={error} />}
      <Card>
        <Space wrap style={{ width: '100%' }}>
          <Input allowClear placeholder="Filtrar por transacción" value={filterTransaccion} onChange={(event) => setFilterTransaccion(event.target.value)} style={{ maxWidth: 320 }} />
          <Input allowClear placeholder="Filtrar por regla" value={filterRegla} onChange={(event) => setFilterRegla(event.target.value)} style={{ maxWidth: 320 }} />
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Card><Statistic title="Total Reglas" value={filteredHistorial.length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Score Total" value={totalScore} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Tiempo Total" value={totalTime} suffix="ms" /></Card></Col>
      </Row>
      <Table rowKey="id" columns={columns} dataSource={filteredHistorial} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} />
    </Space>
  );
};

export default MotorHistorial;
