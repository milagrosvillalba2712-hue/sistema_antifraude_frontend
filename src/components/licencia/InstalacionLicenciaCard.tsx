import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  CloudServerOutlined,
  KeyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { licensingLocalApi } from '../../api';
import { INSTALACION_STORAGE_KEY, fingerprintNavegador } from './constants';

interface Props {
  empresaId?: string | null;
  suscripcionActivaId?: number | null;
}

interface EstadoInstalacion {
  estadoInstalacion?: string;
  identificadorInstalacion?: string;
  clonDetectado?: boolean;
  activadaEn?: string;
  ultimoHeartbeatEn?: string;
  licencia?: Record<string, unknown>;
  controlPlane?: { habilitado?: boolean };
}

const tagEstado = (estado?: string): { color: string; texto: string } => {
  switch (estado) {
    case 'OPERATIVO':
      return { color: 'success', texto: 'Operativo' };
    case 'SOLO_LECTURA':
      return { color: 'warning', texto: 'Solo Lectura' };
    case 'BLOQUEADO':
      return { color: 'error', texto: 'Bloqueado' };
    default:
      return { color: 'default', texto: estado || 'Sin estado' };
  }
};

const InstalacionLicenciaCard = ({ empresaId, suscripcionActivaId }: Props) => {
  const [instalacionId, setInstalacionId] = useState<string | null>(() => localStorage.getItem(INSTALACION_STORAGE_KEY));
  const [estado, setEstado] = useState<EstadoInstalacion | null>(null);
  const [validacion, setValidacion] = useState<Record<string, unknown> | null>(null);
  const [eventos, setEventos] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [accion, setAccion] = useState<string | null>(null);

  const cargar = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [estadoData, eventosData] = await Promise.all([
        licensingLocalApi.estado(id),
        licensingLocalApi.eventos(id).catch(() => [] as Record<string, unknown>[]),
      ]);
      setEstado(estadoData as EstadoInstalacion);
      setEventos(eventosData);
      try {
        setValidacion(await licensingLocalApi.validar(id, true));
      } catch {
        setValidacion(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!instalacionId) return;
    const timer = window.setTimeout(() => {
      cargar(instalacionId).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [instalacionId, cargar]);

  const handleInstalar = async () => {
    if (!empresaId) {
      message.warning('La empresa del usuario no esta definida. Verifica tu cuenta.');
      return;
    }
    setAccion('instalar');
    try {
      const respuesta = await licensingLocalApi.instalar({
        empresaId,
        identidadMaquina: fingerprintNavegador(),
        versionProducto: '1.0.0',
      });
      const nuevoId = String(respuesta.instalacionId);
      localStorage.setItem(INSTALACION_STORAGE_KEY, nuevoId);
      setInstalacionId(nuevoId);
      message.success('Instalacion registrada. Activa la licencia para emitir el lease.');
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo registrar la instalacion');
    } finally {
      setAccion(null);
    }
  };

  const handleActivar = async () => {
    if (!instalacionId || !suscripcionActivaId) {
      message.warning('Necesitas una suscripcion vigente para activar la licencia.');
      return;
    }
    setAccion('activar');
    try {
      const respuesta = await licensingLocalApi.activar({ instalacionId, suscripcionId: suscripcionActivaId });
      message.success(`Licencia activada (${respuesta.planCodigo}) - vence ${respuesta.venceEn}`);
      await cargar(instalacionId);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo activar la licencia');
    } finally {
      setAccion(null);
    }
  };

  const handleHeartbeat = async () => {
    if (!instalacionId) return;
    setAccion('heartbeat');
    try {
      const respuesta = await licensingLocalApi.heartbeat({ instalacionId });
      message.success(`Validación periódica registrada: ${respuesta.ultimoHeartbeatEn}`);
      await cargar(instalacionId);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo registrar la validación periódica');
    } finally {
      setAccion(null);
    }
  };

  const modo = validacion?.modo ? tagEstado(String(validacion.modo)) : null;
  const licencia = estado?.licencia;

  return (
    <Card
      title="Licencia On-Premise"
      extra={
        instalacionId ? (
          <Button type="text" icon={<ReloadOutlined />} onClick={() => cargar(instalacionId)} disabled={loading} />
        ) : null
      }
    >
      <Spin spinning={loading}>
        {!instalacionId ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              icon={<CloudServerOutlined />}
              message="Instalación no registrada"
              description="Registra este equipo como instalación on-premise para emitir la licencia local. La identidad se calcula con la huella del navegador (demo)."
            />
            <Button type="primary" icon={<SafetyCertificateOutlined />} loading={accion === 'instalar'} onClick={handleInstalar}>
              Instalar En Este Equipo
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {modo && (
              <Alert
                type={modo.color === 'success' ? 'success' : modo.color === 'warning' ? 'warning' : 'error'}
                showIcon
                message={`Modo: ${modo.texto}`}
                description={String(validacion?.detalle ?? '')}
              />
            )}
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                { key: 'identificador', label: 'Identificador', children: estado?.identificadorInstalacion || '-' },
                { key: 'estado', label: 'Estado De Instalación', children: <Tag>{estado?.estadoInstalacion || '-'}</Tag> },
                { key: 'clon', label: 'Clon Detectado', children: estado?.clonDetectado ? 'Sí' : 'No' },
                { key: 'activada', label: 'Activada En', children: estado?.activadaEn || '-' },
                { key: 'heartbeat', label: 'Última Validación Periódica', children: estado?.ultimoHeartbeatEn || '-' },
                { key: 'controlPlane', label: 'Control Plane', children: estado?.controlPlane?.habilitado ? 'Habilitado' : 'Offline' },
                { key: 'plan', label: 'Plan', children: String(licencia?.planCodigo ?? '-') },
                { key: 'vence', label: 'Vence', children: String(licencia?.venceEn ?? '-') },
                { key: 'gracia', label: 'Días De Gracia', children: String(licencia?.diasGracia ?? '-') },
                { key: 'estadoLicencia', label: 'Estado De Licencia', children: <Tag>{String(licencia?.estado ?? 'NO EMITIDA')}</Tag> },
              ]}
            />
            <Space wrap>
              {!licencia && (
                <Button type="primary" icon={<KeyOutlined />} loading={accion === 'activar'} onClick={handleActivar}>
                  Activar Licencia
                </Button>
              )}
              <Button icon={<ThunderboltOutlined />} loading={accion === 'heartbeat'} onClick={handleHeartbeat}>
                Validación Periódica
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={accion === 'validar'}
                onClick={async () => {
                  if (!instalacionId) return;
                  setAccion('validar');
                  try {
                    setValidacion(await licensingLocalApi.validar(instalacionId, true));
                  } catch {
                    message.warning('No hay licencia emitida aún.');
                  } finally {
                    setAccion(null);
                  }
                }}
              >
                Validar
              </Button>
            </Space>
            <div>
              <Typography.Title level={5}>Ultimos Eventos</Typography.Title>
              {eventos.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin eventos registrados" />
              ) : (
                <Timeline
                  items={eventos.slice(0, 10).map((evento) => ({
                    color: evento.tipo === 'BLOQUEADA' || evento.tipo === 'ERROR' ? 'red' : 'blue',
                    children: (
                      <div>
                        <Typography.Text strong>{String(evento.tipo ?? 'EVENTO')}</Typography.Text>
                        <div>
                          <Typography.Text type="secondary">{String(evento.detalle ?? '')}</Typography.Text>
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {String(evento.fechaEvento ?? '')}
                        </Typography.Text>
                      </div>
                    ),
                  }))}
                />
              )}
            </div>
          </Space>
        )}
      </Spin>
    </Card>
  );
};

export default InstalacionLicenciaCard;
