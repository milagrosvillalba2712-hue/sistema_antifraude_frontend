import { useState } from 'react';
import { Button, Card, Form, Input, Result, Space, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { authApi } from '../../api';
import { RegulaIcon } from '../../components/common';

interface RegisterValues {
  email: string;
  nombre: string;
  password: string;
  codigoInvitacion: string;
}

const Register = () => {
  const [done, setDone] = useState(false);
  const [form] = Form.useForm<RegisterValues>();

  const onSubmit = async (values: RegisterValues) => {
    try {
      await authApi.register(values);
      setDone(true);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo completar el registro');
    }
  };

  if (done) {
    return (
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Result
          status="success"
          title="Registro Recibido"
          subTitle="Te enviamos un enlace de verificacion. Revisa tu bandeja de entrada (o la consola del backend en modo demo) para activar tu cuenta."
          extra={
            <Link to="/login">
              <Button type="primary">Ir Al Login</Button>
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
            <Typography.Title level={2} style={{ marginBottom: 0 }}>Crear Cuenta</Typography.Title>
            <Typography.Text type="secondary">Registro regulado por invitacion del administrador</Typography.Text>
          </div>
        </Space>

        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          <Form.Item label="Codigo De Invitacion" name="codigoInvitacion" rules={[{ required: true, message: 'Ingresa tu codigo de invitacion' }]}>
            <Input placeholder="Codigo emitido por el administrador" autoComplete="off" />
          </Form.Item>
          <Form.Item label="Correo Electrónico" name="email" rules={[{ required: true, message: 'Ingresa tu correo electrónico' }, { type: 'email', message: 'Correo electrónico inválido' }]}>
            <Input placeholder="correo@ejemplo.com" autoComplete="email" />
          </Form.Item>
          <Form.Item label="Nombre Completo" name="nombre" rules={[{ required: true, message: 'Ingresa tu nombre' }]}>
            <Input placeholder="Nombre y apellido" autoComplete="name" />
          </Form.Item>
          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: 'Ingresa una contraseña' },
              { min: 10, message: 'Mínimo 10 caracteres' },
            ]}
          >
            <Input.Password placeholder="Mínimo 10 caracteres" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Registrarme
          </Button>
        </Form>

        <Typography.Text style={{ textAlign: 'center', display: 'block' }}>
          <Link to="/login">Ya tengo cuenta, iniciar sesion</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
};

export default Register;
