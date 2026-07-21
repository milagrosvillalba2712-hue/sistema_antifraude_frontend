import { useState, useEffect, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditOutlined, PlusOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { licensingApi, usersApi } from '../../api';
import { ActionDropdown, useConfirmAction } from '../../components/common';
import { formatDate, usuarioSchema, type UsuarioFormData } from '../../utils';
import type { Usuario } from '../../types';

const roleOptions = [
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'GERENTE_SUPERVISOR', label: 'Gerente Supervisor' },
  { value: 'ADMIN_EMPRESA', label: 'Admin Empresa' },
  { value: 'ADMIN_GENERAL', label: 'Admin General' },
  { value: 'AUDITOR', label: 'Auditor' },
];

const Users = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [empresas, setEmpresas] = useState<Record<string, unknown>[]>([]);
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
      const [data, empresasData] = await Promise.all([
        usersApi.getAll(),
        licensingApi.empresas(),
      ]);
      setUsers(data);
      setEmpresas(empresasData);
    } catch (err) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    reset({ username: '', nombreCompleto: '', email: '', password: '', rol: 'ANALISTA', empresaId: '' });
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

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
    reset();
  };

  const columns: ColumnsType<Usuario> = [
    { title: 'Nombre', render: (_, user) => <Typography.Text strong>{user.nombreCompleto || user.nombre}</Typography.Text> },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Rol', dataIndex: 'rol', render: (value) => <Tag color={value === 'ADMIN_GENERAL' ? 'orange' : 'blue'}>{value}</Tag> },
    { title: 'Empresa', render: (_, user) => user.empresaNombre || 'Global' },
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
          <Typography.Text type="secondary">Administra usuarios, roles y empresa asociada.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nuevo Usuario</Button>
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
          <Controller name="username" control={control} render={({ field }) => <Form.Item label="Username" validateStatus={errors.username ? 'error' : undefined} help={errors.username?.message}><Input {...field} placeholder="Nombre de usuario" /></Form.Item>} />
          <Controller name="nombreCompleto" control={control} render={({ field }) => <Form.Item label="Nombre Completo" validateStatus={errors.nombreCompleto ? 'error' : undefined} help={errors.nombreCompleto?.message}><Input {...field} placeholder="Nombre completo del usuario" /></Form.Item>} />
          <Controller name="email" control={control} render={({ field }) => <Form.Item label="Email" validateStatus={errors.email ? 'error' : undefined} help={errors.email?.message}><Input {...field} type="email" placeholder="correo@ejemplo.com" /></Form.Item>} />
          <Controller name="password" control={control} render={({ field }) => <Form.Item label={editingUser ? 'Nueva Contraseña' : 'Contraseña'} validateStatus={errors.password ? 'error' : undefined} help={errors.password?.message || (editingUser ? 'Dejar vacío para mantener la actual.' : undefined)}><Input.Password {...field} placeholder="Contraseña" /></Form.Item>} />
          <Controller name="rol" control={control} render={({ field }) => <Form.Item label="Rol" validateStatus={errors.rol ? 'error' : undefined} help={errors.rol?.message}><Select {...field} options={roleOptions} /></Form.Item>} />
          <Controller
            name="empresaId"
            control={control}
            render={({ field }) => (
              <Form.Item label="Empresa" extra="Admin General puede quedar global; los demas roles deben asignarse a una empresa.">
                <Select
                  {...field}
                  allowClear
                  placeholder="Global / Sin empresa"
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
      {confirmationModal}
    </Space>
  );
};

export default Users;
