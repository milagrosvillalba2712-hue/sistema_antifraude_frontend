import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Checkbox, Collapse, Result, Space, Spin, Steps, Typography } from 'antd';
import { CheckCircleFilled, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { authApi } from '../../api';
import { RegistroForm } from './RegistroForm';
import api from '../../api/axios';

interface InvitacionInfo {
  valido: boolean;
  email?: string;
  rol?: string;
  empresa?: string;
  mensaje?: string;
}

interface DocumentoLegalPublico {
  id: number;
  tipo: 'TERMINOS' | 'POLITICA_PRIVACIDAD';
  version: number;
  titulo: string;
  contenido: string;
}

type StepKey = 'validar' | 'terminos' | 'registro';

const TIPO_LABELS: Record<string, string> = {
  TERMINOS: 'Terminos y Condiciones',
  POLITICA_PRIVACIDAD: 'Politica de Privacidad',
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  TERMINOS: <FileTextOutlined />,
  POLITICA_PRIVACIDAD: <SafetyCertificateOutlined />,
};

const Invitacion = () => {
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get('codigo');

  const [step, setStep] = useState<StepKey>('validar');
  const [loading, setLoading] = useState(true);
  const [invitacion, setInvitacion] = useState<InvitacionInfo | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoLegalPublico[]>([]);
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [aceptoPrivacidad, setAceptoPrivacidad] = useState(false);
  const [registerDone, setRegisterDone] = useState(false);

  useEffect(() => {
    if (!codigo) {
      setLoading(false);
      return;
    }
    authApi.validarInvitacion(codigo)
      .then((res) => {
        setInvitacion(res);
        if (res.valido) {
          api.get<DocumentoLegalPublico[]>('/terminos-condiciones/publico')
            .then((docRes) => {
              const docs = Array.isArray(docRes.data) ? docRes.data : [];
              setDocumentos(docs);
              if (docs.length === 0) {
                setStep('registro');
              } else {
                setStep('terminos');
              }
            })
            .catch(() => {
              setStep('registro');
            });
        }
      })
      .catch(() => {
        setInvitacion({ valido: false, mensaje: 'No se pudo validar la invitacion. Verifica tu conexion.' });
      })
      .finally(() => setLoading(false));
  }, [codigo]);

  const handleTerminosAceptados = () => {
    setStep('registro');
  };

  const handleRegistroExito = () => {
    setRegisterDone(true);
  };

  if (!codigo) {
    return (
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Result
          status="warning"
          title="Codigo de invitacion requerido"
          subTitle="Debes acceder a esta pagina desde un enlace de invitacion valido."
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{ width: '100%', maxWidth: 480, minHeight: 300, display: 'grid', placeItems: 'center' }}>
        <Spin tip="Validando invitacion..." />
      </Card>
    );
  }

  if (registerDone) {
    return (
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Result
          status="success"
          title="Registro Completado"
          subTitle="Tu cuenta ha sido creada. Revisa tu bandeja de entrada (o la consola del backend en modo demo) para activar tu cuenta."
          extra={<Button type="primary" href="/login">Ir Al Login</Button>}
        />
      </Card>
    );
  }

  if (!invitacion?.valido) {
    return (
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Result
          status="error"
          title="Invitacion Invalida"
          subTitle={invitacion?.mensaje || 'El codigo de invitacion no es valido o ha expirado.'}
          extra={<Button type="primary" href="/login">Ir Al Login</Button>}
        />
      </Card>
    );
  }

  const stepIndex = step === 'validar' ? 0 : step === 'terminos' ? 1 : 2;

  return (
    <Card style={{ width: '100%', maxWidth: 540 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Steps
          current={stepIndex}
          items={[
            { title: 'Validar', status: 'finish', icon: <CheckCircleFilled /> },
            { title: 'Terminos', status: step === 'terminos' ? 'process' : stepIndex > 1 ? 'finish' : 'wait' },
            { title: 'Registro', status: step === 'registro' ? 'process' : 'wait' },
          ]}
        />

        {step === 'terminos' && (
          <TerminosStep
            documentos={documentos}
            aceptoTerminos={aceptoTerminos}
            aceptoPrivacidad={aceptoPrivacidad}
            setAceptoTerminos={setAceptoTerminos}
            setAceptoPrivacidad={setAceptoPrivacidad}
            onContinuar={handleTerminosAceptados}
          />
        )}

        {step === 'registro' && (
          <RegistroStep
            codigo={codigo}
            email={invitacion.email}
            rol={invitacion.rol}
            aceptoTerminos={aceptoTerminos}
            aceptoPrivacidad={aceptoPrivacidad}
            onExito={handleRegistroExito}
          />
        )}
      </Space>
    </Card>
  );
};

const TerminosStep = ({
  documentos,
  aceptoTerminos,
  aceptoPrivacidad,
  setAceptoTerminos,
  setAceptoPrivacidad,
  onContinuar,
}: {
  documentos: DocumentoLegalPublico[];
  aceptoTerminos: boolean;
  aceptoPrivacidad: boolean;
  setAceptoTerminos: (v: boolean) => void;
  setAceptoPrivacidad: (v: boolean) => void;
  onContinuar: () => void;
}) => {
  const terminosDoc = documentos.find((d) => d.tipo === 'TERMINOS');
  const privacidadDoc = documentos.find((d) => d.tipo === 'POLITICA_PRIVACIDAD');

  const canContinue =
    (!terminosDoc || aceptoTerminos) && (!privacidadDoc || aceptoPrivacidad);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Terminos y Condiciones
        </Typography.Title>
        <Typography.Text type="secondary">
          Debes revisar y aceptar los documentos legales para continuar.
        </Typography.Text>
      </div>

      <Collapse
        accordion
        defaultActiveKey={terminosDoc ? ['TERMINOS'] : ['POLITICA_PRIVACIDAD']}
        items={documentos.map((doc) => ({
          key: doc.tipo,
          label: (
            <Space>
              {TIPO_ICONS[doc.tipo]}
              <span>{TIPO_LABELS[doc.tipo] || doc.titulo}</span>
              <Typography.Text type="secondary">v{doc.version}</Typography.Text>
            </Space>
          ),
          children: (
            <Card size="small" style={{ maxHeight: 300, overflow: 'auto' }}>
              <Typography.Text strong>{doc.titulo}</Typography.Text>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 13 }}>
                {doc.contenido}
              </div>
            </Card>
          ),
        }))}
      />

      <Space direction="vertical" size="small">
        {terminosDoc && (
          <Checkbox
            checked={aceptoTerminos}
            onChange={(e) => setAceptoTerminos(e.target.checked)}
          >
            He leido y acepto los Terminos y Condiciones
          </Checkbox>
        )}
        {privacidadDoc && (
          <Checkbox
            checked={aceptoPrivacidad}
            onChange={(e) => setAceptoPrivacidad(e.target.checked)}
          >
            He leido y acepto la Politica de Privacidad
          </Checkbox>
        )}
      </Space>

      <Button type="primary" block disabled={!canContinue} onClick={onContinuar}>
        Continuar al Registro
      </Button>
    </Space>
  );
};

const RegistroStep = ({
  codigo,
  email,
  rol,
  aceptoTerminos,
  aceptoPrivacidad,
  onExito,
}: {
  codigo: string;
  email?: string;
  rol?: string;
  aceptoTerminos: boolean;
  aceptoPrivacidad: boolean;
  onExito: () => void;
}) => {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {email && (
        <Typography.Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
          Registro para: <Typography.Text strong>{email}</Typography.Text>
          {rol && <span> — Rol: <Typography.Text strong>{rol}</Typography.Text></span>}
        </Typography.Text>
      )}
      <RegistroForm
        codigo={codigo}
        emailSugerido={email}
        aceptoTerminos={aceptoTerminos}
        aceptoPrivacidad={aceptoPrivacidad}
        onExito={onExito}
      />
    </Space>
  );
};

export { PasswordStrength } from './PasswordStrength';
export { RegistroForm } from './RegistroForm';
export default Invitacion;
