import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { listasControlApi } from '../../api';
import type { ElementoListaControl, ElementoListaControlRequest, ListaControl, ListaControlRequest } from '../../types';

const tipoListaOptions = [
  { value: 'BLACKLIST', label: 'Lista Negra' },
  { value: 'WHITELIST', label: 'Lista Blanca' },
];

const tipoEntidadOptions = ['PERSONA', 'EMPRESA', 'CUENTA', 'DOCUMENTO', 'WALLET', 'ALIAS'].map((value) => ({ value, label: label(value) }));
const tipoIdentificadorOptions = ['NOMBRE', 'DOCUMENTO', 'CUENTA', 'WALLET', 'ALIAS'].map((value) => ({ value, label: label(value) }));

export default function ListasControl() {
  const [listas, setListas] = useState<ListaControl[]>([]);
  const [elementos, setElementos] = useState<ElementoListaControl[]>([]);
  const [selected, setSelected] = useState<ListaControl | null>(null);
  const [loading, setLoading] = useState(false);
  const [listaModalOpen, setListaModalOpen] = useState(false);
  const [elementoModalOpen, setElementoModalOpen] = useState(false);
  const [listaForm] = Form.useForm<ListaControlRequest>();
  const [elementoForm] = Form.useForm<ElementoListaControlRequest>();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listasControlApi.listar();
      setListas(data);
      const nextSelected = selected ? data.find((item) => item.id === selected.id) ?? data[0] ?? null : data[0] ?? null;
      setSelected(nextSelected);
      if (nextSelected) {
        setElementos(await listasControlApi.elementos(nextSelected.id));
      } else {
        setElementos([]);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'No se pudieron cargar las listas de control');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listaColumns = useMemo<ColumnsType<ListaControl>>(() => [
    { title: 'Tipo', dataIndex: 'tipoLista', render: (value: string) => <Tag color={value === 'BLACKLIST' ? 'red' : 'green'}>{value === 'BLACKLIST' ? 'Lista Negra' : 'Lista Blanca'}</Tag> },
    { title: 'Código', dataIndex: 'codigo' },
    { title: 'Nombre', dataIndex: 'nombre' },
    { title: 'Estado', dataIndex: 'estado', render: (value: string) => <Tag color={value === 'ACTIVA' ? 'green' : 'default'}>{label(value)}</Tag> },
    { title: 'Elementos', dataIndex: 'totalElementos', width: 110 },
  ], []);

  const elementoColumns = useMemo<ColumnsType<ElementoListaControl>>(() => [
    { title: 'Tipo', dataIndex: 'tipoLista', render: (value: string) => <Tag color={value === 'BLACKLIST' ? 'red' : 'green'}>{value === 'BLACKLIST' ? 'Negra' : 'Blanca'}</Tag> },
    { title: 'Identificador', dataIndex: 'tipoIdentificador', render: (value: string) => label(value) },
    { title: 'Valor', dataIndex: 'valorOriginal', ellipsis: true },
    { title: 'Nombre', dataIndex: 'nombreMostrado', ellipsis: true },
    { title: 'Severidad', dataIndex: 'severidad', render: (value: string) => <Tag color={severityColor(value)}>{value}</Tag> },
    { title: 'Motivo', dataIndex: 'motivo', ellipsis: true },
    { title: 'Estado', dataIndex: 'estado', render: (value: string) => <Tag color={value === 'ACTIVO' ? 'green' : 'default'}>{label(value)}</Tag> },
  ], []);

  const openLista = () => {
    listaForm.resetFields();
    listaForm.setFieldsValue({ tipoLista: 'BLACKLIST', estado: 'ACTIVA', prioridad: 50 });
    setListaModalOpen(true);
  };

  const saveLista = async () => {
    const values = await listaForm.validateFields();
    await listasControlApi.crear(values);
    message.success('Lista creada');
    setListaModalOpen(false);
    await load();
  };

  const openElemento = () => {
    if (!selected) {
      message.warning('Primero selecciona una lista');
      return;
    }
    elementoForm.resetFields();
    elementoForm.setFieldsValue({
      tipoEntidad: 'PERSONA',
      tipoIdentificador: 'NOMBRE',
      estado: 'ACTIVO',
      severidad: selected.tipoLista === 'WHITELIST' ? 'Baja' : 'Crítica',
      fuente: 'CLIENTE',
    });
    setElementoModalOpen(true);
  };

  const saveElemento = async () => {
    if (!selected) return;
    const values = await elementoForm.validateFields();
    await listasControlApi.crearElemento(selected.id, values);
    message.success('Elemento agregado');
    setElementoModalOpen(false);
    setElementos(await listasControlApi.elementos(selected.id));
  };

  const importFile = async (file: File) => {
    if (!selected) {
      message.warning('Primero selecciona una lista');
      return Upload.LIST_IGNORE;
    }
    const result = await listasControlApi.importar(selected.id, file);
    message.success(`Importación ${label(result.estado)}: ${result.registrosValidos} válidos, ${result.registrosInvalidos} inválidos`);
    setElementos(await listasControlApi.elementos(selected.id));
    await load();
    return Upload.LIST_IGNORE;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>Listas De Control</Typography.Title>
          <Typography.Text type="secondary">Administra listas blancas y negras propias de la empresa para el motor de reglas.</Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>Actualizar</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openLista}>Nueva Lista</Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        message="Catálogos maestros vs. listas internas"
        description="Los catálogos regulatorios publicados por Regula son de solo lectura para el cliente. Estas listas son decisiones internas de la empresa y se auditan por tenant."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={9}>
          <Card title="Listas" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="id"
              loading={loading}
              dataSource={listas}
              columns={listaColumns}
              pagination={{ pageSize: 8 }}
              onRow={(record) => ({
                onClick: async () => {
                  setSelected(record);
                  setElementos(await listasControlApi.elementos(record.id));
                },
              })}
              rowClassName={(record) => record.id === selected?.id ? 'ant-table-row-selected' : ''}
            />
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card
            title={selected ? `Elementos De ${selected.nombre}` : 'Elementos'}
            extra={(
              <Space>
                <Upload beforeUpload={importFile} showUploadList={false} accept=".csv,.xlsx">
                  <Button icon={<UploadOutlined />} disabled={!selected}>Importar CSV/XLSX</Button>
                </Upload>
                <Button type="primary" icon={<PlusOutlined />} onClick={openElemento} disabled={!selected}>Agregar Elemento</Button>
              </Space>
            )}
          >
            <Table rowKey="id" loading={loading} dataSource={elementos} columns={elementoColumns} pagination={{ pageSize: 10, showSizeChanger: true }} />
          </Card>
        </Col>
      </Row>

      <Modal open={listaModalOpen} title="Nueva Lista De Control" okText="Guardar" onOk={saveLista} onCancel={() => setListaModalOpen(false)}>
        <Form form={listaForm} layout="vertical">
          <Form.Item name="tipoLista" label="Tipo De Lista" rules={[{ required: true }]}><Select options={tipoListaOptions} /></Form.Item>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}><Input placeholder="Ej. BLACKLIST_CLIENTES_BLOQUEADOS" /></Form.Item>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}><Input placeholder="Ej. Clientes Bloqueados Por Fraude Confirmado" /></Form.Item>
          <Form.Item name="descripcion" label="Descripción"><Input.TextArea rows={3} placeholder="Describe el uso de esta lista en la operación." /></Form.Item>
          <Form.Item name="prioridad" label="Prioridad"><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal open={elementoModalOpen} title="Agregar Elemento" okText="Guardar" onOk={saveElemento} onCancel={() => setElementoModalOpen(false)}>
        <Form form={elementoForm} layout="vertical">
          <Form.Item name="tipoEntidad" label="Tipo De Entidad" rules={[{ required: true }]}><Select options={tipoEntidadOptions} /></Form.Item>
          <Form.Item name="tipoIdentificador" label="Tipo De Identificador" rules={[{ required: true }]}><Select options={tipoIdentificadorOptions} /></Form.Item>
          <Form.Item name="valor" label="Valor A Evaluar" rules={[{ required: true }]}><Input placeholder="Nombre, documento, cuenta, wallet o alias" /></Form.Item>
          <Form.Item name="nombreMostrado" label="Nombre Mostrado"><Input placeholder="Nombre legible para investigación" /></Form.Item>
          <Form.Item name="documentoMostrado" label="Documento Mostrado"><Input placeholder="Documento enmascarado o referencia interna" /></Form.Item>
          <Form.Item name="motivo" label="Motivo"><Input.TextArea rows={2} placeholder="Motivo de inclusión en la lista" /></Form.Item>
          <Form.Item name="severidad" label="Severidad"><Input placeholder="Baja, Media, Alta o Crítica" /></Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function label(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function severityColor(value?: string | null) {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('crit')) return 'red';
  if (normalized.includes('alta')) return 'orange';
  if (normalized.includes('media')) return 'gold';
  return 'green';
}
