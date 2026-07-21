import { useEffect } from 'react';
import dayjs from 'dayjs';
import { Avatar, Button, Card, DatePicker, Empty, Form, Input, List, Select, Space, Spin, Tag, Typography } from 'antd';
import { CalendarOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useConfirmAction } from '../../components/common';
import { useProfileStore } from '../../store/profileStore';
import { formatDate } from '../../utils';
import type { EstadoUsuario } from '../../types';

const statusOptions: EstadoUsuario[] = ['DISPONIBLE', 'OCUPADO', 'AUSENTE', 'NO_DISPONIBLE', 'EN_REUNION', 'ALMUERZO', 'VACACIONES', 'CAPACITACION', 'FUERA_OFICINA'];

const Profile = () => {
  const {
    profile,
    availability,
    loading,
    fetchProfile,
    fetchAvailability,
    updateProfile,
    updateStatus,
    createSchedule,
    cancelSchedule,
  } = useProfileStore();
  const { confirm, confirmationModal } = useConfirmAction();
  const [profileForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
    fetchAvailability();
  }, [fetchAvailability, fetchProfile]);

  useEffect(() => {
    if (profile) profileForm.setFieldsValue(profile);
  }, [profile, profileForm]);

  if (loading && !profile) {
    return <Card><Spin /> Cargando perfil...</Card>;
  }

  if (!profile) {
    return <Card><Empty description="No se pudo cargar el perfil" /></Card>;
  }

  const userInitial = (profile.nombreVisible || 'U').charAt(0).toUpperCase();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>Mi Perfil</Typography.Title>
        <Typography.Text type="secondary">Administra tu informacion y disponibilidad operativa.</Typography.Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Datos Del Perfil">
            <Space align="start" size="large" style={{ width: '100%' }}>
              <Avatar size={88} src={profile.imagenPerfil || profile.fotoUrl} icon={<UserOutlined />}>{userInitial}</Avatar>
              <Form
                form={profileForm}
                layout="vertical"
                style={{ flex: 1 }}
                onFinish={(values) => {
                  confirm({
                    title: 'Confirmar guardado de perfil',
                    description: 'Se actualizaran los datos visibles de tu perfil.',
                    detail: `Nombre visible: ${values.nombreVisible || profile.nombreVisible || '-'}.`,
                    confirmLabel: 'Guardar',
                    action: async () => updateProfile(values),
                  });
                }}
              >
                <Form.Item label="Nombre Visible" name="nombreVisible">
                  <Input placeholder="Nombre que veran otros usuarios" />
                </Form.Item>
                <Form.Item label="Imagen De Perfil" name="imagenPerfil">
                  <Input placeholder="URL de imagen" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">Guardar Perfil</Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>

          <Card title={<Space><CalendarOutlined />Programar Disponibilidad</Space>}>
            <Form
              form={scheduleForm}
              layout="vertical"
              onFinish={(values) => {
                const payload = {
                  tipoEstado: values.tipoEstado,
                  fechaInicio: values.rango?.[0]?.toISOString(),
                  fechaFin: values.rango?.[1]?.toISOString(),
                  esProgramado: true,
                  motivo: values.motivo,
                };
                confirm({
                  title: 'Confirmar programacion',
                  description: `Se creara una programacion de disponibilidad ${payload.tipoEstado}.`,
                  detail: payload.motivo || 'Sin motivo cargado.',
                  confirmLabel: 'Crear programacion',
                  action: async () => {
                    await createSchedule(payload);
                    scheduleForm.resetFields();
                  },
                });
              }}
            >
              <Form.Item label="Estado Programado" name="tipoEstado" rules={[{ required: true, message: 'Selecciona un estado' }]}>
                <Select options={statusOptions.map((status) => ({ value: status, label: labelFor(status) }))} />
              </Form.Item>
              <Form.Item label="Rango De Fecha Y Hora" name="rango" rules={[{ required: true, message: 'Selecciona el rango' }]}>
                <DatePicker.RangePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Motivo" name="motivo">
                <Input.TextArea rows={3} placeholder="Motivo visible para supervisores o asignaciones" />
              </Form.Item>
              <Button type="primary" htmlType="submit">Crear Programacion</Button>
            </Form>
          </Card>
        </Space>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Estado Actual">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color={profile.estado === 'DISPONIBLE' ? 'green' : 'orange'}>{labelFor(profile.estado || 'NO_DISPONIBLE')}</Tag>
              <Typography.Text type="secondary">Ultima actualizacion: {profile.ultimaActualizacionEstado ? formatDate(profile.ultimaActualizacionEstado) : '-'}</Typography.Text>
              <Select
                value={profile.estado}
                style={{ width: '100%' }}
                options={statusOptions.map((status) => ({ value: status, label: labelFor(status) }))}
                onChange={(status) => {
                  confirm({
                    title: 'Confirmar cambio de estado',
                    description: `Tu estado cambiara a ${labelFor(status)}.`,
                    detail: 'Esta accion quedara registrada en auditoria.',
                    confirmLabel: 'Cambiar estado',
                    action: async () => updateStatus(status),
                  });
                }}
              />
            </Space>
          </Card>

          <Card title="Disponibilidad Programada">
            <List
              locale={{ emptyText: <Empty description="Sin programaciones activas" /> }}
              dataSource={availability}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="cancel"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        confirm({
                          title: 'Confirmar cancelacion',
                          description: `Se cancelara la programacion #${item.id}.`,
                          detail: 'La programacion dejara de estar activa.',
                          confirmLabel: 'Cancelar programacion',
                          variant: 'warning',
                          action: async () => cancelSchedule(item.id),
                        });
                      }}
                    >
                      Cancelar
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<Space><Tag>{labelFor(item.estado || item.tipoEstado || '')}</Tag>{item.activo === false && <Tag color="default">Inactiva</Tag>}</Space>}
                    description={`${item.fechaInicio ? dayjs(item.fechaInicio).format('DD/MM/YYYY HH:mm') : formatDate(item.fechaActualizacion)}${item.fechaFin ? ` - ${dayjs(item.fechaFin).format('DD/MM/YYYY HH:mm')}` : ''}${item.motivo ? ` · ${item.motivo}` : ''}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </div>
      {confirmationModal}
    </Space>
  );
};

const labelFor = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default Profile;
