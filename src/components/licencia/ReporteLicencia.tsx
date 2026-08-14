import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Descriptions, Empty, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { licensingApi, licensingLocalApi } from '../../api';
import { useAuthStore } from '../../store';
import { INSTALACION_STORAGE_KEY, venceEnDias } from './constants';

interface FilaReporte {
  id: string;
  dato: string;
  valor: string;
}

const etiquetaModo = (modo?: string): { tag: 'success' | 'warning' | 'error' | 'default'; texto: string } => {
  switch (modo) {
    case 'OPERATIVO':
      return { tag: 'success', texto: 'OPERATIVO' };
    case 'SOLO_LECTURA':
      return { tag: 'warning', texto: 'SOLO LECTURA' };
    case 'BLOQUEADO':
      return { tag: 'error', texto: 'BLOQUEADO' };
    default:
      return { tag: 'default', texto: 'NO EMITIDA' };
  }
};

const ReporteLicencia = () => {
  const { user } = useAuthStore();
  const [instalacionId, setInstalacionId] = useState<string | null>(() => localStorage.getItem(INSTALACION_STORAGE_KEY));
  const [estado, setEstado] = useState<Record<string, unknown> | null>(null);
  const [validacion, setValidacion] = useState<Record<string, unknown> | null>(null);
  const [eventos, setEventos] = useState<Record<string, unknown>[]>([]);
  const [uso, setUso] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const sincronizaLocal = () => setInstalacionId(localStorage.getItem(INSTALACION_STORAGE_KEY));

  useEffect(() => {
    window.addEventListener('storage', sincronizaLocal);
    return () => window.removeEventListener('storage', sincronizaLocal);
  }, []);

  const cargar = useCallback(
    async (id: string | null) => {
      if (!id) {
        setEstado(null);
        setValidacion(null);
        setEventos([]);
        setUso(null);
        return;
      }
      setLoading(true);
      try {
        const empresaId = user?.empresaId;
        const [estadoData, eventosData, usoData] = await Promise.all([
          licensingLocalApi.estado(id),
          licensingLocalApi.eventos(id).catch(() => [] as Record<string, unknown>[]),
          empresaId ? licensingApi.uso(empresaId) : Promise.resolve([] as Record<string, unknown>[]),
        ]);
        setEstado(estadoData);
        setEventos(eventosData);
        setUso((usoData[0] as Record<string, unknown>) ?? null);
        try {
          setValidacion(await licensingLocalApi.validar(id, true));
        } catch {
          setValidacion(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.empresaId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      cargar(instalacionId).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instalacionId, cargar]);

  const licencia = useMemo(
    () => (estado?.licencia ?? {}) as Record<string, unknown>,
    [estado]
  );
  const modo = validacion?.modo ? etiquetaModo(String(validacion.modo)) : etiquetaModo();
  const dias = venceEnDias(validacion?.venceEn ? String(validacion.venceEn) : undefined);

  const columnasReporte: ColumnsType<FilaReporte> = [
    { title: 'Dato', dataIndex: 'dato', key: 'dato', width: 240 },
    { title: 'Valor', dataIndex: 'valor', key: 'valor' },
  ];

  const filas = useMemo<FilaReporte[]>(() => {
    if (!instalacionId) return [];
    return [
      { id: 'identificador', dato: 'Identificador De Instalación', valor: String(estado?.identificadorInstalacion ?? '-') },
      { id: 'estado', dato: 'Estado', valor: String(estado?.estadoInstalacion ?? '-') },
      { id: 'modo', dato: 'Modo De Operación', valor: modo.texto },
      { id: 'plan', dato: 'Plan', valor: String(licencia.planCodigo ?? '-') },
      { id: 'estado-licencia', dato: 'Estado De La Licencia', valor: String(licencia.estado ?? 'NO EMITIDA') },
      { id: 'activada', dato: 'Activada En', valor: String(estado?.activadaEn ?? '-') },
      { id: 'vence', dato: 'Vence', valor: `${String(licencia.venceEn ?? '-')}${dias !== null ? ` (${dias} día(s))` : ''}` },
      { id: 'heartbeat', dato: 'Última Validación Periódica', valor: String(estado?.ultimoHeartbeatEn ?? '-') },
      { id: 'eventos', dato: 'Eventos Registrados', valor: String(eventos.length) },
      { id: 'transacciones', dato: 'Transacciones Del Mes', valor: String(uso?.transaccionesProcesadas ?? 0) },
      { id: 'kyc', dato: 'Consultas KYC Del Mes', valor: String(uso?.consultasKyc ?? 0) },
      { id: 'reportes', dato: 'Reportes Generados Del Mes', valor: String(uso?.reportesGenerados ?? 0) },
    ];
  }, [instalacionId, estado, licencia, modo, dias, eventos.length, uso]);

  const exportarCsv = () => {
    const encabezado = 'Dato,Valor';
    const cuerpo = filas.map((fila) => `${fila.dato},"${fila.valor.replaceAll('"', '""')}"`).join('\n');
    const blob = new Blob([`${encabezado}\n${cuerpo}`], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Licencia_${instalacionId?.slice(0, 8) ?? 'sin_instalacion'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    message.success('Reporte CSV exportado');
  };

  if (!instalacionId) {
    return (
      <Empty
        description="Registra primero una instalación on-premise desde Administrador Empresa > Licencia On-Premise."
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Reporte De Licencia
        </Typography.Title>
        <Tag color={modo.tag}>{modo.texto}</Tag>
      </Space>
      <Space>
        <Button type="primary" icon={<DownloadOutlined />} onClick={exportarCsv}>
          Exportar CSV
        </Button>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => cargar(instalacionId)}>
          Actualizar
        </Button>
      </Space>
      <Descriptions
        bordered
        size="small"
        column={1}
        items={[
          { key: 'identificador', label: 'Identificador De Instalación', children: String(estado?.identificadorInstalacion ?? '-') },
          { key: 'estado', label: 'Estado', children: String(estado?.estadoInstalacion ?? '-') },
          { key: 'modo', label: 'Modo De Operación', children: <Tag color={modo.tag}>{modo.texto}</Tag> },
          { key: 'plan', label: 'Plan', children: String(licencia.planCodigo ?? '-') },
          { key: 'vence', label: `Vence${dias !== null ? ` (${dias} día(s))` : ''}`, children: String(licencia.venceEn ?? '-') },
          { key: 'detalle', label: 'Detalle De Validación', children: String(validacion?.detalle ?? '-') },
        ]}
      />
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columnasReporte}
        dataSource={filas}
        pagination={false}
        title={() => <Typography.Text strong>Indicadores Consolidados</Typography.Text>}
      />
    </Space>
  );
};

export default ReporteLicencia;
