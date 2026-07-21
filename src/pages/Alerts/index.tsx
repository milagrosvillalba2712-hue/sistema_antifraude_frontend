import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Col,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { alertsApi, type AlertListParams } from '../../api/alerts';
import { ActionDropdown, useConfirmAction } from '../../components/common';
import { useAuthStore } from '../../store';
import { formatDate } from '../../utils';
import { alertStateTagColor, severityTagColor } from '../../theme/antdTheme';
import type {
  Alerta,
  AlertaDetalle,
  AlertaFiltros,
  AnalistaDisponible,
  EvidenciaAlerta,
  EvidenciaAlertaRequest,
  HallazgoAlerta,
  ReglaAlerta,
  ResolucionAlertaRequest,
  TransaccionAlerta,
} from '../../types';

const initialResolution: ResolucionAlertaRequest = {
  resultado: 'FALSO_POSITIVO',
  conclusion: '',
  decision: '',
  justificacion: '',
  evidenciaDescripcion: '',
  contactoCliente: '',
  fondosRetenidos: false,
  movimientoLiberable: true,
  requiereRos: false,
  requiereBloqueo: false,
  requiereEscalamientoLegal: false,
};

const defaultFilters: Record<string, unknown> = { sort: 'recientes', size: 10 };
const defaultEvidence: EvidenciaAlertaRequest = {
  nombre: '',
  descripcion: '',
  tipo: 'DOCUMENTO_SOLICITADO',
  extension: 'PDF',
  mimeType: 'application/pdf',
  tamanoBytes: 0,
  referenciaArchivo: '',
  estado: 'CARGADA',
};

const Alerts = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const resolverAlertId = id ? Number(id) : null;
  const { user, hasPermission } = useAuthStore();
  const { confirm, confirmationModal } = useConfirmAction();
  const [filterForm] = Form.useForm();
  const [resolutionForm] = Form.useForm<ResolucionAlertaRequest>();
  const [approvalForm] = Form.useForm();
  const [evidenceForm] = Form.useForm<EvidenciaAlertaRequest>();

  const [alerts, setAlerts] = useState<Alerta[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [filtersData, setFiltersData] = useState<AlertaFiltros | null>(null);
  const [analysts, setAnalysts] = useState<AnalistaDisponible[]>([]);
  const [detail, setDetail] = useState<AlertaDetalle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('alerta');
  const [selectedAlert, setSelectedAlert] = useState<Alerta | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, unknown>>(defaultFilters);
  const [reassignTarget, setReassignTarget] = useState<number | undefined>();
  const [reassignReason, setReassignReason] = useState('');
  const [reassignObservation, setReassignObservation] = useState('');
  const [editingEvidence, setEditingEvidence] = useState<EvidenciaAlerta | null>(null);

  const currentUserId = user?.usuarioId ?? analysts.find((analyst) => analyst.email === user?.email)?.usuarioId;
  const isAssignedToMe = Boolean(detail?.alerta.asignadoA && currentUserId === detail.alerta.asignadoA);
  const canResolve = Boolean(isAssignedToMe && detail?.alerta.estado !== 'CERRADA' && hasPermission('ALERTAS_RESOLVER'));
  const canReassign = Boolean(isAssignedToMe && detail?.alerta.estado !== 'CERRADA');
  const canApprove = Boolean(detail?.alerta.estado === 'PENDIENTE_APROBACION' && hasPermission('ALERTAS_APROBAR'));
  const advancedDate = filters.rangoFecha === 'avanzado';

  const buildListParams = useCallback((): AlertListParams => {
    const range = filters.customRange as [dayjs.Dayjs, dayjs.Dayjs] | undefined;
    return {
      page,
      size: pageSize,
      search: String(filters.search || '') || undefined,
      severidad: String(filters.severidad || '') || undefined,
      estado: String(filters.estado || '') || undefined,
      escenarioId: String(filters.escenarioId || '') || undefined,
      analistaId: String(filters.analistaId || '') || undefined,
      rangoFecha: String(filters.rangoFecha || '') || undefined,
      desde: advancedDate ? range?.[0]?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      hasta: advancedDate ? range?.[1]?.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      sort: String(filters.sort || 'recientes'),
    };
  }, [advancedDate, filters, page, pageSize]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertData, filtros, analystData] = await Promise.all([
        alertsApi.getAll(buildListParams()),
        alertsApi.getFiltros(),
        alertsApi.getAnalistasDisponibles(),
      ]);
      setAlerts(alertData.content);
      setTotalElements(alertData.totalElements);
      setFiltersData(filtros);
      setAnalysts(analystData);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las alertas.');
    } finally {
      setLoading(false);
    }
  }, [buildListParams]);

  const fetchDetail = useCallback(async (alertId: number) => {
    setDetailLoading(true);
    setError(null);
    try {
      const [detailData, analystData] = await Promise.all([
        alertsApi.getDetail(alertId),
        alertsApi.getAnalistasDisponibles(),
      ]);
      setDetail(detailData);
      setSelectedAlert(detailData.alerta);
      setAnalysts(analystData);
      resolutionForm.setFieldsValue(detailData.resolucion || initialResolution);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el detalle de la alerta.');
    } finally {
      setDetailLoading(false);
    }
  }, [resolutionForm]);

  useEffect(() => {
    if (resolverAlertId) {
      setLoading(true);
      fetchDetail(resolverAlertId).finally(() => setLoading(false));
    } else {
      fetchList();
    }
  }, [fetchDetail, fetchList, resolverAlertId]);

  const openDetail = async (alert: Alerta, tab = 'alerta') => {
    setSelectedAlert(alert);
    setActiveTab(tab);
    setDetailOpen(true);
    await fetchDetail(alert.id);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters(defaultFilters);
    setPage(0);
    setPageSize(10);
  };

  const requestReassign = () => {
    if (!detail?.alerta || !reassignTarget || !reassignReason.trim()) return;
    const analyst = analysts.find((item) => item.usuarioId === reassignTarget);
    confirm({
      title: 'Confirmar Reasignación',
      description: `Se reasignará la alerta ${detail.alerta.codigo} a ${analyst?.nombre || 'otro analista'}.`,
      detail: `Motivo: ${reassignReason}. Observación: ${reassignObservation || 'Sin observación adicional'}.`,
      confirmLabel: 'Reasignar',
      variant: 'warning',
      action: async () => {
        await alertsApi.reasignar(detail.alerta.id, reassignTarget, reassignReason.trim(), reassignObservation.trim());
        setReassignTarget(undefined);
        setReassignReason('');
        setReassignObservation('');
        await fetchDetail(detail.alerta.id);
        await fetchList();
        setActiveTab('alerta');
      },
    });
  };

  const requestEvidenceSave = async () => {
    if (!detail?.alerta) return;
    const values = await evidenceForm.validateFields();
    confirm({
      title: editingEvidence ? 'Confirmar Edición De Evidencia' : 'Confirmar Carga De Evidencia',
      description: `${editingEvidence ? 'Se actualizará' : 'Se cargará'} la evidencia ${values.nombre}.`,
      detail: 'Formatos compatibles: PDF, JPG, JPEG, PNG, CSV, XLSX, DOCX, TXT. Tamaño máximo: 10 MB.',
      confirmLabel: editingEvidence ? 'Guardar' : 'Cargar',
      action: async () => {
        if (editingEvidence?.id) await alertsApi.actualizarEvidencia(detail.alerta.id, editingEvidence.id, values);
        else await alertsApi.crearEvidencia(detail.alerta.id, values);
        setEditingEvidence(null);
        evidenceForm.setFieldsValue(defaultEvidence);
        await fetchDetail(detail.alerta.id);
      },
    });
  };

  const requestEvidenceDelete = (evidence: EvidenciaAlerta) => {
    if (!detail?.alerta || !evidence.id) return;
    confirm({
      title: 'Confirmar Eliminación De Evidencia',
      description: `Se eliminará la evidencia ${evidence.nombre}.`,
      detail: 'Esta acción quedará registrada en auditoría.',
      confirmLabel: 'Eliminar',
      variant: 'critical',
      action: async () => {
        await alertsApi.eliminarEvidencia(detail.alerta.id, evidence.id!);
        await fetchDetail(detail.alerta.id);
      },
    });
  };

  const requestResolution = async () => {
    if (!detail?.alerta) return;
    const values = await resolutionForm.validateFields();
    confirm({
      title: 'Enviar Resolución A Aprobación',
      description: `La alerta ${detail.alerta.codigo} quedará pendiente de aprobación del supervisor.`,
      detail: `Resultado propuesto: ${labelFor(values.resultado)}.`,
      confirmLabel: 'Enviar Propuesta',
      variant: values.resultado === 'FRAUDE_CONFIRMADO' || values.requiereRos ? 'critical' : 'warning',
      action: async () => {
        setSaving(true);
        await alertsApi.resolverFormal(detail.alerta.id, values);
        setSaving(false);
        navigate('/alerts');
      },
    });
  };

  const requestApprove = async () => {
    if (!detail?.alerta) return;
    const values = await approvalForm.validateFields();
    confirm({
      title: 'Aprobar Resolución',
      description: `Se aprobará la resolución y se cerrará la alerta ${detail.alerta.codigo}.`,
      detail: values.observacion || 'Sin observación adicional.',
      confirmLabel: 'Aprobar',
      variant: 'warning',
      action: async () => {
        await alertsApi.aprobarResolucion(detail.alerta.id, values.observacion || '');
        navigate('/alerts');
      },
    });
  };

  const requestReject = async () => {
    if (!detail?.alerta) return;
    const values = await approvalForm.validateFields(['motivo', 'faltantes']);
    confirm({
      title: 'Rechazar Resolución',
      description: `La alerta ${detail.alerta.codigo} volverá a reevaluación.`,
      detail: `Motivo: ${values.motivo}. Faltantes: ${values.faltantes || 'No indicado'}.`,
      confirmLabel: 'Rechazar',
      variant: 'critical',
      action: async () => {
        await alertsApi.rechazarResolucion(detail.alerta.id, values.motivo, values.faltantes || '');
        navigate('/alerts');
      },
    });
  };

  const columns: ColumnsType<Alerta> = [
    {
      title: 'Alerta',
      dataIndex: 'codigo',
      render: (_, alert) => <Space direction="vertical" size={0}><Typography.Text code>{alert.codigo || `#${alert.id}`}</Typography.Text><Typography.Text type="secondary">Score {alert.score ?? '-'}</Typography.Text></Space>,
    },
    { title: 'Llegada', dataIndex: 'fechaGeneracion', render: (value) => formatDate(value) },
    { title: 'Cliente', render: (_, alert) => <Space direction="vertical" size={0}><Typography.Text strong>{alert.clienteNombre || alert.clienteDocumento || '-'}</Typography.Text><Typography.Text type="secondary">{alert.clienteDocumento || '-'}</Typography.Text></Space> },
    { title: 'Severidad', render: (_, alert) => <Tag color={severityTagColor(alert.severidad || alert.prioridad)}>{labelFor(alert.severidad || alert.prioridad)}</Tag> },
    { title: 'Estado', dataIndex: 'estado', render: (value) => <Tag color={alertStateTagColor(value)}>{labelFor(value)}</Tag> },
    { title: 'Escenario / Regla', render: (_, alert) => <Space direction="vertical" size={0}><Typography.Text>{alert.escenarioNombre || 'Sin escenario'}</Typography.Text><Typography.Text type="secondary">{alert.reglaNombre || 'Evaluación general'}</Typography.Text></Space> },
    { title: 'Analista', dataIndex: 'asignadoNombre', render: (value) => value || <Typography.Text type="secondary">Sin asignar</Typography.Text> },
    {
      title: '',
      align: 'right',
      width: 64,
      render: (_, alert) => {
        const assignedToMe = Boolean(alert.asignadoA && currentUserId === alert.asignadoA);
        const showResolve = assignedToMe && alert.estado !== 'CERRADA' && hasPermission('ALERTAS_RESOLVER');
        const showReassign = assignedToMe && alert.estado !== 'CERRADA';
        return (
          <ActionDropdown
            items={[
              { key: 'view', label: 'Ver Detalle', icon: <EyeOutlined />, onClick: () => openDetail(alert) },
              { key: 'reassign', label: 'Reasignar', icon: <SwapOutlined />, disabled: !showReassign, onClick: () => openDetail(alert, 'reasignacion') },
              { key: 'resolve', label: 'Resolver', icon: <SendOutlined />, disabled: !showResolve, onClick: () => navigate(`/alerts/${alert.id}/resolver`) },
            ]}
          />
        );
      },
    },
  ];

  if (loading && resolverAlertId) return <Card><Space><WarningOutlined /> Cargando detalle...</Space></Card>;

  if (resolverAlertId) {
    return (
      <ResolverPage
        detail={detail}
        error={error}
        canResolve={canResolve}
        canApprove={canApprove}
        saving={saving}
        resolutionForm={resolutionForm}
        approvalForm={approvalForm}
        evidenceForm={evidenceForm}
        editingEvidence={editingEvidence}
        setEditingEvidence={setEditingEvidence}
        onBack={() => navigate('/alerts')}
        onSubmitResolution={requestResolution}
        onApprove={requestApprove}
        onReject={requestReject}
        onSaveEvidence={requestEvidenceSave}
        onDeleteEvidence={requestEvidenceDelete}
      >
        {confirmationModal}
      </ResolverPage>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <AlertsHeader />
      {error && <Alert type="error" message={error} showIcon />}
      <Card size="small" title="Filtros">
        <Form form={filterForm} layout="vertical" initialValues={defaultFilters} onValuesChange={(_, values) => {
          const nextSize = Number(values.size || 10);
          setFilters(values);
          setPageSize(nextSize);
          setPage(0);
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
            <Form.Item label="Buscar" name="search" style={{ marginBottom: 0 }}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="Código, cliente, documento o regla" />
            </Form.Item>
            <Form.Item label="Severidad" name="severidad" style={{ marginBottom: 0 }}>
              <Select allowClear placeholder="Todas" options={filtersData?.severidades?.map(normalizeOption)} />
            </Form.Item>
            <Form.Item label="Estado" name="estado" style={{ marginBottom: 0 }}>
              <Select allowClear placeholder="Todos" options={filtersData?.estados?.map(normalizeOption)} />
            </Form.Item>
            <Form.Item label="Escenario" name="escenarioId" style={{ marginBottom: 0 }}>
              <Select allowClear showSearch optionFilterProp="label" placeholder="Todos" options={filtersData?.escenarios} />
            </Form.Item>
            <Form.Item label="Analista" name="analistaId" style={{ marginBottom: 0 }}>
              <Select allowClear showSearch optionFilterProp="label" placeholder="Todos" options={filtersData?.analistas} />
            </Form.Item>
            <Form.Item label="Rango de Fecha" name="rangoFecha" style={{ marginBottom: 0 }}>
              <Select allowClear placeholder="Sin rango" options={filtersData?.rangosFecha?.map(normalizeOption)} />
            </Form.Item>
            <Form.Item label="Orden" name="sort" style={{ marginBottom: 0 }}>
              <Select options={filtersData?.ordenes?.map(normalizeOption)} />
            </Form.Item>
            <Form.Item label="Registros" name="size" style={{ marginBottom: 0 }}>
              <Select options={(filtersData?.tamanosPagina || [10, 20, 50, 100]).map((value) => ({ value, label: `${value} registros` }))} />
            </Form.Item>
            {advancedDate && (
              <Form.Item label="Desde / Hasta Fecha y Hora" name="customRange" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            )}
            <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Button style={{ width: '50%' }} onClick={resetFilters}>Limpiar Filtros</Button>
                <Button style={{ width: '50%' }} icon={<ReloadOutlined />} onClick={fetchList}>Actualizar</Button>
              </Space.Compact>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={alerts}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          pageSizeOptions: (filtersData?.tamanosPagina || [10, 20, 50, 100]).map(String),
          showTotal: (total) => `${total} alertas`,
          onChange: (nextPage, nextSize) => {
            setPage(nextPage - 1);
            setPageSize(nextSize);
            filterForm.setFieldValue('size', nextSize);
          },
        }}
      />

      <AlertDetailModal
        open={detailOpen}
        detail={detail}
        selectedAlert={selectedAlert}
        activeTab={activeTab}
        detailLoading={detailLoading}
        analysts={analysts}
        canReassign={canReassign}
        canResolve={canResolve}
        reassignTarget={reassignTarget}
        reassignReason={reassignReason}
        reassignObservation={reassignObservation}
        onClose={() => setDetailOpen(false)}
        onTabChange={setActiveTab}
        onResolve={() => detail?.alerta && navigate(`/alerts/${detail.alerta.id}/resolver`)}
        onReassignTab={() => setActiveTab('reasignacion')}
        onReassign={requestReassign}
        onReassignTarget={setReassignTarget}
        onReassignReason={setReassignReason}
        onReassignObservation={setReassignObservation}
      />
      {confirmationModal}
    </Space>
  );
};

const AlertsHeader = () => (
  <div>
    <Typography.Title level={2} style={{ margin: 0 }}>Gestión de Alertas</Typography.Title>
    <Typography.Text type="secondary">Priorización, investigación y documentación de alertas generadas por reglas activas.</Typography.Text>
  </div>
);

const AlertDetailModal = (props: DetailModalProps) => {
  const alert = props.detail?.alerta || props.selectedAlert;
  const severity = alert?.severidad || alert?.prioridad || 'BAJA';
  return (
    <Modal
      open={props.open}
      onCancel={props.onClose}
      title={alert ? `Detalle de Alerta ${alert.codigo}` : 'Detalle de Alerta'}
      footer={[
        props.canReassign && <Button key="reassign" onClick={props.onReassignTab}>Reasignar</Button>,
        props.canResolve && <Button key="resolve" type="primary" onClick={props.onResolve}>Resolver</Button>,
      ].filter(Boolean)}
      width={1080}
      centered
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
    >
      {!alert ? <Empty description="Selecciona una alerta" /> : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={severityTagColor(severity)}>{labelFor(severity)}</Tag>
            <Tag color={alertStateTagColor(alert.estado)}>{labelFor(alert.estado)}</Tag>
            <Tag>Score {alert.score ?? '-'}</Tag>
            <Typography.Text type="secondary">Analista: {alert.asignadoNombre || 'Sin asignar'}</Typography.Text>
          </Space>
          <Tabs activeKey={props.activeTab} onChange={props.onTabChange} items={detailTabs(props.detail, props.detailLoading)} />
          {props.activeTab === 'reasignacion' && (
            <ReassignPanel
              analysts={props.analysts}
              currentAssignedId={alert.asignadoA}
              target={props.reassignTarget}
              reason={props.reassignReason}
              observation={props.reassignObservation}
              onTarget={props.onReassignTarget}
              onReason={props.onReassignReason}
              onObservation={props.onReassignObservation}
              onSubmit={props.onReassign}
            />
          )}
        </Space>
      )}
    </Modal>
  );
};

interface DetailModalProps {
  open: boolean;
  detail: AlertaDetalle | null;
  selectedAlert: Alerta | null;
  activeTab: string;
  detailLoading: boolean;
  analysts: AnalistaDisponible[];
  canReassign: boolean;
  canResolve: boolean;
  reassignTarget?: number;
  reassignReason: string;
  reassignObservation: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onResolve: () => void;
  onReassignTab: () => void;
  onReassign: () => void;
  onReassignTarget: (value?: number) => void;
  onReassignReason: (value: string) => void;
  onReassignObservation: (value: string) => void;
}

const detailTabs = (detail: AlertaDetalle | null, loading: boolean) => [
  { key: 'alerta', label: 'Alerta', children: <DetailSection loading={loading} detail={detail} tab="alerta" /> },
  { key: 'cliente', label: 'Cliente', children: <DetailSection loading={loading} detail={detail} tab="cliente" /> },
  { key: 'transaccion', label: 'Transacción', children: <DetailSection loading={loading} detail={detail} tab="transaccion" /> },
  { key: 'evidencia', label: 'Evidencia', children: <DetailSection loading={loading} detail={detail} tab="evidencia" /> },
  { key: 'conclusion', label: 'Conclusión', children: <DetailSection loading={loading} detail={detail} tab="conclusion" /> },
  { key: 'acciones', label: 'Acciones', children: <DetailSection loading={loading} detail={detail} tab="acciones" /> },
  { key: 'reasignacion', label: 'Reasignación', children: null },
].filter((tab) => tab.key !== 'reasignacion');

const DetailSection = ({ loading, detail, tab }: { loading: boolean; detail: AlertaDetalle | null; tab: string }) => {
  if (loading) return <Typography.Text type="secondary">Cargando detalle...</Typography.Text>;
  if (!detail) return <Empty description="Sin detalle disponible" />;
  if (tab === 'alerta') return <AlertTab detail={detail} />;
  if (tab === 'cliente') return <ClienteTab detail={detail} />;
  if (tab === 'transaccion') return <TransaccionTab detail={detail} />;
  if (tab === 'evidencia') return <EvidenceList evidencias={detail.evidencias} readonly />;
  if (tab === 'acciones') return <Timeline items={(detail.accionesTimeline || detail.timeline).map((event) => ({ children: <><Typography.Text strong>{labelFor(event.tipo)}</Typography.Text><br /><Typography.Text>{event.descripcion}</Typography.Text><br /><Typography.Text type="secondary">{formatDate(event.fecha)} {event.usuario ? `por ${event.usuario}` : ''}</Typography.Text></> }))} />;
  return <ConclusionTab detail={detail} />;
};

const AlertTab = ({ detail }: { detail: AlertaDetalle }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Descriptions bordered column={2} size="small" items={objectItems(detail.alerta as unknown as Record<string, unknown>, ['transaccionId', 'reglaId'])} />
    <Typography.Title level={5}>Reglas Disparadas</Typography.Title>
    <Table rowKey={(row) => String(row.id ?? row.codigo)} size="small" pagination={false} dataSource={detail.reglasDisparadas} columns={ruleColumns()} />
    <Typography.Title level={5}>Hallazgos Regulatorios y de Control</Typography.Title>
    <HallazgosList hallazgos={detail.hallazgosRegulatorios} />
  </Space>
);

const ClienteTab = ({ detail }: { detail: AlertaDetalle }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Alert type="warning" showIcon message={`Fuente: ${detail.cliente?.fuente || 'API externa no disponible'}`} description="Visualización preparada para proveedores externos de identidad, KYC, judicial y académico." />
    <SectionDescriptions title="Datos Personales" data={detail.cliente?.personal} />
    <SectionDescriptions title="Datos Laborales" data={detail.cliente?.laboral} />
    <SectionDescriptions title="Datos Académicos" data={detail.cliente?.academico} />
    <SectionDescriptions title="Datos Familiares" data={detail.cliente?.familiar} />
    <SectionDescriptions title="Datos Judiciales Y Regulatorios" data={detail.cliente?.judicialRegulatorio} />
  </Space>
);

const TransaccionTab = ({ detail }: { detail: AlertaDetalle }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Descriptions bordered column={2} size="small" items={objectItems(detail.transaccion as unknown as Record<string, unknown>, ['remitente', 'beneficiario', 'operacion', 'controlSeguimiento', 'internacional'])} />
    <SectionDescriptions title="Remitente" data={detail.transaccion?.remitente} />
    <SectionDescriptions title="Beneficiario" data={detail.transaccion?.beneficiario} />
    <SectionDescriptions title="Operación" data={detail.transaccion?.operacion} />
    <SectionDescriptions title="Control Y Seguimiento" data={detail.transaccion?.controlSeguimiento} />
    <SectionDescriptions title="Transferencia Internacional / SWIFT" data={detail.transaccion?.internacional} />
    <Typography.Title level={5}>Historial Transaccional</Typography.Title>
    <TransactionTable rows={detail.historialTransaccional} />
  </Space>
);

const ConclusionTab = ({ detail }: { detail: AlertaDetalle }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Descriptions bordered column={2} size="small" items={objectItems(detail.resolucion as unknown as Record<string, unknown>)} />
    <Descriptions bordered column={2} size="small" items={objectItems(detail.aprobacion as unknown as Record<string, unknown>)} />
    <Alert type="info" showIcon message="Si se confirma fraude o lavado, se conserva evidencia soporte, se prepara ROS/reporte, se decide bloqueo o liberación de fondos y se escala legalmente cuando corresponda." />
  </Space>
);

const HallazgosList = ({ hallazgos }: { hallazgos: HallazgoAlerta[] }) => (
  <Table
    rowKey={(_, index) => String(index)}
    size="small"
    pagination={false}
    dataSource={hallazgos}
    columns={[
      { title: 'Tipo', dataIndex: 'tipo', render: labelFor },
      { title: 'Hallazgo', dataIndex: 'titulo' },
      { title: 'Severidad', dataIndex: 'severidad', render: (value) => <Tag color={severityTagColor(value)}>{labelFor(value)}</Tag> },
      { title: 'Score', dataIndex: 'score' },
      { title: 'Fuente', dataIndex: 'fuente' },
    ]}
  />
);

const ruleColumns = (): ColumnsType<ReglaAlerta> => [
  { title: 'Código', dataIndex: 'codigo' },
  { title: 'Nombre', dataIndex: 'nombre' },
  { title: 'Severidad', dataIndex: 'severidad', render: (value) => <Tag color={severityTagColor(value)}>{labelFor(value)}</Tag> },
  { title: 'Score', dataIndex: 'scoreBase' },
  { title: '', render: (_, rule) => <Button icon={<EyeOutlined />} onClick={() => Modal.info({ title: rule.nombre, width: 760, content: <Descriptions bordered column={1} size="small" items={objectItems(rule as unknown as Record<string, unknown>)} /> })}>Ver Regla</Button> },
];

const EvidenceList = ({ evidencias, readonly, onEdit, onDelete }: { evidencias: EvidenciaAlerta[]; readonly?: boolean; onEdit?: (evidence: EvidenciaAlerta) => void; onDelete?: (evidence: EvidenciaAlerta) => void }) => (
  <Table
    rowKey={(row, index) => String(row.id ?? index)}
    size="small"
    dataSource={evidencias}
    pagination={{ pageSize: 5 }}
    columns={[
      { title: 'Nombre', dataIndex: 'nombre' },
      { title: 'Descripción', dataIndex: 'descripcion', ellipsis: true },
      { title: 'Tipo', dataIndex: 'tipo', render: labelFor },
      { title: 'Archivo', render: (_, item) => `${item.extension || '-'} · ${formatBytes(item.tamanoBytes)}` },
      { title: 'Estado', dataIndex: 'estado', render: (value) => <Tag>{labelFor(value)}</Tag> },
      { title: 'Cargado Por', dataIndex: 'cargadoPor' },
      { title: 'Fecha', dataIndex: 'fechaCarga', render: (value) => value ? formatDate(value) : '-' },
      ...(!readonly ? [{ title: '', align: 'right' as const, render: (_: unknown, item: EvidenciaAlerta) => <ActionDropdown items={[{ key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => onEdit?.(item) }, { key: 'delete', label: 'Eliminar', icon: <DeleteOutlined />, danger: true, onClick: () => onDelete?.(item) }]} /> }] : []),
    ]}
  />
);

const EvidenceForm = ({ form, editing, onSave }: { form: ReturnType<typeof Form.useForm<EvidenciaAlertaRequest>>[0]; editing: EvidenciaAlerta | null; onSave: () => void }) => (
  <Card title={editing ? 'Editar Evidencia' : 'Cargar Evidencia'} size="small">
    <Form form={form} layout="vertical" initialValues={defaultEvidence}>
      <Row gutter={12}>
        <Col xs={24} md={12}><Form.Item label="Nombre" name="nombre" rules={[{ required: true }]}><Input placeholder="Ej. Extracto bancario solicitado" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Tipo" name="tipo"><Select options={[{ value: 'DOCUMENTO_SOLICITADO', label: 'Documento Solicitado' }, { value: 'ARTICULO_ASOCIADO', label: 'Artículo Asociado' }, { value: 'COMUNICACION', label: 'Comunicación' }, { value: 'VINCULO_DELITO_PRECEDENTE', label: 'Vínculo Con Delito Precedente' }, { value: 'OTRO', label: 'Otro' }]} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="Extensión" name="extension"><Select options={['PDF', 'JPG', 'JPEG', 'PNG', 'CSV', 'XLSX', 'DOCX', 'TXT'].map((value) => ({ value, label: value }))} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="Tamaño Bytes" name="tamanoBytes"><InputNumber min={0} max={10 * 1024 * 1024} style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="Estado" name="estado"><Select options={[{ value: 'CARGADA', label: 'Cargada' }, { value: 'VALIDADA', label: 'Validada' }, { value: 'RECHAZADA', label: 'Rechazada' }]} /></Form.Item></Col>
        <Col xs={24}><Form.Item label="Referencia Del Archivo" name="referenciaArchivo"><Input placeholder="Ruta, identificador o referencia documental" /></Form.Item></Col>
        <Col xs={24}><Form.Item label="Descripción" name="descripcion" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="Describe por qué esta evidencia soporta la investigación." /></Form.Item></Col>
      </Row>
      <Button type="primary" icon={<FileAddOutlined />} onClick={onSave}>{editing ? 'Guardar Evidencia' : 'Cargar Evidencia'}</Button>
    </Form>
  </Card>
);

const ReassignPanel = ({ analysts, currentAssignedId, target, reason, observation, onTarget, onReason, onObservation, onSubmit }: {
  analysts: AnalistaDisponible[];
  currentAssignedId?: number | null;
  target?: number;
  reason: string;
  observation: string;
  onTarget: (value?: number) => void;
  onReason: (value: string) => void;
  onObservation: (value: string) => void;
  onSubmit: () => void;
}) => (
  <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 680 }}>
    <Alert type="warning" showIcon message="La reasignación queda registrada en historial y auditoría." />
    <Select allowClear placeholder="Seleccione analista disponible" value={target} onChange={onTarget} style={{ width: '100%' }} options={analysts.filter((analyst) => analyst.disponible && analyst.usuarioId !== currentAssignedId).map((analyst) => ({ value: analyst.usuarioId, label: `${analyst.nombre} · ${analyst.estado} · ${analyst.alertasActivas} activas` }))} />
    <Input.TextArea value={reason} onChange={(event) => onReason(event.target.value)} rows={4} placeholder="Motivo de reasignación" />
    <Input.TextArea value={observation} onChange={(event) => onObservation(event.target.value)} rows={3} placeholder="Observación adicional" />
    <Button type="primary" disabled={!target || !reason.trim()} onClick={onSubmit}>Confirmar Reasignación</Button>
  </Space>
);

const TransactionTable = ({ rows }: { rows: TransaccionAlerta[] }) => (
  <Table rowKey="id" size="small" pagination={{ pageSize: 5 }} dataSource={rows} columns={[
    { title: 'Código', dataIndex: 'codigo' },
    { title: 'Monto', dataIndex: 'monto' },
    { title: 'Moneda', dataIndex: 'moneda' },
    { title: 'Canal', dataIndex: 'canal' },
    { title: 'Score', dataIndex: 'scoreRiesgo' },
    { title: 'Estado', dataIndex: 'estadoEvaluacion' },
    { title: 'Fecha', dataIndex: 'fechaTransaccion', render: (value) => value ? formatDate(value) : '-' },
  ]} />
);

const ResolverPage = (props: ResolverProps) => {
  const { detail } = props;
  if (!detail) {
    return <Card><Space direction="vertical" align="center" style={{ width: '100%' }}><WarningOutlined style={{ fontSize: 42, color: '#ba1a1a' }} /><Typography.Text type="danger">{props.error || 'No se encontró la alerta solicitada.'}</Typography.Text><Button onClick={props.onBack}>Volver A Alertas</Button></Space></Card>;
  }
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button type="link" icon={<ArrowLeftOutlined />} onClick={props.onBack} style={{ paddingInline: 0 }}>Volver A Alertas</Button>
      <ResolverHeader alert={detail.alerta} />
      {props.error && <Alert type="error" message={props.error} showIcon />}
      <Tabs items={detailTabs(detail, false)} />
      <EvidenceForm form={props.evidenceForm} editing={props.editingEvidence} onSave={props.onSaveEvidence} />
      <EvidenceList evidencias={detail.evidencias} onEdit={(evidence) => {
        props.setEditingEvidence(evidence);
        props.evidenceForm.setFieldsValue({
          nombre: evidence.nombre || '',
          descripcion: evidence.descripcion || '',
          tipo: evidence.tipo || 'DOCUMENTO_SOLICITADO',
          extension: evidence.extension || 'PDF',
          mimeType: evidence.mimeType || '',
          tamanoBytes: evidence.tamanoBytes || 0,
          referenciaArchivo: evidence.referenciaArchivo || '',
          estado: evidence.estado || 'CARGADA',
        });
      }} onDelete={props.onDeleteEvidence} />
      <Card title="Propuesta De Resolución Del Analista" extra={<Typography.Text type="secondary">Al guardar queda pendiente de aprobación.</Typography.Text>}>
        {props.canResolve ? <ResolutionForm form={props.resolutionForm} saving={props.saving} onSubmit={props.onSubmitResolution} /> : <Descriptions bordered column={2} size="small" items={objectItems(detail.resolucion as unknown as Record<string, unknown>)} />}
      </Card>
      {props.canApprove && <SupervisorApproval form={props.approvalForm} onApprove={props.onApprove} onReject={props.onReject} />}
      {props.children}
    </Space>
  );
};

interface ResolverProps {
  detail: AlertaDetalle | null;
  error: string | null;
  canResolve: boolean;
  canApprove: boolean;
  saving: boolean;
  resolutionForm: ReturnType<typeof Form.useForm<ResolucionAlertaRequest>>[0];
  approvalForm: ReturnType<typeof Form.useForm>[0];
  evidenceForm: ReturnType<typeof Form.useForm<EvidenciaAlertaRequest>>[0];
  editingEvidence: EvidenciaAlerta | null;
  setEditingEvidence: (evidence: EvidenciaAlerta | null) => void;
  onBack: () => void;
  onSubmitResolution: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSaveEvidence: () => void;
  onDeleteEvidence: (evidence: EvidenciaAlerta) => void;
  children: React.ReactNode;
}

const ResolutionForm = ({ form, saving, onSubmit }: { form: ReturnType<typeof Form.useForm<ResolucionAlertaRequest>>[0]; saving: boolean; onSubmit: () => void }) => (
  <Form form={form} layout="vertical" initialValues={initialResolution}>
    <Row gutter={12}>
      <Col xs={24} md={12}><Form.Item label="Resultado" name="resultado" rules={[{ required: true }]}><Select options={[{ value: 'FRAUDE_CONFIRMADO', label: 'Fraude Confirmado' }, { value: 'FALSO_POSITIVO', label: 'Falso Positivo' }, { value: 'OPERACION_JUSTIFICADA', label: 'Operación Justificada' }, { value: 'ESCALAR', label: 'Escalar A Supervisor' }, { value: 'ROS_REQUERIDO', label: 'ROS Requerido' }]} /></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item label="Monto Retenido Aproximado" name="montoReferencia"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
    </Row>
    {[
      ['conclusion', 'Conclusión', 'Resume los hallazgos principales del análisis.'],
      ['decision', 'Decisión Operativa', 'Indica si se bloquea, libera, escala o reporta la operación.'],
      ['justificacion', 'Justificación', 'Explica por qué el resultado es consistente con la evidencia.'],
      ['evidenciaDescripcion', 'Descripción De Evidencia', 'Lista documentos, capturas, consultas o referencias internas.'],
      ['contactoCliente', 'Contacto Con Cliente', 'Registra validaciones, respuestas o intentos de contacto.'],
    ].map(([name, label, placeholder]) => <Form.Item key={name} label={label} name={name} rules={name === 'conclusion' ? [{ required: true, message: 'La conclusión es requerida' }] : undefined}><Input.TextArea rows={3} placeholder={placeholder} /></Form.Item>)}
    <Space wrap>
      <Form.Item name="fondosRetenidos" valuePropName="checked"><Checkbox>Fondos Retenidos</Checkbox></Form.Item>
      <Form.Item name="movimientoLiberable" valuePropName="checked"><Checkbox>Movimiento Liberable</Checkbox></Form.Item>
      <Form.Item name="requiereRos" valuePropName="checked"><Checkbox>Requiere ROS</Checkbox></Form.Item>
      <Form.Item name="requiereBloqueo" valuePropName="checked"><Checkbox>Requiere Bloqueo</Checkbox></Form.Item>
      <Form.Item name="requiereEscalamientoLegal" valuePropName="checked"><Checkbox>Requiere Escalamiento Legal</Checkbox></Form.Item>
    </Space>
    <Space style={{ width: '100%', justifyContent: 'flex-end' }}><Button type="primary" loading={saving} onClick={onSubmit}>Enviar A Aprobación</Button></Space>
  </Form>
);

const SupervisorApproval = ({ form, onApprove, onReject }: { form: ReturnType<typeof Form.useForm>[0]; onApprove: () => void; onReject: () => void }) => (
  <Card title={<Space><CheckCircleOutlined />Aprobación Del Supervisor</Space>}>
    <Form form={form} layout="vertical">
      <Form.Item label="Observación De Aprobación" name="observacion"><Input.TextArea rows={3} placeholder="Comentario que acompañará la aprobación." /></Form.Item>
      <Form.Item label="Motivo De Rechazo" name="motivo"><Input.TextArea rows={3} placeholder="Motivo si la propuesta no está suficientemente documentada." /></Form.Item>
      <Form.Item label="Información Faltante" name="faltantes"><Input.TextArea rows={3} placeholder="Indica qué debe recabar el analista para reevaluar." /></Form.Item>
      <Space style={{ justifyContent: 'flex-end', width: '100%' }}><Button danger onClick={onReject}>Rechazar Y Reevaluar</Button><Button type="primary" onClick={onApprove}>Aprobar Y Cerrar</Button></Space>
    </Form>
  </Card>
);

const SectionDescriptions = ({ title, data }: { title: string; data?: Record<string, unknown> | null }) => (
  <Card size="small" title={title}><Descriptions bordered column={2} size="small" items={objectItems(data)} /></Card>
);

const ResolverHeader = ({ alert }: { alert: Alerta }) => (
  <Card size="small">
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Title level={2} style={{ margin: 0 }}>Resolución de Alerta {alert.codigo}</Typography.Title>
      <Space wrap>
        <Tag color={severityTagColor(alert.severidad || alert.prioridad)}>{labelFor(alert.severidad || alert.prioridad)}</Tag>
        <Tag color={alertStateTagColor(alert.estado)}>{labelFor(alert.estado)}</Tag>
        <Typography.Text type="secondary">Score {alert.score ?? '-'}</Typography.Text>
        <Typography.Text type="secondary">Analista: {alert.asignadoNombre || 'Sin asignar'}</Typography.Text>
      </Space>
    </Space>
  </Card>
);

const objectItems = (data?: Record<string, unknown> | null, omit: string[] = []) => Object.entries(data || {}).filter(([key, value]) => !omit.includes(key) && value !== null && value !== undefined).map(([key, value]) => ({ key, label: labelFor(key), children: text(value) }));
const text = (value: unknown) => typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value ?? '-');
const labelDictionary: Record<string, string> = {
  id: 'ID',
  codigo: 'Código',
  transaccionId: 'Transacción ID',
  reglaId: 'Regla ID',
  reglaNombre: 'Regla Nombre',
  escenarioId: 'Escenario ID',
  escenarioNombre: 'Escenario Nombre',
  clienteDocumento: 'Cliente Documento',
  clienteNombre: 'Cliente Nombre',
  paisOrigen: 'País Origen',
  paisDestino: 'País Destino',
  fechaTransaccion: 'Fecha Transacción',
  nivelRiesgo: 'Nivel de Riesgo',
  asignadoA: 'Asignado a',
  asignadoNombre: 'Asignado Nombre',
  fechaGeneracion: 'Fecha Generación',
  fechaResolucion: 'Fecha Resolución',
  scoreRiesgo: 'Score Riesgo',
  estadoEvaluacion: 'Estado Evaluación',
  tipoTransaccion: 'Tipo Transacción',
  fechaAprobacion: 'Fecha Aprobación',
  fechaSolicitud: 'Fecha Solicitud',
  observacion: 'Observación',
  descripcion: 'Descripción',
  condicion: 'Condición',
  condicionesJson: 'Condiciones JSON',
  accionesJson: 'Acciones JSON',
  scoreBase: 'Score Base',
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
  NUEVA: 'Nueva',
  ASIGNADA: 'Asignada',
  EN_REVISION: 'En Revisión',
  PENDIENTE_APROBACION: 'Pendiente de Aprobación',
  REEVALUACION: 'Reevaluación',
  CERRADA: 'Cerrada',
  TRANSACCION: 'Transacción',
  PAIS_DESTINO: 'País Destino',
  PAIS_RIESGO: 'País de Riesgo',
  LISTA_REGULATORIA: 'Lista Regulatoria',
  CONTROL_IMPORTE: 'Control de Importe',
  CONTROL_FRECUENCIA: 'Control de Frecuencia',
  HORARIO_RIESGO: 'Horario de Riesgo',
  MOTOR_REGLAS: 'Motor de Reglas',
  DOCUMENTO_SOLICITADO: 'Documento Solicitado',
  ARTICULO_ASOCIADO: 'Artículo Asociado',
  COMUNICACION: 'Comunicación',
  VINCULO_DELITO_PRECEDENTE: 'Vínculo con Delito Precedente',
  CARGADA: 'Cargada',
  VALIDADA: 'Validada',
  RECHAZADA: 'Rechazada',
  FRAUDE_CONFIRMADO: 'Fraude Confirmado',
  FALSO_POSITIVO: 'Falso Positivo',
  OPERACION_JUSTIFICADA: 'Operación Justificada',
  ESCALAR: 'Escalar',
  ROS_REQUERIDO: 'ROS Requerido',
};
const labelFor = (value?: string | null) => {
  const raw = String(value || '-');
  const spaced = raw
    .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
    .replace(/_/g, ' ');
  return labelDictionary[raw] || spaced.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
};
const normalizeOption = <T extends { value: string; label: string }>(option: T): T => ({ ...option, label: labelFor(option.value) });
const formatBytes = (value?: number | null) => !value ? '-' : value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;

export default Alerts;
