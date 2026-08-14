import { useState } from 'react';
import { Button, Card, Form, Input, Result, Space, Typography, message } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api';
import { RegulaIcon } from '../../components/common';

interface ResetValues {
  password: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const [form] = Form.useForm<ResetValues>();

  const onSubmit = async (values: ResetValues) => {
    const codigo = searchParams.get('codigo');
    if (!codigo) {
      message.error('Falta el codigo de recuperacion en el enlace.');
      return;
    }
    try {
      await authApi.resetPassword(codigo, values.password);
      setDone(true);
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo restablecer la contraseña');
    }
  };

  if (done) {
    return (
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Result
          status="success"
          title="Contraseña Restablecida"
          subTitle="Ya puedes iniciar sesión con tu nueva contraseña."
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
            <Typography.Title level={2} style={{ marginBottom: 0 }}>Nueva Contraseña</Typography.Title>
            <Typography.Text type="secondary">Define una nueva contraseña para tu cuenta</Typography.Text>
          </div>
        </Space>

        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          <Form.Item
            label="Nueva Contraseña"
            name="password"
            rules={[
              { required: true, message: 'Ingresa una contraseña' },
              { min: 10, message: 'Mínimo 10 caracteres' },
            ]}
            dependencies={['confirmPassword']}
          >
            <Input.Password placeholder="Mínimo 10 caracteres" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirmar Contraseña"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Confirma tu contraseña' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('password') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Las contraseñas no coinciden')),
              }),
            ]}
          >
            <Input.Password placeholder="Repite la contraseña" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Restablecer Contraseña
          </Button>
        </Form>

        <Typography.Text style={{ textAlign: 'center', display: 'block' }}>
          <Link to="/login">Volver al login</Link>
        </Typography.Text>
      </Space>
    </Card>
  );
};

export default ResetPassword;
