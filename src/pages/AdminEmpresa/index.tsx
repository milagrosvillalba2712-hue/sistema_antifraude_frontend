import { useEffect, useMemo, useState } from 'react';
import {
  ApiOutlined,
  CloudSyncOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Descriptions, List, Row, Space, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { adminEmpresaApi } from '../../api';
import { useAuthStore } from '../../store';
import { useConfirmAction } from '../../components/common';
import { ConsumoVsPlan, EventosLicencia, INSTALACION_STORAGE_KEY, InstalacionLicenciaCard } from '../../components/licencia';

const AdminEmpresa = () => {
  const { user } = useAuthStore();
  const { confirm, confirmationModal } = useConfirmAction();
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [pagos, setPagos] = useState<Record<string, unknown>[]>([]);
  const [consumo, setConsumo] = useState<Record<string, unknown>>({});
  const [apis, setApis] = useState<Record<string, unknown>>({});
  const [conectividad, setConectividad] = useState<Record<string, unknown>>({});
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([]);
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const suscripcion = asRecord(summary.suscripcion);
  const plan = asRecord(summary.plan);
  const licencia = asRecord(summary.licencia);
  const instalacion = asRecord(summary.instalacion);
  const apiResumen = asRecord(asRecord(apis.resumen).total !== undefined ? apis.resumen : summary.apis);
  const controlPlane = asRecord(summary.controlPlane);
  const instalacionId = stringValue(instalacion.id) || localStorage.getItem(INSTALACION_STORAGE_KEY);
  const suscripcionActivaId = Number(suscripcion.id ?? 0) || null;

  const consumoRows = useMemo(() => arrayValue(consumo.usoSuscripcion), [consumo]);
  const consumoLocalRows = useMemo(() => arrayValue(consumo.consumoLocal), [consumo]);
  const consultasApi = useMemo(() => arrayValue(apis.consultas), [apis]);
  const eventosConectividad = useMemo(() => arrayValue(conectividad.eventosLicencia), [conectividad]);
  const parametrosEditables = useMemo(() => arrayValue(configuracion.parametrosEditables), [configuracion]);
  const jobs = useMemo(() => arrayValue(configuracion.jobs), [configuracion]);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryData, pagosData, consumoData, apisData, conectividadData, usuariosData, configuracionData, auditoriaData] = await Promise.all([
        adminEmpresaApi.resumen(),
        adminEmpresaApi.pagos(),
        adminEmpresaApi.consumo(),
        adminEmpresaApi.apis(),
        adminEmpresaApi.conectividad(),
        adminEmpresaApi.usuarios(),
        adminEmpresaApi.configuracion(),
        adminEmpresaApi.auditoria(),
      ]);
      setSummary(summaryData);
      setPagos(pagosData);
      setConsumo(consumoData);
      setApis(apisData);
      setConectividad(conectividadData);
      setUsuarios(usuariosData);
      setConfiguracion(configuracionData);
      setAuditoria(auditoriaData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {
      message.error('No se pudo cargar la consola de Admin Empresa');
      setLoading(false);
    });
  }, []);

  const validarLicencia = () => {
    confirm({
      title: 'Confirmar Validación De Licencia',
      description: 'Se validará la licencia local contra el Control Plane configurado o el modo offline disponible.',
      detail: `Empresa: ${user?.empresaId ?? 'Sin empresa resuelta'}`,
      confirmLabel: 'Validar Ahora',
      action: async () => {
        const result = await adminEmpresaApi.validarLicencia();
        message.success(`Licencia validada: ${stringValue(result.modo) || 'resultado recibido'}`);
        await load();
      },
    });
  };

  const sincronizarCatalogos = () => {
    confirm({
      title: 'Confirmar Sincronización De Catálogos',
      description: 'Se registrará una solicitud manual de sincronización de catálogos permitidos para la empresa.',
      detail: 'La descarga real dependerá de la conexión con el Control Plane.',
      confirmLabel: 'Sincronizar',
      action: async () => {
        const result = await adminEmpresaApi.sincronizarCatalogos();
        message.success(stringValue(result.mensaje) || 'Solicitud registrada');
        await load();
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>Admin Empresa</Typography.Title>
          <Typography.Text type="secondary">
            Consola local para controlar licencia, pagos propios, consumo, APIs, usuarios, configuración y auditoría de la empresa.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>Actualizar</Button>
          <Button icon={<SafetyCertificateOutlined />} type="primary" onClick={validarLicencia}>Validar Licencia</Button>
          <Button icon={<CloudSyncOutlined />} onClick={sincronizarCatalogos}>Sincronizar Catálogos</Button>
        </Space>
      </Space>

      {controlPlane.estado === 'NO_CONFIGURADO' && (
        <Alert
          type="warning"
          showIcon
          message="Control Plane No Configurado"
          description="El cliente puede operar con licencia local y periodo de gracia, pero no recibirá renovaciones ni catálogos versionados hasta configurar la conexión central."
        />
      )}

      <Row gutter={[16, 16]}>
        <Metric title="Estado Licencia" value={stringValue(licencia.estado) || 'No Emitida'} icon={<SafetyCertificateOutlined />} loading={loading} />
        <Metric title="Plan" value={stringValue(plan.codigo) || '-'} icon={<CreditCardOutlined />} loading={loading} />
        <Metric title="Usuarios Activos" value={Number(summary.usuariosActivos ?? usuarios.length)} icon={<TeamOutlined />} loading={loading} />
        <Metric title="Errores API" value={Number(apiResumen.errores ?? 0)} icon={<ApiOutlined />} loading={loading} />
      </Row>

      <Tabs
        items={[
          {
            key: 'resumen',
            label: 'Resumen Empresa',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="Licencia Y Plan" loading={loading}>
                    <Descriptions column={1} size="small" items={[
                      { key: 'empresa', label: 'Empresa', children: stringValue(asRecord(summary.empresa).nombre) || '-' },
                      { key: 'plan', label: 'Plan', children: stringValue(plan.nombre) || '-' },
                      { key: 'estadoLicencia', label: 'Estado Licencia', children: <EstadoTag value={stringValue(licencia.estado)} /> },
                      { key: 'venceEn', label: 'Vence En', children: stringValue(licencia.venceEn) || '-' },
                      { key: 'gracia', label: 'Días De Gracia', children: stringValue(licencia.diasGracia) || '-' },
                      { key: 'modo', label: 'Control Plane', children: <EstadoTag value={stringValue(controlPlane.estado)} /> },
                    ]} />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="Consumo Operativo" loading={loading}>
                    <Descriptions column={1} size="small" items={[
                      { key: 'usuarios', label: 'Usuarios Activos', children: String(summary.usuariosActivos ?? '-') },
                      { key: 'consultas', label: 'Consultas API Revisadas', children: String(apiResumen.total ?? 0) },
                      { key: 'exitosas', label: 'APIs Exitosas', children: String(apiResumen.exitosas ?? 0) },
                      { key: 'errores', label: 'Errores API', children: String(apiResumen.errores ?? 0) },
                      { key: 'heartbeat', label: 'Último Heartbeat', children: stringValue(controlPlane.ultimoHeartbeatEn) || '-' },
                    ]} />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'licencia',
            label: 'Licencia Y Plan',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <InstalacionLicenciaCard empresaId={user?.empresaId} suscripcionActivaId={suscripcionActivaId} />
                <EventosLicencia instalacionId={instalacionId} />
                <DataTable title="Suscripción Vigente" rows={suscripcion.id ? [suscripcion] : []} loading={loading} />
              </Space>
            ),
          },
          { key: 'pagos', label: 'Pagos Propios', children: <DataTable title="Pagos Y Facturas De La Empresa" rows={pagos} loading={loading} /> },
          {
            key: 'consumo',
            label: 'Consumo',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <ConsumoVsPlan empresaId={user?.empresaId} />
                <DataTable title="Uso De Suscripción" rows={consumoRows} loading={loading} />
                <DataTable title="Consumo Local De Instalación" rows={consumoLocalRows} loading={loading} />
              </Space>
            ),
          },
          {
            key: 'apis',
            label: 'APIs Y Conectividad',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row gutter={[16, 16]}>
                  <Metric title="Consultas Revisadas" value={Number(apiResumen.total ?? 0)} icon={<ApiOutlined />} loading={loading} />
                  <Metric title="Exitosas" value={Number(apiResumen.exitosas ?? 0)} icon={<ThunderboltOutlined />} loading={loading} />
                  <Metric title="Errores" value={Number(apiResumen.errores ?? 0)} icon={<ApiOutlined />} loading={loading} />
                  <Metric title="Control Plane" value={stringValue(controlPlane.estado) || '-'} icon={<CloudSyncOutlined />} loading={loading} />
                </Row>
                <DataTable title="Consultas Externas" rows={consultasApi} loading={loading} />
                <DataTable title="Eventos De Conectividad" rows={eventosConectividad} loading={loading} />
              </Space>
            ),
          },
          { key: 'usuarios', label: 'Usuarios Y Permisos', children: <DataTable title="Usuarios De La Empresa" rows={usuarios} loading={loading} /> },
          {
            key: 'configuracion',
            label: 'Configuración Local',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={10}>
                  <Card title="Parámetros Permitidos" loading={loading}>
                    <List dataSource={parametrosEditables} renderItem={(item) => <List.Item>{formatValue(item)}</List.Item>} />
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <DataTable title="Jobs Locales" rows={jobs} loading={loading} />
                </Col>
              </Row>
            ),
          },
          { key: 'auditoria', label: 'Auditoría Local', children: <DataTable title="Últimas Acciones Administrativas" rows={auditoria} loading={loading} /> },
        ]}
      />
      {confirmationModal}
    </Space>
  );
};

const Metric = ({ title, value, icon, loading }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean }) => (
  <Col xs={24} md={12} xl={6}>
    <Card>
      <Statistic title={title} value={value} prefix={icon} loading={loading} />
    </Card>
  </Col>
);

const DataTable = ({ title, rows, loading }: { title: string; rows: Record<string, unknown>[]; loading: boolean }) => (
  <Card title={title}>
    <Table
      rowKey={(_, index) => String(index)}
      columns={columnsFromRows(rows)}
      dataSource={rows}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      scroll={{ x: true }}
      size="middle"
    />
  </Card>
);

const EstadoTag = ({ value }: { value?: string }) => {
  const normalized = (value || '').toUpperCase();
  const color = normalized.includes('BLOQUE') || normalized.includes('ERROR') ? 'red'
    : normalized.includes('GRACIA') || normalized.includes('NO_CONFIGURADO') ? 'orange'
      : normalized.includes('ACTIV') || normalized.includes('OPERAT') || normalized.includes('CONFIGURADO') ? 'green'
        : 'default';
  return <Tag color={color}>{value || '-'}</Tag>;
};

const columnsFromRows = (rows: Record<string, unknown>[]): ColumnsType<Record<string, unknown>> => {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 9);
  return keys.map((key) => ({ title: titleize(key), dataIndex: key, render: formatValue, ellipsis: true }));
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const titleize = (value: string) => value
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const asRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
};

const arrayValue = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
};

const stringValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
};

export default AdminEmpresa;
