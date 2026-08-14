import { useEffect } from 'react';
import dayjs from 'dayjs';
import { Alert, Avatar, Button, Card, DatePicker, Empty, Form, Input, List, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { CalendarOutlined, DeleteOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons';
import { useConfirmAction } from '../../components/common';
import { useProfileStore } from '../../store/profileStore';
import { authApi } from '../../api';
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
  const [passwordForm] = Form.useForm();

  const handleChangePassword = async (values: {
    passwordActual: string;
    nuevaPassword: string;
    confirmPassword: string;
  }) => {
    if (values.nuevaPassword !== values.confirmPassword) {
      message.error('Las contraseñas no coinciden.');
      return;
    }
    try {
      await authApi.changePassword(values.passwordActual, values.nuevaPassword);
      message.success('Contrasena actualizada correctamente.');
      passwordForm.resetFields();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : 'No se pudo actualizar la contraseña');
    }
  };

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
                  title: 'Confirmar Programación',
                  description: `Se creará una programación de disponibilidad ${payload.tipoEstado}.`,
                  detail: payload.motivo || 'Sin motivo cargado.',
                  confirmLabel: 'Crear Programación',
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
              <Button type="primary" htmlType="submit">Crear Programación</Button>
            </Form>
          </Card>

          <Card title={<Space><KeyOutlined />Cambiar Contraseña</Space>}>
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item label="Contraseña Actual" name="passwordActual" rules={[{ required: true, message: 'Ingresa tu contraseña actual' }]}>
                <Input.Password placeholder="Contraseña actual" autoComplete="current-password" />
              </Form.Item>
              <Form.Item
                label="Nueva Contraseña"
                name="nuevaPassword"
                rules={[{ required: true, message: 'Ingresa la nueva contraseña' }, { min: 10, message: 'Mínimo 10 caracteres' }]}
              >
                <Input.Password placeholder="Mínimo 10 caracteres" autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                label="Confirmar Nueva Contraseña"
                name="confirmPassword"
                rules={[{ required: true, message: 'Confirma la nueva contraseña' }]}
              >
                <Input.Password placeholder="Repite la nueva contraseña" autoComplete="new-password" />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                message="Al cambiar la contraseña se invalidan las sesiones previas."
                style={{ marginBottom: 16 }}
              />
              <Button type="primary" htmlType="submit">Actualizar Contraseña</Button>
            </Form>
          </Card>
        </Space>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Estado Actual">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color={profile.estado === 'DISPONIBLE' ? 'green' : 'orange'}>{labelFor(profile.estado || 'NO_DISPONIBLE')}</Tag>
              <Typography.Text type="secondary">Última Actualización: {profile.ultimaActualizacionEstado ? formatDate(profile.ultimaActualizacionEstado) : '-'}</Typography.Text>
              <Select
                value={profile.estado}
                style={{ width: '100%' }}
                options={statusOptions.map((status) => ({ value: status, label: labelFor(status) }))}
                onChange={(status) => {
                  confirm({
                    title: 'Confirmar Cambio De Estado',
                    description: `Tu estado cambiará a ${labelFor(status)}.`,
                    detail: 'Esta acción quedará registrada en auditoría.',
                    confirmLabel: 'Cambiar Estado',
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
                          title: 'Confirmar Cancelación',
                          description: `Se cancelará la programación #${item.id}.`,
                          detail: 'La programación dejará de estar activa.',
                          confirmLabel: 'Cancelar Programación',
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
