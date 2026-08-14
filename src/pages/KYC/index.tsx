import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Form, Input, Result, Space, Tag, Typography } from 'antd';
import { kycApi } from '../../api';
import { useConfirmAction } from '../../components/common';
import type { KycResponse } from '../../types';
import { useState } from 'react';

const KYC = () => {
  const [form] = Form.useForm<{ identificadorDocumento: string }>();
  const [result, setResult] = useState<KycResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmationModal } = useConfirmAction();

  const onSubmit = async () => {
    const values = await form.validateFields();
    confirm({
      title: 'Confirmar consulta KYC',
      description: `Se consultara informacion KYC del documento ${values.identificadorDocumento}.`,
      detail: 'Esta consulta sensible quedará registrada en auditoría.',
      confirmLabel: 'Consultar',
      variant: 'warning',
      action: async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
          const response = await kycApi.consultar(values.identificadorDocumento);
          setResult(response);
        } catch (err: unknown) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(axiosError.response?.data?.message || 'Error al consultar KYC');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>Consulta KYC</Typography.Title>
        <Typography.Text type="secondary">Consulta datos regulatorios y senales de riesgo por documento.</Typography.Text>
      </div>

      <Card>
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          <Form.Item label="Identificador Del Documento" name="identificadorDocumento" rules={[{ required: true, message: 'Ingresa el documento' }]}>
            <Input.Search
              enterButton={<Button type="primary" icon={<SearchOutlined />} loading={loading}>Consultar</Button>}
              placeholder="Ingrese numero de documento"
              onSearch={onSubmit}
            />
          </Form.Item>
        </Form>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      {result && (
        <Card title="Resultado De La Consulta">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Result
              status={result.resultado ? 'warning' : 'success'}
              title={result.resultado ? 'Coincidencia Encontrada' : 'Sin Coincidencias De Riesgo'}
              subTitle={result.mensaje || 'Consulta procesada correctamente.'}
            />
            <Descriptions
              bordered
              column={2}
              items={[
                { key: 'documento', label: 'Documento', children: result.identificadorDocumento },
                { key: 'tipo', label: 'Tipo Consulta', children: result.tipoConsulta },
                { key: 'resultado', label: 'Resultado', children: <Tag color={result.resultado ? 'red' : 'green'}>{result.resultado ? 'Positivo' : 'Negativo'}</Tag> },
                { key: 'mensaje', label: 'Mensaje', children: result.mensaje || '-' },
              ]}
            />
          </Space>
        </Card>
      )}
      {confirmationModal}
    </Space>
  );
};

export default KYC;
