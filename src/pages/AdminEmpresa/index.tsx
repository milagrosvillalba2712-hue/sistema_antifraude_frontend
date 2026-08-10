import { useEffect, useState } from 'react';
import { CreditCardOutlined, SafetyCertificateOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { licensingApi } from '../../api';
import { useAuthStore } from '../../store';
import { ConsumoVsPlan, EventosLicencia, INSTALACION_STORAGE_KEY, InstalacionLicenciaCard } from '../../components/licencia';

const AdminEmpresa = () => {
  const { user } = useAuthStore();
  const [suscripciones, setSuscripciones] = useState<Record<string, unknown>[]>([]);
  const [pagos, setPagos] = useState<Record<string, unknown>[]>([]);
  const [uso, setUso] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const suscripcionActivaId = Number((suscripciones[0] as { idSuscripcion?: unknown } | undefined)?.idSuscripcion ?? 0) || null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [suscripcionesData, pagosData, usoData] = await Promise.all([
          licensingApi.suscripciones(user?.empresaId),
          licensingApi.pagos(user?.empresaId),
          licensingApi.uso(user?.empresaId),
        ]);
        setSuscripciones(suscripcionesData);
        setPagos(pagosData);
        setUso(usoData);
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => setLoading(false));
  }, [user?.empresaId]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>Admin Empresa</Typography.Title>
        <Typography.Text type="secondary">Suscripcion, pagos, consumo y usuarios habilitados para operar Regula.</Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Metric title="Suscripciones" value={suscripciones.length} icon={<SafetyCertificateOutlined />} loading={loading} />
        <Metric title="Pagos" value={pagos.length} icon={<CreditCardOutlined />} loading={loading} />
        <Metric title="Consumos" value={uso.length} icon={<ThunderboltOutlined />} loading={loading} />
        <Metric title="Empresa ID" value={user?.empresaId || '-'} icon={<TeamOutlined />} loading={loading} />
      </Row>

      <Tabs
        items={[
          { key: 'suscripciones', label: 'Suscripcion Activa', children: <DataTable rows={suscripciones} loading={loading} /> },
          { key: 'pagos', label: 'Pagos Realizados', children: <DataTable rows={pagos} loading={loading} /> },
          { key: 'uso', label: 'Consumo Del Mes', children: <ConsumoVsPlan empresaId={user?.empresaId} /> },
          {
            key: 'licencia',
            label: 'Licencia On-Premise',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <InstalacionLicenciaCard empresaId={user?.empresaId} suscripcionActivaId={suscripcionActivaId} />
                <EventosLicencia instalacionId={localStorage.getItem(INSTALACION_STORAGE_KEY)} />
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
};

const Metric = ({ title, value, icon, loading }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean }) => (
  <Col xs={24} md={6}>
    <Card>
      <Statistic title={title} value={value} prefix={icon} loading={loading} />
    </Card>
  </Col>
);

const DataTable = ({ rows, loading }: { rows: Record<string, unknown>[]; loading: boolean }) => (
  <Card>
    <Table rowKey={(_, index) => String(index)} columns={columnsFromRows(rows)} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
  </Card>
);

const columnsFromRows = (rows: Record<string, unknown>[]): ColumnsType<Record<string, unknown>> => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);
  return keys.map((key) => ({ title: titleize(key), dataIndex: key, render: formatValue, ellipsis: true }));
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const titleize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default AdminEmpresa;
