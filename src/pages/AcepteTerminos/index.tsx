import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Result, Space, Spin, Steps, Typography } from 'antd';
import { FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store';
import { terminosCondicionesApi } from '../../api/terminosCondiciones';
import type { DocumentoLegal } from '../../api/terminosCondiciones';
import type { TipoDocumentoLegal } from '../../types';

const TIPO_LABELS: Record<TipoDocumentoLegal, string> = {
  TERMINOS: 'Terminos y Condiciones',
  POLITICA_PRIVACIDAD: 'Politica de Privacidad',
};

const TIPO_ICONS: Record<TipoDocumentoLegal, React.ReactNode> = {
  TERMINOS: <FileTextOutlined />,
  POLITICA_PRIVACIDAD: <SafetyCertificateOutlined />,
};

const AcepteTerminos = () => {
  const navigate = useNavigate();
  const { user, setAceptoTerminos } = useAuthStore();
  const [documentos, setDocumentos] = useState<DocumentoLegal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aceptados, setAceptados] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    terminosCondicionesApi.getPendientes()
      .then((res) => {
        if (!res.requiereAceptacion) {
          setAceptoTerminos(true);
          navigate(user?.rol === 'ADMINISTRADOR' ? '/admin-empresa' : '/dashboard', { replace: true });
          return;
        }
        setDocumentos(res.documentosPendientes);
      })
      .catch(() => {
        setAceptoTerminos(true);
        navigate(user?.rol === 'ADMINISTRADOR' ? '/admin-empresa' : '/dashboard', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate, setAceptoTerminos, user?.rol]);

  const handleAceptar = async (docId: number) => {
    setSubmitting(true);
    setError(null);
    try {
      await terminosCondicionesApi.aceptarDocumento(docId, true);
      const nuevos = new Set(aceptados);
      nuevos.add(docId);
      setAceptados(nuevos);

      if (currentIndex < documentos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setAceptoTerminos(true);
        navigate(user?.rol === 'ADMINISTRADOR' ? '/admin-empresa' : '/dashboard', { replace: true });
      }
    } catch {
      setError('Error al registrar la aceptacion. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ minHeight: 400, display: 'grid', placeItems: 'center' }}>
        <Spin tip="Cargando documentos legales..." />
      </Card>
    );
  }

  if (documentos.length === 0) {
    return (
      <div style={{ width: '100%', maxWidth: 720 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
          Volver al Login
        </Button>
        <Result
          status="success"
          title="No hay documentos pendientes"
          subTitle="Ya aceptaste todos los documentos legales."
          extra={<Button type="primary" onClick={() => navigate('/')}>Continuar</Button>}
        />
      </div>
    );
  }

  const doc = documentos[currentIndex];
  const todosAceptados = documentos.every((d) => aceptados.has(d.id));

  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
        Volver al Login
      </Button>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Documentos Legales
            </Typography.Title>
            <Typography.Text type="secondary">
              Debes aceptar los siguientes documentos para continuar usando el sistema.
            </Typography.Text>
          </div>

        {documentos.length > 1 && (
          <Steps
            current={currentIndex}
            items={documentos.map((d) => ({
              title: TIPO_LABELS[d.tipo],
              icon: aceptados.has(d.id) ? undefined : TIPO_ICONS[d.tipo],
              status: aceptados.has(d.id) ? 'finish' : d.id === doc?.id ? 'process' : 'wait',
            }))}
          />
        )}

        <Card
          title={
            <Space>
              {TIPO_ICONS[doc.tipo]}
              <span>{doc.titulo}</span>
              <Typography.Text type="secondary">v{doc.version}</Typography.Text>
            </Space>
          }
          style={{ maxHeight: 400, overflow: 'auto' }}
          bodyStyle={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}
        >
          {doc.contenido}
        </Card>

        {error && <Typography.Text type="danger">{error}</Typography.Text>}

        <div style={{ textAlign: 'center' }}>
          <Checkbox
            checked={aceptados.has(doc.id)}
            disabled={aceptados.has(doc.id) || submitting}
            onChange={(e) => {
              if (e.target.checked) {
                handleAceptar(doc.id);
              }
            }}
            style={{ marginRight: 16 }}
          >
            He leído y acepto los {TIPO_LABELS[doc.tipo]}
          </Checkbox>
        </div>

        {!todosAceptados && (
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              loading={submitting}
              disabled={aceptados.has(doc.id)}
              onClick={() => handleAceptar(doc.id)}
            >
              Aceptar y Continuar
            </Button>
          </div>
        )}
        </Space>
      </Card>
    </div>
  );
};

export default AcepteTerminos;
