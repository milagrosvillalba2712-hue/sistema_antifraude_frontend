import { useEffect, useState } from 'react';
import { Alert, Card, Col, Empty, Progress, Row, Space, Tag, Typography } from 'antd';
import { licensingApi } from '../../api';

interface Props {
  empresaId?: string | null;
}

interface MetricUsada {
  clave: string;
  label: string;
  usado: number;
  limite: number | null;
}

const ConsumoVsPlan = ({ empresaId }: Props) => {
  const [uso, setUso] = useState<Record<string, unknown> | null>(null);
  const [limites, setLimites] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    let active = true;
    const cargar = async () => {
      setLoading(true);
      try {
        const [usoRows, limitesData] = await Promise.all([
          licensingApi.uso(empresaId),
          licensingApi.limites(empresaId).catch(() => null),
        ]);
        if (active) {
          setUso((usoRows[0] as Record<string, unknown>) ?? null);
          setLimites(limitesData);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    cargar().catch(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [empresaId]);

  if (!empresaId) {
    return <Alert type="info" showIcon message="La cuenta del usuario no esta asociada a una empresa." />;
  }

  const metricas: MetricUsada[] = [
    {
      clave: 'transacciones',
      label: 'Transacciones Procesadas',
      usado: Number(uso?.transaccionesProcesadas ?? 0),
      limite: Number(limites?.limiteTransaccionesMensuales ?? 0) || null,
    },
    {
      clave: 'kyc',
      label: 'Consultas KYC',
      usado: Number(uso?.consultasKyc ?? 0),
      limite: Number(limites?.limiteConsultasKycMensuales ?? 0) || null,
    },
    {
      clave: 'reportes',
      label: 'Reportes Generados',
      usado: Number(uso?.reportesGenerados ?? 0),
      limite: Number(limites?.limiteReportesMensuales ?? 0) || null,
    },
  ];

  const conLimite = metricas.filter((metrica) => metrica.limite !== null && metrica.limite > 0);
  const agotadas = conLimite.filter((metrica) => metrica.limite !== null && metrica.usado >= metrica.limite);
  const cercanas = conLimite.filter(
    (metrica) => !agotadas.includes(metrica) && metrica.limite !== null && metrica.usado / metrica.limite >= 0.8
  );

  return (
    <Card title="Consumo Del Mes Vs Plan" loading={loading}>
      {!uso && !loading ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin registros de consumo este mes" />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {limites ? (
            <div>
              <Typography.Text strong>Plan activo: </Typography.Text>
              <Tag color="blue">{String(limites.plan)}</Tag>
            </div>
          ) : null}

          {agotadas.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="Cupo Agotado"
              description={`Se alcanzo el limite mensual de: ${agotadas.map((m) => m.label).join(', ')}. La operacion queda bloqueada hasta renovar.`}
            />
          )}
          {agotadas.length === 0 && cercanas.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message="Cupo Cercano Al Limite"
              description={`${cercanas.map((m) => m.label).join(', ')} supero el 80% del cupo del plan.`}
            />
          )}

          <Row gutter={[24, 16]}>
            {metricas.map((metrica) => {
              const limite = metrica.limite;
              const percent = limite ? Math.min(100, Math.round((metrica.usado / limite) * 100)) : 0;
              const agotado = limite !== null && metrica.usado >= limite;
              const status = agotado ? 'exception' : 'active';
              return (
                <Col xs={24} md={12} xl={8} key={metrica.clave}>
                  <Typography.Text strong>{metrica.label}</Typography.Text>
                  <Progress
                    percent={percent}
                    status={status}
                    format={() => (limite === null ? `${metrica.usado} (sin limite)` : `${metrica.usado} / ${limite}`)}
                  />
                </Col>
              );
            })}
          </Row>
        </Space>
      )}
    </Card>
  );
};

export default ConsumoVsPlan;