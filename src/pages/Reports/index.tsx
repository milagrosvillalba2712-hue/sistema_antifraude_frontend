import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, InputNumber, Space, Tabs, Typography } from 'antd';
import { reportsApi } from '../../api';
import { useConfirmAction } from '../../components/common';
import { ReporteLicencia } from '../../components/licencia';

const Reports = () => {
  const [form] = Form.useForm<{ alertaId: number }>();
  const { confirm, confirmationModal } = useConfirmAction();

  const handleExport = async () => {
    const { alertaId } = await form.validateFields();
    confirm({
      title: 'Confirmar exportacion ROS',
      description: `Se generara/exportara el reporte ROS para la alerta #${alertaId}.`,
      detail: 'La generacion de documentos de cumplimiento queda registrada en auditoria.',
      confirmLabel: 'Exportar CSV',
      variant: 'warning',
      action: async () => {
        const blob = await reportsApi.exportRos(alertaId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ROS_${alertaId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>Reportes</Typography.Title>
        <Typography.Text type="secondary">Generacion y exportacion de reportes de operaciones sospechosas y consolidado de licencia.</Typography.Text>
      </div>

      <Tabs
        items={[
          {
            key: 'ros',
            label: 'Reporte ROS',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card title="Exportar Reporte De Operaciones Sospechosas">
                  <Form form={form} layout="vertical" style={{ maxWidth: 520 }}>
                    <Form.Item label="ID De Alerta" name="alertaId" rules={[{ required: true, message: 'Ingresa el ID de alerta' }]}>
                      <InputNumber min={1} precision={0} placeholder="Ej. 1024" style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                      Exportar CSV
                    </Button>
                  </Form>
                </Card>

                <Alert
                  type="info"
                  showIcon
                  icon={<FileTextOutlined />}
                  message="Acerca De Los Reportes ROS"
                  description="Los reportes se generan desde alertas investigadas e incluyen alerta, transaccion, regla activada, evaluacion realizada, usuario generador y fecha/hora de generacion."
                />
              </Space>
            ),
          },
          {
            key: 'licencia',
            label: 'Reporte De Licencia',
            children: <ReporteLicencia />,
          },
        ]}
      />
      {confirmationModal}
    </Space>
  );
};

export default Reports;
