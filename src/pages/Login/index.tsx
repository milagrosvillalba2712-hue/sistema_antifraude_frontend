import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { RegulaIcon } from '../../components/common';

interface LoginValues {
  email: string;
  password: string;
}

const Login = () => {
  const { signIn } = useAuth();
  const [form] = Form.useForm<LoginValues>();
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!lockedUntil) return;
    const update = () => {
      const diff = new Date(lockedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setLockedMessage(null);
        setLockedUntil(null);
        setCountdown('');
        return;
      }
      const min = Math.floor(diff / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown(`${min}m ${sec}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const onSubmit = async (values: LoginValues) => {
    setLockedMessage(null);
    setLockedUntil(null);
    const result = await signIn(values);

    if (!result.success) {
      if (result.codigo === 'ACCOUNT_LOCKED') {
        setLockedMessage(result.error!);
        if (result.detalles?.bloqueadoHasta) {
          setLockedUntil(result.detalles.bloqueadoHasta);
        }
        return;
      }

      let message = result.error!;
      if (result.codigo === 'BAD_PASSWORD' && result.detalles) {
        const remaining = (result.detalles.maxIntentos ?? 3) - (result.detalles.intentosFallidos ?? 0);
        if (remaining > 0) {
          message = `${result.error}. Le quedan ${remaining} intento(s).`;
        } else {
          message = result.error!;
        }
      }

      if (result.field) {
        form.setFields([{ name: result.field, errors: [message] }]);
      } else {
        form.setFields([{ name: 'password', errors: [message] }]);
      }
    }
  };

  return (
    <Card style={{ width: '100%', maxWidth: 440 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <RegulaIcon size={64} />
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>Regula</Typography.Title>
            <Typography.Text type="secondary">Accede a la plataforma antifraude</Typography.Text>
          </div>
        </Space>

        {lockedMessage && (
          <Alert
            type="error"
            showIcon
            message={lockedMessage}
            description={countdown ? `Tiempo restante: ${countdown}` : undefined}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          <Form.Item label="Correo Electrónico" name="email" rules={[{ required: true, message: 'Ingresa tu correo electrónico' }, { type: 'email', message: 'Correo electrónico inválido' }]}>
            <Input placeholder="correo@ejemplo.com" autoComplete="email" disabled={!!lockedUntil} />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
            <Input.Password placeholder="Contraseña" autoComplete="current-password" disabled={!!lockedUntil} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={form.isFieldsValidating()} disabled={!!lockedUntil}>
            Iniciar Sesión
          </Button>
        </Form>

        <Typography.Text style={{ textAlign: 'center', display: 'block' }}>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </Typography.Text>

        <Alert
          type="info"
          showIcon
          message="Credenciales de Prueba"
          description={
            <Space direction="vertical" size={2}>
              <Typography.Text>Administrador: administrador@santaclara.local</Typography.Text>
              <Typography.Text>Auditor: beatriz.morales@santaclara.local</Typography.Text>
              <Typography.Text>Contraseña: Regula2026!</Typography.Text>
            </Space>
          }
        />

        <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: 12 }}>
          <Link to="/documentos-legales">Términos y Condiciones</Link>
          <span> · </span>
          <Link to="/documentos-legales/privacidad">Política de Privacidad</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
};

export default Login;
