import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Result, Space, Spin, Tabs, Typography } from 'antd';
import api from '../../api/axios';
import type { TipoDocumentoLegal } from '../../types';

interface DocumentoLegalPublico {
  id: number;
  tipo: TipoDocumentoLegal;
  version: number;
  titulo: string;
  contenido: string;
}

const TIPO_LABELS: Record<TipoDocumentoLegal, string> = {
  TERMINOS: 'Terminos y Condiciones',
  POLITICA_PRIVACIDAD: 'Politica de Privacidad',
};

const DocumentosLegalesPublico = () => {
  const navigate = useNavigate();
  const { tipo } = useParams<{ tipo?: string }>();
  const [documentos, setDocumentos] = useState<DocumentoLegalPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DocumentoLegalPublico[]>('/terminos-condiciones/publico')
      .then((res) => setDocumentos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError('No se pudieron cargar los documentos legales. Verifica que el servidor este disponible.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card style={{ width: '100%', maxWidth: 720, minHeight: 300, display: 'grid', placeItems: 'center' }}>
        <Spin tip="Cargando documentos legales..." />
      </Card>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', maxWidth: 720 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
          Volver al Login
        </Button>
        <Card>
          <Result status="warning" title="Error" subTitle={error} />
        </Card>
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div style={{ width: '100%', maxWidth: 720 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
          Volver al Login
        </Button>
        <Card>
          <Result status="info" title="Sin documentos" subTitle="No hay documentos legales publicados." />
        </Card>
      </div>
    );
  }

  const activeKey = tipo === 'privacidad' ? 'POLITICA_PRIVACIDAD' : 'TERMINOS';

  const items = documentos.map((doc) => ({
    key: doc.tipo,
    label: TIPO_LABELS[doc.tipo],
    children: (
      <Card size="small" style={{ maxHeight: 500, overflow: 'auto' }}>
        <Typography.Title level={4}>{doc.titulo}</Typography.Title>
        <Typography.Text type="secondary">Version {doc.version}</Typography.Text>
        <div style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
          {doc.contenido}
        </div>
      </Card>
    ),
  }));

  return (
    <div style={{ width: '100%', maxWidth: 720 }}>
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')} style={{ marginBottom: 16 }}>
        Volver al Login
      </Button>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>
            Documentos Legales
          </Typography.Title>
          {documentos.length === 1 ? (
            <Card size="small">
              <Typography.Title level={4}>{documentos[0].titulo}</Typography.Title>
              <Typography.Text type="secondary">Version {documentos[0].version}</Typography.Text>
              <div style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14 }}>
                {documentos[0].contenido}
              </div>
            </Card>
          ) : (
            <Tabs defaultActiveKey={activeKey} items={items} />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default DocumentosLegalesPublico;
