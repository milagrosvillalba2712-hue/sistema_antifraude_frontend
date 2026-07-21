import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useAuth } from '../../hooks';
import { RegulaIcon } from '../../components/common';

interface LoginValues {
  email: string;
  password: string;
}

const Login = () => {
  const { signIn } = useAuth();
  const [form] = Form.useForm<LoginValues>();

  const onSubmit = async (values: LoginValues) => {
    const result = await signIn(values);
    if (!result.success) {
      form.setFields([{ name: 'password', errors: [result.error || 'Error al iniciar sesion'] }]);
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

        <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Ingresa tu email' }, { type: 'email', message: 'Email invalido' }]}>
            <Input placeholder="correo@ejemplo.com" autoComplete="email" />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
            <Input.Password placeholder="Contraseña" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={form.isFieldsValidating()}>
            Iniciar Sesión
          </Button>
        </Form>

        <Alert
          type="info"
          showIcon
          message="Credenciales de Prueba"
          description={
            <Space direction="vertical" size={2}>
              <Typography.Text>Admin General: admin.general1@regula.com</Typography.Text>
              <Typography.Text>Admin Empresa: admin.empresa1@demo.com</Typography.Text>
              <Typography.Text>Analista: analista1@demo.com</Typography.Text>
              <Typography.Text>Contraseña: password</Typography.Text>
            </Space>
          }
        />
      </Space>
    </Card>
  );
};

export default Login;
