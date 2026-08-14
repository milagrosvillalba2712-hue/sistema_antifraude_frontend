import { useEffect, useState } from 'react';
import { BankOutlined, CreditCardOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Statistic, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { licensingApi } from '../../api';

type RowsByKey = Record<string, Record<string, unknown>[]>;

const AdminGeneral = () => {
  const [data, setData] = useState<RowsByKey>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [empresas, planes, suscripciones, pagos, uso, roles, permisos] = await Promise.all([
          licensingApi.empresas(),
          licensingApi.planes(),
          licensingApi.suscripciones(),
          licensingApi.pagos(),
          licensingApi.uso(),
          licensingApi.roles(),
          licensingApi.permisos(),
        ]);
        setData({ empresas, planes, suscripciones, pagos, uso, roles, permisos });
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => setLoading(false));
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>Administrador General</Typography.Title>
        <Typography.Text type="secondary">Vista global de clientes, licencias, consumo, roles y permisos de Regula.</Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Metric title="Empresas" value={data.empresas?.length || 0} icon={<BankOutlined />} loading={loading} />
        <Metric title="Planes" value={data.planes?.length || 0} icon={<SafetyCertificateOutlined />} loading={loading} />
        <Metric title="Suscripciones" value={data.suscripciones?.length || 0} icon={<CreditCardOutlined />} loading={loading} />
        <Metric title="Pagos" value={data.pagos?.length || 0} icon={<CreditCardOutlined />} loading={loading} />
        <Metric title="Roles" value={data.roles?.length || 0} icon={<TeamOutlined />} loading={loading} />
        <Metric title="Permisos" value={data.permisos?.length || 0} icon={<SafetyCertificateOutlined />} loading={loading} />
      </Row>

      <Tabs
        items={[
          { key: 'empresas', label: 'Empresas', children: <DataTable rows={data.empresas || []} loading={loading} /> },
          { key: 'planes', label: 'Planes', children: <DataTable rows={data.planes || []} loading={loading} /> },
          { key: 'suscripciones', label: 'Suscripciones', children: <DataTable rows={data.suscripciones || []} loading={loading} /> },
          { key: 'pagos', label: 'Pagos', children: <DataTable rows={data.pagos || []} loading={loading} /> },
          { key: 'uso', label: 'Consumo', children: <DataTable rows={data.uso || []} loading={loading} /> },
          { key: 'roles', label: 'Roles', children: <DataTable rows={data.roles || []} loading={loading} /> },
          { key: 'permisos', label: 'Permisos', children: <DataTable rows={data.permisos || []} loading={loading} /> },
        ]}
      />
    </Space>
  );
};

const Metric = ({ title, value, icon, loading }: { title: string; value: number; icon: React.ReactNode; loading: boolean }) => (
  <Col xs={24} sm={12} lg={8} xl={4}>
    <Card>
      <Statistic title={title} value={value} prefix={icon} loading={loading} />
    </Card>
  </Col>
);

const DataTable = ({ rows, loading }: { rows: Record<string, unknown>[]; loading: boolean }) => (
  <Card>
    <Table rowKey={(_, index) => String(index)} columns={columnsFromRows(rows)} dataSource={rows} loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: true }} />
  </Card>
);

const columnsFromRows = (rows: Record<string, unknown>[]): ColumnsType<Record<string, unknown>> => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);
  return keys.map((key) => ({
    title: titleize(key),
    dataIndex: key,
    render: (value) => formatValue(value),
    ellipsis: true,
  }));
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const titleize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default AdminGeneral;
