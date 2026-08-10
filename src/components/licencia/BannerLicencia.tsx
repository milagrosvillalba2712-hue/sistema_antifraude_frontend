import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Space, Tag, Tooltip } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store';
import { licensingLocalApi } from '../../api';
import { INSTALACION_STORAGE_KEY, venceEnDias } from './constants';

interface Validacion {
  modo?: string;
  detalle?: string;
  venceEn?: string;
}

const etiquetaBanner = (modo?: string): { tipo: 'success' | 'warning' | 'error'; texto: string } => {
  switch (modo) {
    case 'OPERATIVO':
      return { tipo: 'success', texto: 'Licencia operativa' };
    case 'SOLO_LECTURA':
      return { tipo: 'warning', texto: 'Modo solo lectura' };
    case 'BLOQUEADO':
      return { tipo: 'error', texto: 'Licencia bloqueada' };
    default:
      return { tipo: 'error', texto: 'Licencia no emitida' };
  }
};

const BannerLicencia = () => {
  const { user } = useAuthStore();
  const [validacion, setValidacion] = useState<Validacion | null>(null);
  const [cargando, setCargando] = useState(false);

  const validar = useCallback(async () => {
    const instalacionId = localStorage.getItem(INSTALACION_STORAGE_KEY);
    if (!instalacionId) {
      setValidacion(null);
      return;
    }
    setCargando(true);
    try {
      const data = (await licensingLocalApi.validar(instalacionId, true)) as Validacion;
      setValidacion(data);
    } catch {
      setValidacion({ modo: 'NO_EMITIDA', detalle: 'No hay licencia emitida para esta instalacion.' });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const inicial = window.setTimeout(() => validar(), 0);
    const intervalo = window.setInterval(validar, 5 * 60 * 1000);
    const onStorage = () => validar();
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearTimeout(inicial);
      window.clearInterval(intervalo);
      window.removeEventListener('storage', onStorage);
    };
  }, [validar]);

  if (!user?.empresaId || !validacion) return null;

  const banner = etiquetaBanner(validacion.modo);
  const dias = venceEnDias(validacion.venceEn);
  const venceTexto = dias !== null ? `Vence en ${dias} dia(s)` : '';

  return (
    <Alert
      type={banner.tipo}
      showIcon
      closable
      icon={banner.tipo === 'success' ? <CheckCircleOutlined /> : <WarningOutlined />}
      message={
        <Space>
          <span>Licencia: {banner.texto}</span>
          {dias !== null && <Tag>{venceTexto}</Tag>}
          <Tooltip title="Volver a validar">
            <Button size="small" type="text" icon={<ReloadOutlined />} loading={cargando} onClick={validar} />
          </Tooltip>
        </Space>
      }
      description={String(validacion.detalle ?? '')}
      style={{ marginBottom: 16 }}
    />
  );
};

export default BannerLicencia;