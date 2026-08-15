import { useState, useEffect, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditOutlined, MailOutlined, PlusOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { licensingApi, usersApi } from '../../api';
import { ActionDropdown, useConfirmAction } from '../../components/common';
import { formatDate, formatCurrency, usuarioSchema, type UsuarioFormData } from '../../utils';
import { useAuthStore } from '../../store';
import type { Usuario } from '../../types';

const roleOptions = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'AUDITOR', label: 'Auditor' },
];

const Users = () => {
  const { user } = useAuthStore();
  const empresaId = user?.empresaId;
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [empresas, setEmpresas] = useState<Record<string, unknown>[]>([]);
  const [preciosRol, setPreciosRol] = useState<Record<string, { precioAnual: string | number }>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCodigo, setInviteCodigo] = useState<string | null>(null);
  const [inviteForm] = Form.useForm<{ rol: string; empresaId?: string; email?: string }>();
  const { confirm, confirmationModal } = useConfirmAction();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      username: '',
      nombreCompleto: '',
      email: '',
      password: '',
      rol: 'ANALISTA',
      empresaId: '',
    },
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, empresasData, suscripciones] = await Promise.all([
        usersApi.getAll(),
        licensingApi.empresas(),
        licensingApi.suscripciones(empresaId ?? null),
      ]);
      setUsers(data);
      setEmpresas(empresaId ? empresasData.filter((empresa) => String(empresa.id) === empresaId) : empresasData);
      const planId = Number((suscripciones[0] as { planId?: unknown } | undefined)?.planId ?? 0);
      if (planId) {
        const precios = await licensingApi.preciosRol(planId);
        setPreciosRol(
          Object.fromEntries(
            precios.map((precio) => [
              String(precio.rol),
              { precioAnual: precio.precioAnual as string | number },
            ])
          )
        );
      } else {
        setPreciosRol({});
      }
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onSubmit = async (data: UsuarioFormData) => {
    confirm({
      title: editingUser ? 'Confirmar Edición de Usuario' : 'Confirmar Creación de Usuario',
      description: editingUser ? `Se actualizarán los datos del usuario ${editingUser.email}.` : `Se creará el usuario ${data.email}.`,
      detail: `Rol: ${data.rol}. Empresa: ${data.empresaId || 'Global'}.`,
      confirmLabel: editingUser ? 'Guardar cambios' : 'Crear usuario',
      action: async () => {
        if (editingUser) await usersApi.update(editingUser.id, data);
        else await usersApi.create(data);
        setShowForm(false);
        setEditingUser(null);
        reset();
        fetchUsers();
      },
    });
  };

  const handleDeactivate = async (user: Usuario) => {
    confirm({
      title: 'Confirmar Desactivación',
      description: `Se desactivará el usuario ${user.email}.`,
      detail: 'El usuario no podrá iniciar sesión mientras permanezca inactivo.',
      confirmLabel: 'Desactivar',
      variant: 'critical',
      action: async () => {
        await usersApi.deactivate(user.id);
        fetchUsers();
      },
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    reset({ username: '', nombreCompleto: '', email: '', password: '', rol: 'ANALISTA', empresaId: empresaId || '' });
    setShowForm(true);
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setShowForm(true);
    reset({
      username: user.username,
      nombreCompleto: user.nombreCompleto || user.nombre || '',
      email: user.email,
      password: '',
      rol: user.rol,
      empresaId: user.empresaId,
    });
  };

  const handleInvite = async (values: { rol: string; empresaId?: string; email?: string }) => {
    if (!values.empresaId) {
      message.warning('Selecciona una empresa para la invitacion.');
      return;
    }
    try {
      const respuesta = await usersApi.crearInvitacion({
        rol: values.rol,
        empresaId: values.empresaId,
        email: values.email || undefined,
      });
      setInviteCodigo(String((respuesta as { codigo?: unknown }).codigo ?? ''));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo generar la invitacion');
    }
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteCodigo(null);
    inviteForm.resetFields();
  };

  const pricingColumns: ColumnsType<{ rol: string; precioAnual: string | number }> = [
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
      render: (rol: string) => <Tag color={rol === 'ADMINISTRADOR' ? 'gold' : 'blue'}>{roleLabel(rol)}</Tag>,
    },
    {
      title: 'Precio Anual Adicional (USD)',
      dataIndex: 'precioAnual',
      key: 'precioAnual',
      align: 'right',
      render: (precio) => formatCurrency(Number(precio)),
    },
  ];

  const pricingData = Object.entries(preciosRol).map(([rol, precio]) => ({
    rol,
    precioAnual: precio.precioAnual,
  }));

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    reset();
  };

  const columns: ColumnsType<Usuario> = [
    { title: 'Nombre', render: (_, user) => <Typography.Text strong>{user.nombreCompleto || user.nombre}</Typography.Text> },
    { title: 'Correo Electrónico', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'rol', render: (value) => <Tag color={value === 'ADMINISTRADOR' ? 'gold' : 'blue'}>{roleLabel(String(value))}</Tag> },
    { title: 'Empresa', render: (_, user) => user.empresaNombre || 'Empresa actual' },
    { title: 'Estado', dataIndex: 'activo', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Activo' : 'Inactivo'}</Tag> },
    { title: 'Fecha', dataIndex: 'fechaCreacion', render: (value) => formatDate(value) },
    {
      title: 'Acciones',
      align: 'right',
      render: (_, user) => (
        <ActionDropdown
          items={[
            { key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => handleEdit(user) },
            {
              key: 'deactivate',
              label: 'Desactivar',
              icon: <StopOutlined />,
              danger: true,
              disabled: !user.activo,
              onClick: () => handleDeactivate(user),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>Gestión de Usuarios</Typography.Title>
          <Typography.Text type="secondary">Administra usuarios y roles de tu empresa. No permite usuarios globales ni Administrador General.</Typography.Text>
        </div>
        <Space>
          <Button icon={<MailOutlined />} onClick={() => {
            inviteForm.setFieldsValue({ empresaId: empresaId || undefined, rol: 'ANALISTA' });
            setInviteOpen(true);
          }}>
            Generar Invitación
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo Usuario
          </Button>
        </Space>
      </Space>

      {error && <Alert type="error" showIcon message={error} action={<Button onClick={fetchUsers}>Reintentar</Button>} />}

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        open={showForm}
        onCancel={handleCloseForm}
        title={<Space><TeamOutlined />{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Space>}
        footer={null}
        centered
        width={560}
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Controller name="username" control={control} render={({ field }) => <Form.Item label="Usuario" validateStatus={errors.username ? 'error' : undefined} help={errors.username?.message}><Input {...field} placeholder="Nombre de usuario" /></Form.Item>} />
          <Controller name="nombreCompleto" control={control} render={({ field }) => <Form.Item label="Nombre Completo" validateStatus={errors.nombreCompleto ? 'error' : undefined} help={errors.nombreCompleto?.message}><Input {...field} placeholder="Nombre completo del usuario" /></Form.Item>} />
          <Controller name="email" control={control} render={({ field }) => <Form.Item label="Correo Electrónico" validateStatus={errors.email ? 'error' : undefined} help={errors.email?.message}><Input {...field} type="email" placeholder="correo@ejemplo.com" /></Form.Item>} />
          <Controller name="password" control={control} render={({ field }) => <Form.Item label={editingUser ? 'Nueva Contraseña' : 'Contraseña'} validateStatus={errors.password ? 'error' : undefined} help={errors.password?.message || (editingUser ? 'Dejar vacío para mantener la actual.' : undefined)}><Input.Password {...field} placeholder="Contraseña" /></Form.Item>} />
          <Controller name="rol" control={control} render={({ field }) => (
            <Form.Item
              label="Rol"
              validateStatus={errors.rol ? 'error' : undefined}
              help={errors.rol?.message}
              extra={field.value && preciosRol[field.value] && !editingUser ? `Precio anual adicional para este rol: ${formatCurrency(Number(preciosRol[field.value].precioAnual))}` : undefined}
            >
              <Select {...field} options={roleOptions} />
            </Form.Item>
          )} />
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Empresa" extra="Los usuarios creados desde Admin Empresa quedan asociados a la empresa actual.">
                <Select
                  {...field}
                  disabled={Boolean(empresaId)}
                  placeholder="Empresa actual"
                  options={empresas.map((empresa) => ({ value: String(empresa.id), label: `${String(empresa.codigo ?? empresa.id)} - ${String(empresa.nombre ?? '')}` }))}
                />
              </Form.Item>
            )}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseForm}>Cancelar</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </Space>
        </Form>
      </Modal>

      <Card title={<Space><MailOutlined />Precios De Usuarios Adicionales (USD / año)</Space>}>
        <Table
          rowKey="rol"
          columns={pricingColumns}
          dataSource={pricingData}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No hay precios configurados para el plan activo.' }}
        />
      </Card>

      <Modal
        open={inviteOpen}
        onCancel={closeInvite}
        title={<Space><MailOutlined />Generar Invitación</Space>}
        footer={inviteCodigo ? null : [
          <Button key="cancel" onClick={closeInvite}>Cancelar</Button>,
          <Button key="ok" type="primary" onClick={() => inviteForm.submit()}>Generar Invitación</Button>,
        ]}
        centered
        width={520}
      >
        {inviteCodigo ? (
          <Alert
            type="success"
            showIcon
            message="Invitación generada"
            description={
              <Space direction="vertical">
                <Typography.Text>Comparte este código con el usuario invitado (se usa en el registro con invitación):</Typography.Text>
                <Typography.Text code copyable style={{ fontSize: 16 }}>{inviteCodigo}</Typography.Text>
                <Typography.Text type="secondary">Si cargaste un email, también se envía la invitación por correo.</Typography.Text>
              </Space>
            }
          />
        ) : (
          <Form form={inviteForm} layout="vertical" onFinish={handleInvite} requiredMark={false}>
            <Form.Item label="Rol" name="rol" rules={[{ required: true, message: 'Selecciona un rol' }]}>
              <Select options={roleOptions} placeholder="Rol del invitado" />
            </Form.Item>
            <Form.Item label="Empresa" name="empresaId" rules={[{ required: true, message: 'Selecciona una empresa' }]}>
              <Select
                placeholder="Empresa destino"
                disabled={Boolean(empresaId)}
                options={empresas.map((empresa) => ({ value: String(empresa.id), label: `${String(empresa.codigo ?? empresa.id)} - ${String(empresa.nombre ?? '')}` }))}
              />
            </Form.Item>
            <Form.Item label="Correo Electrónico (opcional)" name="email" rules={[{ type: 'email', message: 'Correo electrónico inválido' }]}>
              <Input placeholder="correo@ejemplo.com" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {confirmationModal}
    </Space>
  );
};

const roleLabel = (rol: string) => roleOptions.find((option) => option.value === rol)?.label || rol;

export default Users;
