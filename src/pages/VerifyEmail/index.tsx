import { useEffect, useState } from 'react';
import { Alert, Button, Card, Result, Space, Typography } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { RegulaIcon } from '../../components/common';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [detalle, setDetalle] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const codigo = searchParams.get('codigo');
      if (!codigo) {
        setEstado('error');
        setDetalle('Falta el codigo de verificacion en el enlace.');
        return;
      }
      try {
        const respuesta = await authApi.verifyEmail(codigo);
        setEstado('ok');
        setDetalle(respuesta.mensaje);
      } catch (error: unknown) {
        setEstado('error');
        setDetalle(error instanceof Error ? error.message : 'El enlace de verificacion no es valido.');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  return (
    <Card style={{ width: '100%', maxWidth: 440 }}>
      <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
        <RegulaIcon size={56} />
        {estado === 'cargando' && (
          <Alert type="info" showIcon message="Verificando tu email..." />
        )}
        {estado === 'ok' && (
          <Result
            status="success"
            title="Correo Electrónico Verificado"
            subTitle={detalle}
            extra={
              <Link to="/login">
                <Button type="primary">Ir Al Login</Button>
              </Link>
            }
          />
        )}
        {estado === 'error' && (
          <Result
            status="error"
            title="No Se Pudo Verificar"
            subTitle={detalle}
            extra={<Typography.Text type="secondary">Solicita un nuevo enlace en la recuperacion de cuenta.</Typography.Text>}
          />
        )}
      </Space>
    </Card>
  );
};

export default VerifyEmail;
