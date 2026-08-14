import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ApiOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { Alert, Button, Card, Col, Descriptions, List, Row, Segmented, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adminEmpresaApi } from '../../api';
import { useAuthStore } from '../../store';
import { useConfirmAction } from '../../components/common';
import { ConsumoVsPlan, EventosLicencia, INSTALACION_STORAGE_KEY, InstalacionLicenciaCard } from '../../components/licencia';

type AdminEmpresaSection = 'dashboard' | 'licencia-pagos' | 'consumo' | 'apis' | 'configuracion' | 'auditoria';
type TimeRangeKey = '5m' | '10m' | '30m' | '1h' | '3h';

const sectionMeta: Record<AdminEmpresaSection, { title: string; description: string }> = {
  dashboard: {
    title: 'Tablero',
    description: 'Resumen ejecutivo de licencia, plan, consumo, conectividad, APIs y operación local de la empresa.',
  },
  'licencia-pagos': {
    title: 'Licencia y Pagos',
    description: 'Controla vigencia, licencia local, eventos, facturas y diseño del futuro pago de licencia.',
  },
  consumo: {
    title: 'Consumo',
    description: 'Compara el uso mensual de la empresa contra los límites del plan contratado.',
  },
  apis: {
    title: 'APIs y Conectividad',
    description: 'Monitorea integraciones externas, errores, consultas y estado de conexión con el Control Plane.',
  },
  configuracion: {
    title: 'Configuración Local',
    description: 'Revisa parámetros administrables y tareas locales como sincronización de catálogos.',
  },
  auditoria: {
    title: 'Auditoría Local',
    description: 'Consulta acciones ejecutadas por usuarios, cambios administrativos y eventos relevantes de la empresa.',
  },
};

const AdminEmpresa = () => {
  const { section } = useParams();
  const activeSection = normalizeSection(section);
  const { user } = useAuthStore();
  const { confirm, confirmationModal } = useConfirmAction();
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [pagos, setPagos] = useState<Record<string, unknown>[]>([]);
  const [consumo, setConsumo] = useState<Record<string, unknown>>({});
  const [apis, setApis] = useState<Record<string, unknown>>({});
  const [errores, setErrores] = useState<Record<string, unknown>>({});
  const [systemOverview, setSystemOverview] = useState<Record<string, unknown>>({});
  const [conectividad, setConectividad] = useState<Record<string, unknown>>({});
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const suscripcion = asRecord(summary.suscripcion);
  const plan = asRecord(summary.plan);
  const licencia = asRecord(summary.licencia);
  const instalacion = asRecord(summary.instalacion);
  const empresa = asRecord(summary.empresa);
  const apiResumen = asRecord(asRecord(apis.resumen).total !== undefined ? apis.resumen : summary.apis);
  const controlPlane = asRecord(summary.controlPlane);
  const instalacionId = stringValue(instalacion.id) || localStorage.getItem(INSTALACION_STORAGE_KEY);
  const suscripcionActivaId = Number(suscripcion.id ?? 0) || null;
  const diasRestantes = daysUntil(stringValue(licencia.venceEn));

  const consumoRows = useMemo(() => arrayValue(consumo.usoSuscripcion), [consumo]);
  const consumoLocalRows = useMemo(() => arrayValue(consumo.consumoLocal), [consumo]);
  const consultasApi = useMemo(() => arrayValue(apis.consultas), [apis]);
  const eventosConectividad = useMemo(() => arrayValue(conectividad.eventosLicencia), [conectividad]);
  const parametrosEditables = useMemo(() => arrayValue(configuracion.parametrosEditables), [configuracion]);
  const jobs = useMemo(() => arrayValue(configuracion.jobs), [configuracion]);

  const load = async () => {
    setLoading(true);
    const [summaryData, pagosData, consumoData, apisData, erroresData, systemOverviewData, conectividadData, configuracionData, auditoriaData] = await Promise.all([
      safeLoad('resumen', adminEmpresaApi.resumen, {}),
      safeLoad('pagos', adminEmpresaApi.pagos, []),
      safeLoad('consumo', adminEmpresaApi.consumo, {}),
      safeLoad('apis', adminEmpresaApi.apis, {}),
      safeLoad('errores', adminEmpresaApi.errores, emptyErrores()),
      safeLoad('systemOverview', adminEmpresaApi.systemOverview, {}),
      safeLoad('conectividad', adminEmpresaApi.conectividad, {}),
      safeLoad('configuracion', adminEmpresaApi.configuracion, {}),
      safeLoad('auditoria', adminEmpresaApi.auditoria, []),
    ]);
    setSummary(summaryData);
    setPagos(pagosData);
    setConsumo(consumoData);
    setApis(apisData);
    setErrores(erroresData);
    setSystemOverview(systemOverviewData);
    setConectividad(conectividadData);
    setConfiguracion(configuracionData);
    setAuditoria(auditoriaData);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {
      message.error('No se pudo cargar la consola de administración de empresa');
      setLoading(false);
    });
  }, []);

  const validarLicencia = () => {
    confirm({
      title: 'Confirmar Validación De Licencia',
      description: 'Se consultará el Control Plane para renovar o verificar la licencia firmada. Normalmente esto lo hace una tarea programada; úsalo manualmente para pruebas o diagnóstico.',
      detail: `Empresa: ${stringValue(empresa.nombre) || user?.empresaId || 'Sin empresa resuelta'}`,
      confirmLabel: 'Validar Estado',
      action: async () => {
        const result = await adminEmpresaApi.validarLicencia();
        message.success(`Licencia validada: ${stringValue(result.modo) || 'resultado recibido'}`);
        await load();
      },
    });
  };

  const sincronizarCatalogos = () => {
    confirm({
      title: 'Confirmar Sincronización Manual',
      description: 'La sincronización normal debe ejecutarse por una tarea programada. Esta acción registra una solicitud manual para pruebas o recuperación ante fallos.',
      detail: 'Debe existir conectividad con el Control Plane y permisos sobre catálogos versionados.',
      confirmLabel: 'Sincronizar',
      action: async () => {
        const result = await adminEmpresaApi.sincronizarCatalogos();
        message.success(stringValue(result.mensaje) || 'Solicitud registrada');
        await load();
      },
    });
  };

  const meta = sectionMeta[activeSection];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>{meta.title}</Typography.Title>
          <Typography.Text type="secondary">{meta.description}</Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => load()} loading={loading}>Actualizar</Button>
      </Space>

      {controlPlane.estado === 'NO_CONFIGURADO' && (
        <Alert
          type="warning"
          showIcon
          message="Control Plane No Configurado"
          description="El cliente puede operar con licencia local y período de gracia, pero no recibirá renovaciones ni catálogos versionados hasta configurar la conexión central."
        />
      )}

      {activeSection === 'dashboard' && (
        <DashboardAdmin
          loading={loading}
          licencia={licencia}
          plan={plan}
          summary={summary}
          apiResumen={apiResumen}
          errores={errores}
          systemOverview={systemOverview}
          onReloadDashboard={load}
          onReloadErrors={async (filters) => {
            const data = await adminEmpresaApi.errores(filters);
            setErrores(data);
          }}
        />
      )}

      {activeSection === 'licencia-pagos' && (
        <LicenciaPagosSection
          loading={loading}
          empresaId={user?.empresaId}
          suscripcionActivaId={suscripcionActivaId}
          instalacionId={instalacionId}
          suscripcion={suscripcion}
          plan={plan}
          licencia={licencia}
          pagos={pagos}
          diasRestantes={diasRestantes}
          onValidarLicencia={validarLicencia}
        />
      )}

      {activeSection === 'consumo' && (
        <ConsumoSection loading={loading} empresaId={user?.empresaId} consumoRows={consumoRows} consumoLocalRows={consumoLocalRows} />
      )}

      {activeSection === 'apis' && (
        <ApisSection loading={loading} apiResumen={apiResumen} controlPlane={controlPlane} consultasApi={consultasApi} eventosConectividad={eventosConectividad} />
      )}

      {activeSection === 'configuracion' && (
        <ConfiguracionSection loading={loading} parametrosEditables={parametrosEditables} jobs={jobs} onSincronizarCatalogos={sincronizarCatalogos} />
      )}

      {activeSection === 'auditoria' && (
        <AuditoriaSection loading={loading} auditoria={auditoria} />
      )}

      {confirmationModal}
    </Space>
  );
};

const DashboardAdmin = ({ loading, licencia, plan, summary, apiResumen, errores, systemOverview, onReloadDashboard, onReloadErrors }: {
  loading: boolean;
  licencia: Record<string, unknown>;
  plan: Record<string, unknown>;
  summary: Record<string, unknown>;
  apiResumen: Record<string, unknown>;
  errores: Record<string, unknown>;
  systemOverview: Record<string, unknown>;
  onReloadDashboard: () => Promise<void>;
  onReloadErrors: (filters?: { status?: string; desde?: string; hasta?: string }) => Promise<void>;
}) => {
  const database = asRecord(systemOverview.database);
  const latency = asRecord(systemOverview.apiLatency);
  const uptime = asRecord(systemOverview.systemUptime);
  const trafficTrend = arrayValue(systemOverview.trafficTrend24h);
  const errorTelemetry = arrayValue(systemOverview.errorTelemetry);
  const [trafficRange, setTrafficRange] = useState<TimeRangeKey>('1h');
  const [errorRange, setErrorRange] = useState<TimeRangeKey>('1h');
  const filteredTrafficTrend = useMemo(() => filterRowsByTimeRange(trafficTrend, 'bucket', trafficRange), [trafficRange, trafficTrend]);
  const filteredErrorTelemetry = useMemo(() => filterRowsByTimeRange(errorTelemetry, 'fecha', errorRange), [errorRange, errorTelemetry]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Metric title="Carga De Base De Datos" value={`${numberValue(database.loadPercent)}%`} icon={<DatabaseOutlined />} loading={loading} />
        <Metric title="Latencia De APIs" value={`${numberValue(latency.avgMs)}ms`} icon={<ApiOutlined />} loading={loading} />
        <Metric title="Conexiones Activas" value={numberValue(systemOverview.activeConnections)} icon={<ThunderboltOutlined />} loading={loading} />
        <Metric title="Tiempo Activo Del Backend" value={stringValue(uptime.display) || '-'} icon={<FieldTimeOutlined />} loading={loading} />
      </Row>

      <Row gutter={[16, 16]}>
        <Metric title="Estado De Licencia" value={stringValue(licencia.estado) || 'No Emitida'} icon={<SafetyCertificateOutlined />} loading={loading} />
        <Metric title="Plan Contratado" value={stringValue(plan.nombre) || '-'} icon={<SafetyCertificateOutlined />} loading={loading} />
        <Metric title="Usuarios Activos" value={Number(summary.usuariosActivos ?? 0)} icon={<TeamOutlined />} loading={loading} />
        <Metric title="Consultas Revisadas" value={Number(apiResumen.total ?? 0)} icon={<ApiOutlined />} loading={loading} />
      </Row>

      <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Resumen Técnico" loading={loading}>
          <Descriptions column={1} size="small" items={[
            { key: 'estadoLicencia', label: 'Estado De Licencia', children: <EstadoTag value={stringValue(licencia.estado)} /> },
            { key: 'plan', label: 'Plan Contratado', children: stringValue(plan.nombre) || '-' },
            { key: 'muestras', label: 'Muestras De Latencia', children: String(latency.totalSamples ?? 0) },
            { key: 'p95', label: 'Latencia P95', children: `${numberValue(latency.p95Ms)}ms` },
          ]} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Salud Operativa" loading={loading}>
          <Descriptions column={1} size="small" items={[
            { key: 'consultas', label: 'Consultas API Revisadas', children: String(apiResumen.total ?? 0) },
            { key: 'exitosas', label: 'APIs Exitosas', children: String(apiResumen.exitosas ?? 0) },
            { key: 'errores', label: 'Errores API', children: String(apiResumen.errores ?? 0) },
            { key: 'conexiones', label: 'Conexiones De Base De Datos', children: `${numberValue(database.activeConnections)} / ${numberValue(database.maxConnections)}` },
            { key: 'uptime', label: 'Tiempo Activo Del Backend', children: stringValue(uptime.display) || '-' },
          ]} />
        </Card>
      </Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col xs={24} xl={15}>
        <Card
          title="Tráfico De APIs"
          loading={loading}
          extra={<TimeRangeControls value={trafficRange} onChange={setTrafficRange} onRefresh={onReloadDashboard} loading={loading} />}
        >
          <Line
            data={filteredTrafficTrend.flatMap((row) => [
              { hora: formatHour(row.bucket), tipo: 'API Internas', valor: numberValue(row.api_internas) },
              { hora: formatHour(row.bucket), tipo: 'API Externas', valor: numberValue(row.api_externas) },
              { hora: formatHour(row.bucket), tipo: 'Errores API', valor: numberValue(row.api_errores) },
              { hora: formatHour(row.bucket), tipo: 'Auditoría', valor: numberValue(row.auditoria) },
              { hora: formatHour(row.bucket), tipo: 'Consultas Externas', valor: numberValue(row.consultas_externas) },
            ])}
            xField="hora"
            yField="valor"
            seriesField="tipo"
            height={280}
            smooth
            legend={{ position: 'bottom' }}
          />
        </Card>
      </Col>
      <Col xs={24} xl={9}>
        <Card
          title="Telemetría De Errores"
          loading={loading}
          extra={<TimeRangeControls value={errorRange} onChange={setErrorRange} onRefresh={onReloadDashboard} loading={loading} compact />}
          styles={{ body: { background: '#111827', color: '#e5e7eb', minHeight: 280 } }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {filteredErrorTelemetry.slice(0, 8).map((row, index) => (
              <div key={String(row.referencia ?? row.fecha ?? index)} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                <Typography.Text style={{ color: '#f87171', fontSize: 12 }}>{stringValue(row.tipo) || 'ERR'} </Typography.Text>
                <Typography.Text style={{ color: '#fbbf24', fontSize: 12 }}>{stringValue(row.codigo) || '-'}</Typography.Text>
                <Typography.Text style={{ color: '#94a3b8', fontSize: 12 }}> {formatHour(row.fecha)}</Typography.Text>
                <Typography.Text style={{ color: '#ffffff', display: 'block', fontSize: 12 }}>{stringValue(row.origen) || 'API'}</Typography.Text>
                <Typography.Text style={{ color: '#cbd5e1', display: 'block', fontSize: 12 }}>{stringValue(row.mensaje) || '-'}</Typography.Text>
              </div>
            ))}
            {filteredErrorTelemetry.length === 0 && <Typography.Text style={{ color: '#cbd5e1' }}>Sin errores registrados en el rango seleccionado.</Typography.Text>}
          </Space>
        </Card>
      </Col>
    </Row>

    <ErrorMonitor loading={loading} errores={errores} onReload={onReloadErrors} />
  </Space>
  );
};

const ErrorMonitor = ({ loading, errores, onReload }: {
  loading: boolean;
  errores: Record<string, unknown>;
  onReload: (filters?: { status?: string; desde?: string; hasta?: string }) => Promise<void>;
}) => {
  const [categoria, setCategoria] = useState('TODOS');
  const [status, setStatus] = useState('TODOS');
  const [range, setRange] = useState<TimeRangeKey>('1h');
  const [reloading, setReloading] = useState(false);
  const internas = useMemo(() => arrayValue(errores.internas), [errores]);
  const externas = useMemo(() => arrayValue(errores.externas), [errores]);
  const eventosExternos = useMemo(() => arrayValue(errores.eventosExternos), [errores]);
  const eventosRecientes = useMemo(() => arrayValue(errores.eventosRecientes), [errores]);
  const statusCodes = useMemo(() => {
    const fromApi = Array.isArray(errores.statusCodes) ? errores.statusCodes.map(String) : [];
    const fromRows = [...internas, ...externas, ...eventosExternos, ...eventosRecientes]
      .map((row) => row.status_code ?? row.status_http ?? row.statusCode ?? row.statusHttp)
      .filter((value) => value !== null && value !== undefined)
      .map(String);
    return Array.from(new Set([...fromApi, ...fromRows])).sort((a, b) => Number(a) - Number(b));
  }, [errores, internas, externas, eventosExternos, eventosRecientes]);

  const filterRows = (rows: Record<string, unknown>[]) => rows.filter((row) => {
    const rowStatus = String(row.status_code ?? row.status_http ?? row.statusCode ?? row.statusHttp ?? '');
    return status === 'TODOS' || rowStatus === status;
  });

  const showInternal = categoria === 'TODOS' || categoria === 'INTERNAS';
  const showExternal = categoria === 'TODOS' || categoria === 'EXTERNAS';
  const reload = async () => {
    const desde = getRangeStart(range).toISOString();
    setReloading(true);
    try {
      await onReload({
        status: status === 'TODOS' ? undefined : status,
        desde,
        hasta: dayjs().toISOString(),
      });
    } finally {
      setReloading(false);
    }
  };

  return (
    <Card
      title="Monitor De Errores De APIs"
      loading={loading}
      extra={(
        <Space wrap>
          <Button size="small" icon={<ReloadOutlined />} loading={reloading} onClick={reload}>Actualizar</Button>
          <Select
            size="small"
            value={categoria}
            style={{ width: 180 }}
            onChange={setCategoria}
            options={[
              { value: 'TODOS', label: 'Todas Las APIs' },
              { value: 'INTERNAS', label: 'APIs Propias' },
              { value: 'EXTERNAS', label: 'APIs Externas' },
            ]}
          />
          <Select
            size="small"
            value={status}
            style={{ width: 150 }}
            onChange={setStatus}
            options={[
              { value: 'TODOS', label: 'Todos HTTP' },
              ...statusCodes.map((code) => ({ value: code, label: `HTTP ${code}` })),
            ]}
          />
          <Segmented<TimeRangeKey>
            size="small"
            value={range}
            onChange={setRange}
            options={timeRangeOptions}
          />
        </Space>
      )}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Row gutter={[16, 16]}>
          {showInternal && (
            <Col xs={24} xl={12}>
              <ApiErrorTable title="Errores De APIs Propias" rows={filterRows(internas)} loading={loading} />
            </Col>
          )}
          {showExternal && (
            <Col xs={24} xl={12}>
              <ApiErrorTable title="Errores De APIs Externas" rows={filterRows(externas)} loading={loading} />
            </Col>
          )}
        </Row>
        {showExternal && (
          <ApiErrorTable
            title="Eventos"
            rows={filterRows(eventosRecientes)}
            loading={loading}
            compact
          />
        )}
      </Space>
    </Card>
  );
};

const ApiErrorTable = ({ title, rows, loading, compact = false }: {
  title: string;
  rows: Record<string, unknown>[];
  loading: boolean;
  compact?: boolean;
}) => (
  <Card title={title} size="small">
    <Table
      rowKey={(row, index) => String(row.id ?? row.codigo_error ?? row.codigoError ?? index)}
      columns={[
        { title: 'Origen', dataIndex: 'origen', ellipsis: true, render: formatValue },
        { title: 'Código', dataIndex: 'codigo_error', ellipsis: true, render: (_, row) => formatValue(row.codigo_error ?? row.codigo) },
        {
          title: 'HTTP',
          dataIndex: 'status_code',
          width: 90,
          render: (value, row) => <StatusTag value={value ?? row.status_http ?? row.statusCode ?? row.statusHttp} />,
        },
        { title: 'Significado', dataIndex: 'mensaje', ellipsis: true, render: formatValue },
        ...(compact ? [{ title: 'Fuente', dataIndex: 'fuente', ellipsis: true, render: formatValue }, { title: 'Fecha', dataIndex: 'fecha', ellipsis: true, render: formatValue }] : []),
      ]}
      dataSource={rows}
      loading={loading}
      pagination={{ pageSize: compact ? 5 : 6, showSizeChanger: false }}
      size="small"
      scroll={{ x: true }}
    />
  </Card>
);

const StatusTag = ({ value }: { value: unknown }) => {
  const status = Number(value ?? 0);
  const color = status >= 500 ? 'red' : status >= 400 ? 'orange' : status >= 300 ? 'blue' : 'green';
  return <Tag color={color}>{status ? `HTTP ${status}` : '-'}</Tag>;
};

const timeRangeOptions: Array<{ label: string; value: TimeRangeKey }> = [
  { label: '5min', value: '5m' },
  { label: '10min', value: '10m' },
  { label: '30min', value: '30m' },
  { label: '1hr', value: '1h' },
  { label: '3hrs', value: '3h' },
];

const TimeRangeControls = ({ value, onChange, onRefresh, loading, compact = false }: {
  value: TimeRangeKey;
  onChange: (value: TimeRangeKey) => void;
  onRefresh: () => Promise<void>;
  loading: boolean;
  compact?: boolean;
}) => (
  <Space wrap>
    <Segmented<TimeRangeKey>
      size="small"
      value={value}
      onChange={onChange}
      options={compact ? timeRangeOptions.slice(1) : timeRangeOptions}
    />
    <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>Actualizar</Button>
  </Space>
);

const getRangeStart = (range: TimeRangeKey) => {
  const now = dayjs();
  if (range === '5m') return now.subtract(5, 'minute');
  if (range === '10m') return now.subtract(10, 'minute');
  if (range === '30m') return now.subtract(30, 'minute');
  if (range === '1h') return now.subtract(1, 'hour');
  return now.subtract(3, 'hour');
};

const filterRowsByTimeRange = (rows: Record<string, unknown>[], field: string, range: TimeRangeKey) => {
  const start = getRangeStart(range);
  return rows.filter((row) => {
    const raw = row[field];
    if (!raw) return false;
    const value = dayjs(String(raw));
    return value.isValid() && value.isAfter(start);
  });
};

const LicenciaPagosSection = ({ loading, empresaId, suscripcionActivaId, instalacionId, suscripcion, plan, licencia, pagos, diasRestantes, onValidarLicencia }: {
  loading: boolean;
  empresaId?: string | null;
  suscripcionActivaId: number | null;
  instalacionId?: string | null;
  suscripcion: Record<string, unknown>;
  plan: Record<string, unknown>;
  licencia: Record<string, unknown>;
  pagos: Record<string, unknown>[];
  diasRestantes: number | null;
  onValidarLicencia: () => void;
}) => (
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    <Alert
      type="info"
      showIcon
      icon={<InfoCircleOutlined />}
      message="Sobre Validar Licencia"
      description="La licencia se controla por fecha de inicio, fecha de fin, días restantes y período de gracia. La validación manual es útil cuando se reconecta el Control Plane, se renueva el pago, se sospecha manipulación del estado local o se necesita demostrar el flujo en una prueba."
    />
    <InstalacionLicenciaCard empresaId={empresaId} suscripcionActivaId={suscripcionActivaId} />
    <EventosLicencia instalacionId={instalacionId} />
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Contrato De Licencia" loading={loading} extra={<Button icon={<SafetyCertificateOutlined />} onClick={onValidarLicencia}>Validar Estado</Button>}>
          <Descriptions column={1} size="small" items={[
            { key: 'plan', label: 'Plan', children: stringValue(plan.nombre) || '-' },
            { key: 'estado', label: 'Estado', children: <EstadoTag value={stringValue(licencia.estado)} /> },
            { key: 'inicio', label: 'Fecha Hora Inicio', children: stringValue(licencia.emitidaEn) || stringValue(suscripcion.fechaInicio) || '-' },
            { key: 'fin', label: 'Fecha Hora Fin', children: stringValue(licencia.venceEn) || stringValue(suscripcion.fechaFin) || '-' },
            { key: 'dias', label: 'Días Restantes', children: diasRestantes ?? '-' },
            { key: 'gracia', label: 'Periodo De Gracia', children: stringValue(licencia.diasGracia) || '-' },
          ]} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Pago De La Licencia" loading={loading}>
          <Alert
            type="warning"
            showIcon
            message="Pasarela Pendiente"
            description="En una fase futura se integrara una pasarela de pago. Por ahora esta vista muestra el diseno operativo: monto, vencimiento, estado y comprobante esperado."
          />
          <Descriptions column={1} size="small" style={{ marginTop: 16 }} items={[
            { key: 'estadoPago', label: 'Estado Del Pago', children: pagos.length > 0 ? formatValue(pagos[0].estado) : 'Sin pago registrado' },
            { key: 'monto', label: 'Monto De Licencia', children: pagos.length > 0 ? formatValue(pagos[0].monto) : '-' },
            { key: 'vencimiento', label: 'Vencimiento De Factura', children: pagos.length > 0 ? formatValue(pagos[0].fechaVencimiento ?? pagos[0].fechaPago) : '-' },
            { key: 'comprobante', label: 'Comprobante', children: 'Pendiente de integracion' },
          ]} />
        </Card>
      </Col>
    </Row>
    <DataTable title="Suscripcion Vigente" rows={suscripcion.id ? [suscripcion] : []} loading={loading} />
    <DataTable title="Pagos" rows={pagos} loading={loading} />
  </Space>
);

const ConsumoSection = ({ loading, empresaId, consumoRows, consumoLocalRows }: {
  loading: boolean;
  empresaId?: string | null;
  consumoRows: Record<string, unknown>[];
  consumoLocalRows: Record<string, unknown>[];
}) => (
  <Space direction="vertical" style={{ width: '100%' }} size="middle">
    <ConsumoVsPlan empresaId={empresaId} />
    <DataTable title="Uso De Suscripcion" rows={consumoRows} loading={loading} />
    <DataTable title="Consumo Local De Instalacion" rows={consumoLocalRows} loading={loading} />
  </Space>
);

const ApisSection = ({ loading, apiResumen, controlPlane, consultasApi, eventosConectividad }: {
  loading: boolean;
  apiResumen: Record<string, unknown>;
  controlPlane: Record<string, unknown>;
  consultasApi: Record<string, unknown>[];
  eventosConectividad: Record<string, unknown>[];
}) => (
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
);

const ConfiguracionSection = ({ loading, parametrosEditables, jobs, onSincronizarCatalogos }: {
  loading: boolean;
  parametrosEditables: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  onSincronizarCatalogos: () => void;
}) => (
  <Row gutter={[16, 16]}>
    <Col xs={24} lg={10}>
      <Card title="Parametros Permitidos" loading={loading}>
        <List dataSource={parametrosEditables} renderItem={(item) => <List.Item>{formatValue(item)}</List.Item>} />
      </Card>
    </Col>
    <Col xs={24} lg={14}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card
          title="Sincronizacion De Catalogos"
          extra={<Button icon={<CloudSyncOutlined />} onClick={onSincronizarCatalogos}>Sincronizar Manualmente</Button>}
        >
          <Typography.Paragraph>
            La sincronización productiva debe ejecutarse por una tarea programada. La tarea consulta el Control Plane, descarga catálogos versionados permitidos por el plan y registra resultado, errores y fecha de ejecución.
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            La acción manual queda para pruebas, recuperación ante fallos o demostración de tesis.
          </Typography.Text>
        </Card>
        <DataTable title="Jobs Locales" rows={jobs} loading={loading} />
      </Space>
    </Col>
  </Row>
);

const AuditoriaSection = ({ loading, auditoria }: { loading: boolean; auditoria: Record<string, unknown>[] }) => (
  <Space direction="vertical" style={{ width: '100%' }} size="middle">
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="Acciones Registradas" value={auditoria.length} prefix={<FieldTimeOutlined />} loading={loading} />
        </Card>
      </Col>
      <Col xs={24} md={16}>
        <Alert
          type="info"
          showIcon
          message="Auditoria Local"
          description="Aquí se revisa quién ejecutó cada acción, cuándo ocurrió, qué entidad afectó y cuál fue el detalle. En una fase siguiente conviene agregar filtros por usuario, acción, entidad y fecha."
        />
      </Col>
    </Row>
    <DataTable title="Últimas Acciones Administrativas" rows={auditoria} loading={loading} />
  </Space>
);

const Metric = ({ title, value, icon, loading }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean }) => (
  <Col xs={24} md={12} xl={4}>
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
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
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

const safeLoad = async <T,>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await loader();
  } catch (error) {
    console.error(`[AdminEmpresa] No se pudo cargar ${label}`, error);
    return fallback;
  }
};

const emptyErrores = (): Record<string, unknown> => ({
  catalogo: [],
  internas: [],
  externas: [],
  eventosExternos: [],
  statusCodes: [],
});

const stringValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
};

const numberValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatHour = (value: unknown): string => {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
};

const normalizeSection = (section?: string): AdminEmpresaSection => {
  if (section === 'licencia-pagos' || section === 'consumo' || section === 'apis' || section === 'configuracion' || section === 'auditoria') return section;
  return 'dashboard';
};

const daysUntil = (value?: string): number | null => {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86_400_000);
};

export default AdminEmpresa;
