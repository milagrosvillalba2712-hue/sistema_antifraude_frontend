import { useState } from 'react';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Input, InputNumber, List, Select, Space, Switch, Tag, TimePicker, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { adminEmpresaApi } from '../../api';
import type { EstadoJobLocal, JobLocal, JobLocalDetalle, JobLocalUpdateRequest, UnidadFrecuenciaJob } from '../../types';

interface JobsConfiguratorProps {
  loading: boolean;
  jobs: JobLocal[];
  jobsHabilitados: boolean;
  onReload: () => Promise<void>;
}

interface JobDraft {
  estado: EstadoJobLocal;
  frecuenciaValor: number;
  frecuenciaUnidad: UnidadFrecuenciaJob | 'CRON';
  hora: string;
  cron: string;
}

const UNIDADES: Array<{ value: UnidadFrecuenciaJob | 'CRON'; label: string }> = [
  { value: 'MINUTOS', label: 'Minutos' },
  { value: 'HORAS', label: 'Horas' },
  { value: 'DIAS', label: 'Dias' },
  { value: 'CRON', label: 'Expresion Cron' },
];

const resultadoColor = (resultado?: string | null) => {
  const valor = String(resultado ?? '').toUpperCase();
  if (valor.includes('OK') || valor.includes('EXITO') || valor.includes('SIN_CAMBIOS')) return 'green';
  if (valor.includes('ERROR') || valor.includes('FALLO') || valor.includes('BLOQU')) return 'red';
  if (valor.includes('PENDIENTE')) return 'orange';
  return 'default';
};

const buildDraft = (job: JobLocal): JobDraft => {
  const detalle = job.detalle ?? {};
  const cron = stringValue(detalle.cron);
  return {
    estado: job.estado,
    frecuenciaValor: numberValue(detalle.frecuenciaValor, 1),
    frecuenciaUnidad: cron ? 'CRON' : stringValue(detalle.frecuenciaUnidad) as UnidadFrecuenciaJob | 'CRON' ?? 'HORAS',
    hora: stringValue(detalle.hora) ?? '00:00',
    cron: cron ?? '',
  };
};

const frecuenciaDirty = (detalle: JobLocalDetalle, draft: JobDraft): boolean => {
  const cronActual = stringValue(detalle.cron);
  if (draft.frecuenciaUnidad === 'CRON') {
    return (cronActual ?? '') !== draft.cron.trim();
  }
  if (cronActual) return true;
  if (numberValue(detalle.frecuenciaValor, 1) !== draft.frecuenciaValor) return true;
  if ((stringValue(detalle.frecuenciaUnidad) ?? 'HORAS') !== draft.frecuenciaUnidad) return true;
  if (draft.frecuenciaUnidad === 'DIAS' && (stringValue(detalle.hora) ?? '00:00') !== draft.hora) return true;
  return false;
};

const buildFrecuencia = (draft: JobDraft): { valor: number; unidad: UnidadFrecuenciaJob; hora?: string | null; cron?: string | null } => {
  if (draft.frecuenciaUnidad === 'CRON') {
    return { valor: 1, unidad: 'HORAS', hora: null, cron: draft.cron.trim() };
  }
  return {
    valor: draft.frecuenciaValor,
    unidad: draft.frecuenciaUnidad,
    hora: draft.frecuenciaUnidad === 'DIAS' ? draft.hora : null,
    cron: null,
  };
};

const JobEditor = ({ job, onReload }: { job: JobLocal; onReload: () => Promise<void> }) => {
  const [draft, setDraft] = useState<JobDraft>(() => buildDraft(job));
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const editable = Boolean(job.editable);
  const detalle = job.detalle ?? {};
  const dirty = editable && (draft.estado !== job.estado || frecuenciaDirty(detalle, draft));

  const setUnidad = (unidad: UnidadFrecuenciaJob | 'CRON') => {
    setDraft((prev) => ({ ...prev, frecuenciaUnidad: unidad }));
  };

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const body: JobLocalUpdateRequest = {};
      if (draft.estado !== job.estado) body.estado = draft.estado;
      if (frecuenciaDirty(detalle, draft)) body.frecuencia = buildFrecuencia(draft);
      await adminEmpresaApi.configuracionJobsUpdate(job.codigo, body);
      message.success(`Job ${job.codigo} actualizado`);
      await onReload();
    } catch (error) {
      console.error('[JobsConfigurator] No se pudo actualizar el job', error);
      message.error('No se pudo actualizar el job');
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const resultado = await adminEmpresaApi.configuracionJobsRun(job.codigo);
      message.success(`Ejecucion completada: ${stringValue(resultado.resultado) ?? 'OK'}`);
      await onReload();
    } catch (error) {
      console.error('[JobsConfigurator] No se pudo ejecutar el job', error);
      message.error('No se pudo ejecutar el job');
    } finally {
      setRunning(false);
    }
  };

  return (
    <List.Item>
      <div style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Typography.Text strong>{job.nombre}</Typography.Text>
            <Tag>{job.codigo}</Tag>
            {!editable && <Tag color="default">Sistema</Tag>}
          </Space>
          <Space wrap>
            <Typography.Text type="secondary">Estado</Typography.Text>
            <Switch
              checked={draft.estado === 'ACTIVO'}
              disabled={!editable}
              checkedChildren="ACTIVO"
              unCheckedChildren="INACTIVO"
              onChange={(checked) => setDraft((prev) => ({ ...prev, estado: checked ? 'ACTIVO' : 'INACTIVO' }))}
            />
          </Space>
        </Space>

        {job.descripcion && <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 8 }}>{job.descripcion}</Typography.Paragraph>}

        <Space wrap align="center" style={{ marginBottom: 8 }}>
          <Typography.Text>Frecuencia</Typography.Text>
          <Select
            size="small"
            style={{ width: 150 }}
            value={draft.frecuenciaUnidad}
            disabled={!editable}
            options={UNIDADES}
            onChange={setUnidad}
          />
          {draft.frecuenciaUnidad === 'CRON' ? (
            <Input
              size="small"
              style={{ width: 260 }}
              placeholder="0 */6 * * *"
              value={draft.cron}
              disabled={!editable}
              onChange={(event) => setDraft((prev) => ({ ...prev, cron: event.target.value }))}
            />
          ) : (
            <>
              <InputNumber
                size="small"
                min={1}
                value={draft.frecuenciaValor}
                disabled={!editable}
                onChange={(value) => setDraft((prev) => ({ ...prev, frecuenciaValor: numberValue(value, 1) }))}
              />
              <Typography.Text type="secondary">{unidadLabel(draft.frecuenciaUnidad)}</Typography.Text>
              {draft.frecuenciaUnidad === 'DIAS' && (
                <TimePicker
                  size="small"
                  format="HH:mm"
                  minuteStep={5}
                  value={dayjs(draft.hora, 'HH:mm')}
                  disabled={!editable}
                  onChange={(value) => setDraft((prev) => ({ ...prev, hora: value ? value.format('HH:mm') : '00:00' }))}
                />
              )}
            </>
          )}
        </Space>

        <Descriptions
          size="small"
          column={{ xs: 1, sm: 3 }}
          style={{ marginBottom: 8 }}
          items={[
            { key: 'proxima', label: 'Proxima Ejecucion', children: formatFecha(detalle.proximaEjecucion) },
            { key: 'ultima', label: 'Ultima Ejecucion', children: formatFecha(detalle.ultimaEjecucion) },
            {
              key: 'resultado',
              label: 'Ultimo Resultado',
              children: <Tag color={resultadoColor(detalle.ultimoResultado)}>{stringValue(detalle.ultimoResultado) ?? 'Sin ejecutar'}</Tag>,
            },
          ]}
        />
        {stringValue(detalle.ultimoDetalle) && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 12 }}>
            {stringValue(detalle.ultimoDetalle)}
          </Typography.Paragraph>
        )}

        <Space wrap>
          <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} disabled={!dirty || !editable} onClick={save}>
            Guardar
          </Button>
          <Button size="small" icon={<PlayCircleOutlined />} loading={running} onClick={runNow}>
            Ejecutar Ahora
          </Button>
        </Space>
      </div>
    </List.Item>
  );
};

const JobsConfigurator = ({ loading, jobs, jobsHabilitados, onReload }: JobsConfiguratorProps) => (
  <Space direction="vertical" style={{ width: '100%' }} size="middle">
    {!jobsHabilitados && (
      <Alert
        type="warning"
        showIcon
        message="Tareas Automaticas Deshabilitadas"
        description="El switch global app.licenses.jobs.enabled esta desactivado (LICENSES_JOBS_ENABLED=false). Los jobs no se ejecutan automaticamente; solo corren con 'Ejecutar Ahora'."
      />
    )}
    <Card
      title="Jobs Locales (Agente On-Premise)"
      loading={loading}
      extra={<Tag icon={<ThunderboltOutlined />} color="blue">Ciclo De Licenciamiento</Tag>}
    >
      <Alert
        type="info"
        showIcon
        icon={<ClockCircleOutlined />}
        style={{ marginBottom: 12 }}
        message="Ejecucion Automatica"
        description="Cada minuto el coordinador local revisa los jobs ACTIVO cuyo momento de ejecucion ya vencio. Cambiar la frecuencia deja el job listo para ejecutarse en el proximo ciclo. Con 'Ejecutar Ahora' se fuerza la ejecucion puntual para pruebas o recuperacion."
      />
      <List
        dataSource={jobs}
        loading={loading}
        split
        renderItem={(job) => <JobEditor job={job} onReload={onReload} />}
        locale={{ emptyText: 'No hay jobs configurados' }}
      />
    </Card>
  </Space>
);

const unidadLabel = (unidad: UnidadFrecuenciaJob | 'CRON') => {
  if (unidad === 'MINUTOS') return 'Minuto(s)';
  if (unidad === 'DIAS') return 'Dia(s) a las';
  if (unidad === 'CRON') return 'Expresion Cron';
  return 'Hora(s)';
};

const formatFecha = (value?: string | null): string => {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : String(value);
};

const stringValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
};

const numberValue = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default JobsConfigurator;