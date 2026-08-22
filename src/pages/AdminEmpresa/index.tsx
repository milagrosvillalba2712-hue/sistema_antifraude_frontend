import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ApiOutlined,
  CalendarOutlined,
  CloudSyncOutlined,
  CreditCardOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Input, Popover, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adminEmpresaApi } from '../../api';
import { useAuthStore } from '../../store';
import { useConfirmAction } from '../../components/common';
import { ConsumoVsPlan, InstalacionLicenciaCard } from '../../components/licencia';
import JobsConfigurator from './JobsConfigurator';
import type { JobLocal } from '../../types';

type AdminEmpresaSection = 'dashboard' | 'licencia-pagos' | 'consumo' | 'apis' | 'configuracion' | 'auditoria';
type RelativeTimeRangeKey = '5m' | '10m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h';
type TimeRangeSelection = { type: 'relative'; key: RelativeTimeRangeKey } | { type: 'absolute'; from: string; to: string };

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
  const [searchParams] = useSearchParams();
  const activeSection = normalizeSection(section);
  const { user } = useAuthStore();
  const { confirm, confirmationModal } = useConfirmAction();
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [pagos, setPagos] = useState<Record<string, unknown>[]>([]);
  const [recibos, setRecibos] = useState<Record<string, unknown>[]>([]);
  const [consumo, setConsumo] = useState<Record<string, unknown>>({});
  const [apis, setApis] = useState<Record<string, unknown>>({});
  const [errores, setErrores] = useState<Record<string, unknown>>({});
  const [systemOverview, setSystemOverview] = useState<Record<string, unknown>>({});
  const [conectividad, setConectividad] = useState<Record<string, unknown>>({});
  const [configuracion, setConfiguracion] = useState<Record<string, unknown>>({});
  const [auditoria, setAuditoria] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const processedStripeSessionRef = useRef<string | null>(null);

  const suscripcion = asRecord(summary.suscripcion);
  const plan = asRecord(summary.plan);
  const licencia = asRecord(summary.licencia);
  const empresa = asRecord(summary.empresa);
  const apiResumen = asRecord(asRecord(apis.resumen).total !== undefined ? apis.resumen : summary.apis);
  const controlPlane = asRecord(summary.controlPlane);
  const suscripcionActivaId = Number(suscripcion.id ?? 0) || null;
  const diasRestantes = daysUntil(stringValue(licencia.venceEn));

  const consumoRows = useMemo(() => arrayValue(consumo.usoSuscripcion), [consumo]);
  const consultasApi = useMemo(() => arrayValue(apis.consultas), [apis]);
  const eventosConectividad = useMemo(() => arrayValue(conectividad.eventosLicencia), [conectividad]);
  const jobs = useMemo(() => arrayValue(configuracion.jobs) as unknown as JobLocal[], [configuracion]);
  const jobsHabilitados = Boolean(configuracion.jobsHabilitados);

  const load = async () => {
    setLoading(true);
    const [summaryData, pagosData, recibosData, consumoData, apisData, erroresData, systemOverviewData, conectividadData, configuracionData, auditoriaData] = await Promise.all([
      safeLoad('resumen', adminEmpresaApi.resumen, {}),
      safeLoad('pagos', adminEmpresaApi.pagos, []),
      safeLoad('recibos', adminEmpresaApi.recibos, {}),
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
    setRecibos(arrayValue(asRecord(recibosData).items));
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

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (payment === 'success' && sessionId && processedStripeSessionRef.current !== sessionId) {
      processedStripeSessionRef.current = sessionId;
      adminEmpresaApi.confirmarPagoStripe(sessionId)
        .then((respuesta) => {
          message.success(String(respuesta.mensaje ?? 'Pago revisado correctamente.'));
          return load();
        })
        .catch((error: unknown) => {
          const err = error as { response?: { data?: { mensaje?: string; message?: string } } };
          message.error(err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo confirmar el pago con Stripe');
        });
    } else if (payment === 'cancel') {
      message.warning('Pago cancelado en Stripe. La solicitud queda pendiente.');
    }
  }, [searchParams]);

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

  const iniciarPagoStripe = () => {
    confirm({
      title: 'Confirmar Pago De Licencia',
      description: 'Se creará una sesión segura de Stripe Checkout desde el Control Plane. No se almacenarán datos de tarjeta en Regula.',
      detail: `Empresa: ${stringValue(empresa.nombre) || user?.empresaId || 'Sin empresa resuelta'}`,
      confirmLabel: 'Continuar A Stripe',
      action: async () => {
        const currentUrl = `${window.location.origin}/admin-empresa/licencia-pagos`;
        const result = await adminEmpresaApi.iniciarPagoStripe({
          successUrl: `${currentUrl}?payment=success`,
          cancelUrl: `${currentUrl}?payment=cancel`,
        });
        const checkoutUrl = stringValue(result.checkoutUrl);
        if (checkoutUrl) {
          message.success('Sesión de pago creada. Redirigiendo a Stripe Checkout.');
          window.location.href = checkoutUrl;
          return;
        }
        message.warning(stringValue(result.mensaje) || 'Stripe todavía no está configurado en el Control Plane.');
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
          suscripcion={suscripcion}
          plan={plan}
          licencia={licencia}
          pagos={pagos}
          recibos={recibos}
          diasRestantes={diasRestantes}
          onValidarLicencia={validarLicencia}
          onPagarStripe={iniciarPagoStripe}
        />
      )}

      {activeSection === 'consumo' && (
        <ConsumoSection loading={loading} empresaId={user?.empresaId} consumoRows={consumoRows} />
      )}

      {activeSection === 'apis' && (
        <ApisSection loading={loading} apiResumen={apiResumen} controlPlane={controlPlane} consultasApi={consultasApi} eventosConectividad={eventosConectividad} />
      )}

      {activeSection === 'configuracion' && (
        <ConfiguracionSection loading={loading} jobsHabilitados={jobsHabilitados} jobs={jobs} onReload={load} />
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
  onReloadErrors: (filters?: { status?: string; origen?: string; desde?: string; hasta?: string }) => Promise<void>;
}) => {
  const database = asRecord(systemOverview.database);
  const latency = asRecord(systemOverview.apiLatency);
  const uptime = asRecord(systemOverview.systemUptime);
  const trafficTrend = arrayValue(systemOverview.trafficTrend24h);
  const [trafficRange, setTrafficRange] = useState<TimeRangeSelection>({ type: 'relative', key: '1h' });
  const filteredTrafficTrend = useMemo(() => filterRowsByTimeRange(trafficTrend, 'bucket', trafficRange), [trafficRange, trafficTrend]);
  const totalTraffic = filteredTrafficTrend.reduce((sum, row) => sum + numberValue(row.api_internas) + numberValue(row.api_externas), 0);
  const totalErrors = filteredTrafficTrend.reduce((sum, row) => sum + numberValue(row.api_errores), 0) || Number(apiResumen.errores ?? 0);
  const errorRate = totalTraffic ? Math.round((totalErrors / totalTraffic) * 1000) / 10 : 0;
  const licenseState = stringValue(licencia.estado) || 'No Emitida';

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <SignalCard title="Disponibilidad" value={stringValue(uptime.display) || '-'} label="Tiempo activo del Backend" status="success" detail="Disponibilidad local calculada desde el proceso activo." loading={loading} />
        <SignalCard title="Errores API" value={`${totalErrors}`} label={`Errores en ${rangeLabel(trafficRange)}`} status={totalErrors > 0 ? 'danger' : 'success'} detail={`${errorRate}% de error estimado sobre tráfico filtrado.`} loading={loading} />
        <SignalCard title="Latencia API" value={`${numberValue(latency.avgMs)}ms`} label={`P95 ${numberValue(latency.p95Ms)}ms`} status={numberValue(latency.avgMs) > 800 ? 'danger' : numberValue(latency.avgMs) > 300 ? 'warning' : 'success'} detail="Latencia promedio y percentil para APIs monitoreadas." loading={loading} />
        <SignalCard title="Consumo API" value={Number(apiResumen.total ?? 0)} label="Consultas revisadas" status={Number(apiResumen.errores ?? 0) > 0 ? 'warning' : 'success'} detail={`${Number(apiResumen.exitosas ?? 0)} exitosas · ${Number(apiResumen.errores ?? 0)} con error.`} loading={loading} />
      </Row>

      <Row gutter={[16, 16]}>
        <SignalCard title="Estado De Licencia" value={licenseState} label="Contrato local" status={licenseState.toUpperCase().includes('ACTIVA') ? 'success' : 'warning'} detail="La vigencia y los pagos se revisan en Licencia y Pagos." loading={loading} />
        <SignalCard title="Plan Contratado" value={stringValue(plan.nombre) || '-'} label="Plan vigente" status="success" detail="Define usuarios, módulos y consumos permitidos." loading={loading} />
        <SignalCard title="Usuarios Activos" value={Number(summary.usuariosActivos ?? 0)} label="Usuarios habilitados" status="success" detail="Administrables desde el módulo Usuarios." loading={loading} />
        <SignalCard title="Tráfico Filtrado" value={totalTraffic} label={`Solicitudes en ${rangeLabel(trafficRange)}`} status={totalTraffic > 0 ? 'success' : 'warning'} detail="Suma APIs internas y externas en el rango seleccionado." loading={loading} />
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
      <Col xs={24}>
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
    </Row>

    <ErrorMonitor loading={loading} errores={errores} onReload={onReloadErrors} />
  </Space>
  );
};

const ErrorMonitor = ({ loading, errores, onReload }: {
  loading: boolean;
  errores: Record<string, unknown>;
  onReload: (filters?: { status?: string; origen?: string; desde?: string; hasta?: string }) => Promise<void>;
}) => {
  const [status, setStatus] = useState('TODOS');
  const [origen, setOrigen] = useState('TODOS');
  const [range, setRange] = useState<TimeRangeSelection>({ type: 'relative', key: '24h' });
  const [reloading, setReloading] = useState(false);
  const eventosRecientes = useMemo(() => arrayValue(errores.eventosRecientes), [errores]);
  const origenes = useMemo(() => {
    const fromApi = Array.isArray(errores.origenes) ? errores.origenes.map(String) : [];
    const fromRows = eventosRecientes
      .map((row) => row.origen)
      .filter((value) => value !== null && value !== undefined)
      .map(String);
    return Array.from(new Set([...fromApi, ...fromRows])).sort((a, b) => a.localeCompare(b));
  }, [errores, eventosRecientes]);
  const statusCodes = useMemo(() => {
    const fromApi = Array.isArray(errores.statusCodes) ? errores.statusCodes.map(String) : [];
    const fromRows = eventosRecientes
      .map((row) => row.status_code ?? row.status_http ?? row.statusCode ?? row.statusHttp)
      .filter((value) => value !== null && value !== undefined)
      .map(String);
    return Array.from(new Set([...fromApi, ...fromRows])).sort((a, b) => Number(a) - Number(b));
  }, [errores, eventosRecientes]);

  const reloadWith = async (nextStatus = status, nextOrigen = origen, nextRange = range) => {
    const { desde, hasta } = rangeToApiParams(nextRange);
    setReloading(true);
    try {
      await onReload({
        status: nextStatus === 'TODOS' ? undefined : nextStatus,
        origen: nextOrigen === 'TODOS' ? undefined : nextOrigen,
        desde,
        hasta,
      });
    } finally {
      setReloading(false);
    }
  };
  const reload = () => reloadWith();

  return (
    <Card
      title="Eventos"
      loading={loading}
      extra={(
        <Space wrap>
          <Button size="small" icon={<ReloadOutlined />} loading={reloading} onClick={reload}>Actualizar</Button>
          <Select
            size="small"
            value={status}
            style={{ width: 140 }}
            onChange={(nextStatus) => {
              setStatus(nextStatus);
              void reloadWith(nextStatus, origen, range);
            }}
            options={[
              { value: 'TODOS', label: 'Todos HTTP' },
              ...statusCodes.map((code) => ({ value: code, label: `HTTP ${code}` })),
            ]}
          />
          <Select
            size="small"
            value={origen}
            style={{ width: 170 }}
            onChange={(nextOrigen) => {
              setOrigen(nextOrigen);
              void reloadWith(status, nextOrigen, range);
            }}
            options={[
              { value: 'TODOS', label: 'Todos Origenes' },
              ...origenes.map((value) => ({ value, label: value })),
            ]}
          />
          <TimeRangeControls
            value={range}
            onChange={(nextRange) => {
              setRange(nextRange);
              void reloadWith(status, origen, nextRange);
            }}
            onRefresh={reload}
            loading={reloading}
            hideRefresh
          />
        </Space>
      )}
    >
      <ApiErrorTable rows={eventosRecientes} loading={loading} />
    </Card>
  );
};

const ApiErrorTable = ({ rows, loading }: {
  rows: Record<string, unknown>[];
  loading: boolean;
}) => (
  <Table
    rowKey={(row, index) => String(row.id ?? `${row.origen ?? ''}-${row.codigo_error ?? row.codigo ?? row.codigoError ?? index}`)}
    columns={[
      { title: 'Fecha', dataIndex: 'fecha', width: 180, render: (_, row) => formatValue(resolveApiDate(row)) },
      { title: 'Origen', dataIndex: 'origen', ellipsis: true, render: (value) => formatValue(cleanApiOrigin(value)) },
      { title: 'Código', dataIndex: 'codigo_error', ellipsis: true, render: (_, row) => formatValue(row.codigo_error ?? row.codigo) },
      {
        title: 'HTTP',
        dataIndex: 'status_code',
        width: 90,
        render: (value, row) => <StatusTag value={value ?? row.status_http ?? row.statusCode ?? row.statusHttp} />,
      },
      { title: 'Significado', dataIndex: 'mensaje', ellipsis: true, render: formatValue },
    ]}
    dataSource={rows}
    loading={loading}
    pagination={{ pageSize: 10, showSizeChanger: true }}
    size="small"
    scroll={{ x: true, y: 420 }}
  />
);

const StatusTag = ({ value }: { value: unknown }) => {
  const status = Number(value ?? 0);
  const color = status >= 500 ? 'red' : status >= 400 ? 'orange' : status >= 300 ? 'blue' : 'green';
  return <Tag color={color}>{status ? `HTTP ${status}` : '-'}</Tag>;
};

const timeRangeOptions: Array<{ label: string; value: RelativeTimeRangeKey }> = [
  { label: '5min', value: '5m' },
  { label: '10min', value: '10m' },
  { label: '15min', value: '15m' },
  { label: '30min', value: '30m' },
  { label: '1hr', value: '1h' },
  { label: '3hrs', value: '3h' },
  { label: '6hrs', value: '6h' },
  { label: '12hrs', value: '12h' },
  { label: '24hrs', value: '24h' },
];

const recentAbsoluteRanges = [
  { from: dayjs().subtract(1, 'hour').startOf('minute').toISOString(), to: dayjs().startOf('minute').toISOString() },
  { from: dayjs().subtract(30, 'minute').startOf('minute').toISOString(), to: dayjs().startOf('minute').toISOString() },
  { from: dayjs().subtract(2, 'hour').startOf('minute').toISOString(), to: dayjs().subtract(1, 'hour').startOf('minute').toISOString() },
];

const TimeRangeControls = ({ value, onChange, onRefresh, loading, hideRefresh = false }: {
  value: TimeRangeSelection;
  onChange: (value: TimeRangeSelection) => void;
  onRefresh: () => Promise<void>;
  loading: boolean;
  hideRefresh?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<TimeRangeSelection>(value);
  const quickRanges = timeRangeOptions.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
  const applyDraft = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <Space wrap>
      <Popover
        trigger="click"
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setDraft(value);
        }}
        placement="bottomRight"
        overlayStyle={{ width: 860 }}
        content={(
          <div style={{ width: 820 }}>
            <Row gutter={16}>
              <Col span={11}>
                <Typography.Title level={5} style={{ marginTop: 0 }}>Rango De Tiempo Absoluto</Typography.Title>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Typography.Text strong>Desde</Typography.Text>
                    <DatePicker
                      showTime
                      style={{ width: '100%', marginTop: 6 }}
                      value={dayjs(draft.type === 'absolute' ? draft.from : getRangeStart(draft))}
                      onChange={(date) => {
                        if (!date) return;
                        const to = draft.type === 'absolute' ? draft.to : dayjs().toISOString();
                        setDraft({ type: 'absolute', from: date.toISOString(), to });
                      }}
                    />
                  </div>
                  <div>
                    <Typography.Text strong>Hasta</Typography.Text>
                    <DatePicker
                      showTime
                      style={{ width: '100%', marginTop: 6 }}
                      value={dayjs(draft.type === 'absolute' ? draft.to : getRangeEnd(draft))}
                      onChange={(date) => {
                        if (!date) return;
                        const from = draft.type === 'absolute' ? draft.from : getRangeStart(draft).toISOString();
                        setDraft({ type: 'absolute', from, to: date.toISOString() });
                      }}
                    />
                  </div>
                  <Button type="primary" onClick={applyDraft}>Aplicar Rango</Button>
                  <div>
                    <Typography.Text strong>Rangos Absolutos Recientes</Typography.Text>
                    <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                      {recentAbsoluteRanges.map((item) => (
                        <Button
                          key={`${item.from}-${item.to}`}
                          type="link"
                          style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                          onClick={() => setDraft({ type: 'absolute', from: item.from, to: item.to })}
                        >
                          {dayjs(item.from).format('YYYY-MM-DD HH:mm:ss')} a {dayjs(item.to).format('YYYY-MM-DD HH:mm:ss')}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </Space>
              </Col>
              <Col span={13}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Buscar rangos rápidos"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <div style={{ maxHeight: 360, overflowY: 'auto', borderLeft: '1px solid #f0f0f0' }}>
                  {quickRanges.map((option) => (
                    <Button
                      key={option.value}
                      type="text"
                      block
                      style={{
                        textAlign: 'left',
                        height: 44,
                        borderRadius: 0,
                        background: draft.type === 'relative' && draft.key === option.value ? '#f5f5f5' : undefined,
                      }}
                      onClick={() => {
                        const next = { type: 'relative', key: option.value } as TimeRangeSelection;
                        setDraft(next);
                        onChange(next);
                        setOpen(false);
                      }}
                    >
                      Últimos {option.label}
                    </Button>
                  ))}
                </div>
                <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 12 }}>
                  <Typography.Text type="secondary">Hora Del Navegador</Typography.Text>
                  <Tag>UTC-03</Tag>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      >
        <Button size="small" icon={<CalendarOutlined />}>{rangeLabel(value)}</Button>
      </Popover>
      {!hideRefresh && <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>Actualizar</Button>}
    </Space>
  );
};

const getRangeStart = (range: TimeRangeSelection) => {
  if (range.type === 'absolute') return dayjs(range.from);
  const now = dayjs();
  if (range.key === '5m') return now.subtract(5, 'minute');
  if (range.key === '10m') return now.subtract(10, 'minute');
  if (range.key === '15m') return now.subtract(15, 'minute');
  if (range.key === '30m') return now.subtract(30, 'minute');
  if (range.key === '1h') return now.subtract(1, 'hour');
  if (range.key === '3h') return now.subtract(3, 'hour');
  if (range.key === '6h') return now.subtract(6, 'hour');
  if (range.key === '12h') return now.subtract(12, 'hour');
  return now.subtract(24, 'hour');
};

const getRangeEnd = (range: TimeRangeSelection) => range.type === 'absolute' ? dayjs(range.to) : dayjs();

const rangeLabel = (range: TimeRangeSelection) => {
  if (range.type === 'absolute') return `${dayjs(range.from).format('DD/MM HH:mm')} - ${dayjs(range.to).format('DD/MM HH:mm')}`;
  return timeRangeOptions.find((option) => option.value === range.key)?.label || '1hr';
};

const rangeToApiParams = (range: TimeRangeSelection) => ({
  desde: getRangeStart(range).toISOString(),
  hasta: getRangeEnd(range).toISOString(),
});

const filterRowsByTimeRange = (rows: Record<string, unknown>[], field: string, range: TimeRangeSelection) => {
  const start = getRangeStart(range);
  const end = getRangeEnd(range);
  return rows.filter((row) => {
    const raw = row[field];
    if (!raw) return false;
    const value = dayjs(String(raw));
    return value.isValid() && value.isAfter(start) && value.isBefore(end);
  });
};

const cleanApiOrigin = (value: unknown) => (stringValue(value) ?? '')
  .replace(/^INTERNA:/i, '')
  .replace(/^EXTERNA:/i, '');

const resolveApiDate = (row: Record<string, unknown>) => row.fecha
  ?? row.fechaEvento
  ?? row.fecha_evento
  ?? row.fechaConsulta
  ?? row.fecha_consulta
  ?? row.timestamp
  ?? row.fecha_hora_creacion
  ?? row.fechaHoraCreacion
  ?? row.fecha_hora_modificacion
  ?? row.fechaHoraModificacion;

const LicenciaPagosSection = ({ loading, empresaId, suscripcionActivaId, suscripcion, plan, licencia, pagos, recibos, diasRestantes, onValidarLicencia, onPagarStripe }: {
  loading: boolean;
  empresaId?: string | null;
  suscripcionActivaId: number | null;
  suscripcion: Record<string, unknown>;
  plan: Record<string, unknown>;
  licencia: Record<string, unknown>;
  pagos: Record<string, unknown>[];
  recibos: Record<string, unknown>[];
  diasRestantes: number | null;
  onValidarLicencia: () => void;
  onPagarStripe: () => void;
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
        <Card title="Pago De La Licencia" loading={loading} extra={<Button type="primary" icon={<CreditCardOutlined />} onClick={onPagarStripe}>Pagar Con Stripe</Button>}>
          <Alert
            type="info"
            showIcon
            message="Pasarela Stripe"
            description="El pago se inicia en Stripe Checkout desde el Control Plane. Regula solo conserva la referencia, estado y eventos de conciliación."
          />
          <Descriptions column={1} size="small" style={{ marginTop: 16 }} items={[
            { key: 'estadoPago', label: 'Estado Del Pago', children: pagos.length > 0 ? formatValue(pagos[0].estado) : 'Sin pago registrado' },
            { key: 'monto', label: 'Monto De Licencia', children: pagos.length > 0 ? formatValue(pagos[0].monto) : '-' },
            { key: 'vencimiento', label: 'Vencimiento De Factura', children: pagos.length > 0 ? formatValue(pagos[0].fechaVencimiento ?? pagos[0].fechaPago) : '-' },
            { key: 'proveedor', label: 'Proveedor', children: pagos.length > 0 ? formatValue(pagos[0].proveedorPago ?? pagos[0].metodoPago) : 'Stripe Checkout' },
            { key: 'referencia', label: 'Referencia', children: pagos.length > 0 ? formatValue(pagos[0].stripeCheckoutSessionId ?? pagos[0].comprobanteReferencia ?? pagos[0].codigo) : '-' },
          ]} />
        </Card>
      </Col>
    </Row>
    <DataTable title="Suscripcion Vigente" rows={suscripcion.id ? [suscripcion] : []} loading={loading} />
    <DataTable title="Pagos" rows={pagos} loading={loading} />
    <Alert
      type="info"
      showIcon
      message="Recibos Electronicos"
      description="Los recibos son emitidos por el Control Plane despues de pagos confirmados. El envio por correo y el hash del PDF quedan trazados en cada registro."
    />
    <DataTable title="Recibos Electronicos" rows={recibos} loading={loading} />
  </Space>
);

const ConsumoSection = ({ loading, empresaId, consumoRows }: {
  loading: boolean;
  empresaId?: string | null;
  consumoRows: Record<string, unknown>[];
}) => (
  <Space direction="vertical" style={{ width: '100%' }} size="middle">
    <ConsumoVsPlan empresaId={empresaId} />
    <DataTable title="Uso De Suscripcion" rows={consumoRows} loading={loading} />
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

const ConfiguracionSection = ({ loading, jobsHabilitados, jobs, onReload }: {
  loading: boolean;
  jobsHabilitados: boolean;
  jobs: JobLocal[];
  onReload: () => Promise<void>;
}) => (
  <Card title="Jobs Locales (Agente On-Premise)" loading={loading} style={{ width: '100%' }}>
    <JobsConfigurator loading={loading} jobs={jobs} jobsHabilitados={jobsHabilitados} onReload={onReload} />
  </Card>
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

const SignalCard = ({ title, value, label, status, detail, loading, onOpen }: {
  title: string;
  value: string | number;
  label: string;
  status: 'success' | 'warning' | 'danger';
  detail: string;
  loading: boolean;
  onOpen?: () => void;
}) => {
  const color = status === 'danger' ? '#cf1322' : status === 'warning' ? '#d48806' : '#237804';
  return (
    <Col xs={24} md={12} xl={6}>
      <Card size="small" loading={loading} hoverable={Boolean(onOpen)} onClick={onOpen}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Typography.Text strong>{title}</Typography.Text>
            <Tag color={status === 'danger' ? 'red' : status === 'warning' ? 'gold' : 'green'}>{status === 'danger' ? 'Atención' : status === 'warning' ? 'Revisar' : 'OK'}</Tag>
          </Space>
          <Typography.Title level={2} style={{ margin: 0, color }}>{value}</Typography.Title>
          <Typography.Text>{label}</Typography.Text>
          <Typography.Text type="secondary">{detail}</Typography.Text>
        </Space>
      </Card>
    </Col>
  );
};

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
  eventosRecientes: [],
  origenes: [],
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
