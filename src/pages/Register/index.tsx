import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Form, Input, Result, Space, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { authApi } from '../../api';
import { RecaptchaBox, RegulaIcon } from '../../components/common';
import { PasswordStrength } from '../Invitacion/PasswordStrength';

interface RegisterValues {
  email: string;
  nombre: string;
  password: string;
  confirmPassword: string;
  codigoInvitacion: string;
  aceptoTerminos: boolean;
  aceptoPrivacidad: boolean;
}

const Register = () => {
  const [done, setDone] = useState(false);
  const [form] = Form.useForm<RegisterValues>();
  const [passwordValue, setPasswordValue] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [camposValidos, setCamposValidos] = useState(false);

  const watchedEmail = Form.useWatch('email', form) || '';
  const watchedNombre = Form.useWatch('nombre', form) || '';
  const watchedValues = Form.useWatch([], form);

  // Habilita el boton solo cuando todos los campos obligatorios son validos
  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setCamposValidos(true))
      .catch(() => setCamposValidos(false));
  }, [form, watchedValues]);

  const onSubmit = async (values: RegisterValues) => {
    if (values.password !== values.confirmPassword) {
      message.error('Las contrasenas no coinciden');
      return;
    }
    if (!captchaToken) {
      message.error('Completa la verificacion de captcha');
      return;
    }
    try {
      await authApi.register({
        email: values.email,
        nombre: values.nombre,
        password: values.password,
        codigoInvitacion: values.codigoInvitacion,
        aceptoTerminos: values.aceptoTerminos,
        aceptoPrivacidad: values.aceptoPrivacidad,
        recaptchaToken: captchaToken,
      });
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
          <Form.Item label="Correo Electronico" name="email" rules={[{ required: true, message: 'Ingresa tu correo electronico' }, { type: 'email', message: 'Correo electronico invalido' }]}>
            <Input placeholder="correo@ejemplo.com" autoComplete="email" />
          </Form.Item>
          <Form.Item label="Nombre Completo" name="nombre" rules={[{ required: true, message: 'Ingresa tu nombre' }]}>
            <Input placeholder="Nombre y apellido" autoComplete="name" />
          </Form.Item>
          <Form.Item
            label="Contrasena"
            name="password"
            rules={[
              { required: true, message: 'Ingresa una contrasena' },
              { min: 12, message: 'Minimo 12 caracteres' },
              { max: 128, message: 'Maximo 128 caracteres' },
              { pattern: /[A-Z]/, message: 'Debe contener al menos una mayuscula' },
              { pattern: /[a-z]/, message: 'Debe contener al menos una minuscula' },
              { pattern: /\d/, message: 'Debe contener al menos un numero' },
              { pattern: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, message: 'Debe contener al menos un caracter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)' },
            ]}
          >
            <Input.Password
              placeholder="Minimo 12 caracteres"
              autoComplete="new-password"
              onChange={(e) => setPasswordValue(e.target.value)}
            />
          </Form.Item>
          <PasswordStrength password={passwordValue} userEmail={watchedEmail} userName={watchedNombre} />
          <Form.Item
            label="Confirmar Contrasena"
            name="confirmPassword"
            rules={[
              { required: true, message: 'Confirma tu contrasena' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contrasenas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Repite tu contrasena" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="aceptoTerminos"
            valuePropName="checked"
            rules={[
              { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Debes aceptar los Terminos y Condiciones')) },
            ]}
          >
            <Checkbox>
              He leido y acepto los <Link to="/documentos-legales" target="_blank">Terminos y Condiciones</Link>
            </Checkbox>
          </Form.Item>
          <Form.Item
            name="aceptoPrivacidad"
            valuePropName="checked"
            rules={[
              { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Debes aceptar la Politica de Privacidad')) },
            ]}
          >
            <Checkbox>
              He leido y acepto la <Link to="/documentos-legales/privacidad" target="_blank">Politica de Privacidad</Link>
            </Checkbox>
          </Form.Item>
          <RecaptchaBox onChange={setCaptchaToken} />
          <Button type="primary" htmlType="submit" block disabled={!camposValidos || !captchaToken}>
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
