import { useEffect, useState } from 'react';
import { Button, Form, Input, Typography, message } from 'antd';
import { authApi } from '../../api';
import { RecaptchaBox } from '../../components/common';
import { PasswordStrength } from './PasswordStrength';

interface RegistroFormProps {
  codigo: string;
  emailSugerido?: string;
  aceptoTerminos: boolean;
  aceptoPrivacidad: boolean;
  onExito: () => void;
}

export const RegistroForm = ({ codigo, emailSugerido, aceptoTerminos, aceptoPrivacidad, onExito }: RegistroFormProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [camposValidos, setCamposValidos] = useState(false);

  const watchedEmail = Form.useWatch('email', form) || emailSugerido || '';
  const watchedNombre = Form.useWatch('nombre', form) || '';
  const watchedValues = Form.useWatch([], form);

  // Habilita el boton solo cuando todos los campos obligatorios son validos
  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setCamposValidos(true))
      .catch(() => setCamposValidos(false));
  }, [form, watchedValues]);

  const onSubmit = async (values: {
    email: string;
    nombre: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('Las contrasenas no coinciden');
      return;
    }
    if (!captchaToken) {
      message.error('Completa la verificacion de captcha');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register({
        email: values.email,
        nombre: values.nombre,
        password: values.password,
        codigoInvitacion: codigo,
        aceptoTerminos,
        aceptoPrivacidad,
        recaptchaToken: captchaToken,
      });
      onExito();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo completar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false} initialValues={{ email: emailSugerido }}>
      <Form.Item
        label="Codigo De Invitacion"
        rules={[{ required: true, message: 'Ingresa tu codigo de invitacion' }]}
      >
        <Input value={codigo} disabled />
      </Form.Item>

      <Form.Item
        label="Correo Electronico"
        name="email"
        rules={[
          { required: true, message: 'Ingresa tu correo electronico' },
          { type: 'email', message: 'Correo electronico invalido' },
        ]}
      >
        <Input placeholder="correo@ejemplo.com" autoComplete="email" disabled={Boolean(emailSugerido)} />
      </Form.Item>

      <Form.Item
        label="Nombre Completo"
        name="nombre"
        rules={[{ required: true, message: 'Ingresa tu nombre' }]}
      >
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
        style={{ marginTop: 16 }}
      >
        <Input.Password placeholder="Repite tu contrasena" autoComplete="new-password" />
      </Form.Item>

      <RecaptchaBox onChange={setCaptchaToken} />

      <Button type="primary" htmlType="submit" block loading={submitting} disabled={!camposValidos || !captchaToken}>
        Registrarme
      </Button>

      <Typography.Text style={{ textAlign: 'center', display: 'block', marginTop: 16 }}>
        <a href="/login">Ya tengo cuenta, iniciar sesion</a>
      </Typography.Text>
    </Form>
  );
};
