import { useState } from 'react';
import { Button, Card, Form, Input, Result, Space, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { authApi } from '../../api';
import { RegulaIcon } from '../../components/common';

const ForgotPassword = () => {
  const [done, setDone] = useState(false);
  const [form] = Form.useForm<{ email: string }>();

  const onSubmit = async (values: { email: string }) => {
    try {
      await authApi.forgotPassword(values.email);
      setDone(true);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo solicitar la recuperacion');
    }
  };

  if (done) {
    return (
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Result
          status="success"
          title="Solicitud Enviada"
          subTitle="Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña. En modo demo también se imprime en consola del Backend."
          extra={
            <Link to="/login">
              <Button type="primary">Volver Al Login</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card style={{ width: '100%', maxWidth: 440 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <RegulaIcon size={56} />
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>Recuperar Contraseña</Typography.Title>
            <Typography.Text type="secondary">Ingresa tu email para recibir el enlace</Typography.Text>
          </div>
        </Space>

        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          <Form.Item label="Correo Electrónico" name="email" rules={[{ required: true, message: 'Ingresa tu correo electrónico' }, { type: 'email', message: 'Correo electrónico inválido' }]}>
            <Input placeholder="correo@ejemplo.com" autoComplete="email" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Enviar Enlace
          </Button>
        </Form>

        <Typography.Text style={{ textAlign: 'center', display: 'block' }}>
          <Link to="/login">Volver al login</Link> · <Link to="/register">Registrarme</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
};

export default ForgotPassword;
