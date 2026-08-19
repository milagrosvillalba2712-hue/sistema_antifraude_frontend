import { useState, useEffect, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditOutlined, MailOutlined, PlusOutlined, ShoppingCartOutlined, StopOutlined, TeamOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Progress, Select, Space, Table, Tag, Typography, message } from 'antd';
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
  const [roleLimits, setRoleLimits] = useState<Record<string, number>>({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCodigo, setInviteCodigo] = useState<string | null>(null);
  const [inviteForm] = Form.useForm<{ rol: string; empresaId?: string; email?: string }>();
  const { confirm, confirmationModal } = useConfirmAction();

  const [solicitudOpen, setSolicitudOpen] = useState(false);
  const [solicitudForm] = Form.useForm<{ tipoRol: string; cantidad: number; motivo: string }>();
  const [solicitudConfirmOpen, setSolicitudConfirmOpen] = useState(false);
  const [solicitudPendiente, setSolicitudPendiente] = useState<{ id: number; tipoRol: string; cantidad: number; precioUnitario: number; total: number } | null>(null);

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

  const computeRoleCounts = (userData: Usuario[]) => {
    const counts: Record<string, number> = { ADMINISTRADOR: 0, SUPERVISOR: 0, ANALISTA: 0, AUDITOR: 0 };
    userData.forEach((u) => {
      if (u.activo && counts[u.rol] !== undefined) {
        counts[u.rol]++;
      }
    });
    return counts;
  };

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
      setRoleCounts(computeRoleCounts(data));

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

      if (empresaId) {
        try {
          const limitesData = await licensingApi.limites(empresaId);
          setRoleLimits({
            ADMINISTRADOR: Number((limitesData as Record<string, unknown>).limiteAdministradores ?? 0),
            SUPERVISOR: Number((limitesData as Record<string, unknown>).limiteSupervisores ?? 0),
            ANALISTA: Number((limitesData as Record<string, unknown>).limiteAnalistas ?? 0),
            AUDITOR: Number((limitesData as Record<string, unknown>).limiteAuditores ?? 0),
          });
        } catch {
          setRoleLimits({});
        }
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message.error(axiosErr.response?.data?.message || 'No se pudo generar la invitacion');
    }
  };

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteCodigo(null);
    inviteForm.resetFields();
  };

  const handleSolicitudRoles = async (values: { tipoRol: string; cantidad: number; motivo: string }) => {
    if (!empresaId) {
      message.warning('No se detecto una empresa asociada.');
      return;
    }
    try {
      const respuesta = await licensingApi.crearSolicitudRoles({
        empresaId,
        tipoRol: values.tipoRol,
        cantidad: values.cantidad,
        motivo: values.motivo,
      });
      const precioUnitario = Number((preciosRol[values.tipoRol]?.precioAnual ?? 0));
      setSolicitudPendiente({
        id: Number(respuesta.id ?? respuesta.solicitudId ?? 0),
        tipoRol: values.tipoRol,
        cantidad: values.cantidad,
        precioUnitario,
        total: precioUnitario * values.cantidad,
      });
      setSolicitudOpen(false);
      setSolicitudConfirmOpen(true);
      solicitudForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo crear la solicitud');
    }
  };

  const handlePagarSolicitud = async () => {
    if (!solicitudPendiente) return;
    try {
      await licensingApi.pagarSolicitudRoles(solicitudPendiente.id);
      message.success('Pago procesado. Los roles adicionales ya estan disponibles.');
      setSolicitudConfirmOpen(false);
      setSolicitudPendiente(null);
      fetchUsers();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'No se pudo procesar el pago');
    }
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
          <Button icon={<ShoppingCartOutlined />} onClick={() => {
            solicitudForm.resetFields();
            setSolicitudOpen(true);
          }}>
            Solicitar Roles
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo Usuario
          </Button>
        </Space>
      </Space>

      {error && <Alert type="error" showIcon message={error} action={<Button onClick={fetchUsers}>Reintentar</Button>} />}

      {empresaId && Object.keys(roleLimits).length > 0 && (
        <Card title="Limites de Roles por Plan" size="small">
          <Space wrap size="middle">
            {roleOptions.map((opt) => {
              const limit = roleLimits[opt.value] || 0;
              const count = roleCounts[opt.value] || 0;
              const pct = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;
              const exceeded = limit > 0 && count >= limit;
              return (
                <div key={opt.value} style={{ minWidth: 160 }}>
                  <Space size={4}>
                    <Tag color={opt.value === 'ADMINISTRADOR' ? 'gold' : 'blue'}>{opt.label}</Tag>
                    <Typography.Text type={exceeded ? 'danger' : undefined}>
                      {count}/{limit}
                    </Typography.Text>
                  </Space>
                  <Progress
                    percent={pct}
                    size="small"
                    status={exceeded ? 'exception' : 'normal'}
                    showInfo={false}
                  />
                </div>
              );
            })}
          </Space>
        </Card>
      )}

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
              extra={(() => {
                const limit = roleLimits[field.value] || 0;
                const count = roleCounts[field.value] || 0;
                if (limit > 0 && !editingUser) {
                  if (count >= limit) return <Typography.Text type="danger">Limite alcanzado. Solicita roles adicionales.</Typography.Text>;
                  return `Usados: ${count}/${limit}. Precio adicional: ${formatCurrency(Number(preciosRol[field.value]?.precioAnual ?? 0))}`;
                }
                return field.value && preciosRol[field.value] && !editingUser ? `Precio anual adicional para este rol: ${formatCurrency(Number(preciosRol[field.value].precioAnual))}` : undefined;
              })()}
            >
              <Select
                {...field}
                options={roleOptions.map((opt) => ({
                  ...opt,
                  disabled: !editingUser && roleLimits[opt.value] !== undefined && (roleCounts[opt.value] || 0) >= (roleLimits[opt.value] || 0),
                }))}
              />
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
                <Typography.Text>Comparte este enlace con el usuario invitado:</Typography.Text>
                <Typography.Text code copyable style={{ fontSize: 14 }}>{`${window.location.origin}/invitacion?codigo=${inviteCodigo}`}</Typography.Text>
                <Typography.Text type="secondary">O comparte solo el codigo: <Typography.Text code copyable>{inviteCodigo}</Typography.Text></Typography.Text>
                <Typography.Text type="secondary">Si cargaste un email, tambien se envia la invitacion por correo.</Typography.Text>
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

      <Modal
        open={solicitudOpen}
        onCancel={() => setSolicitudOpen(false)}
        title={<Space><ShoppingCartOutlined />Solicitar Roles Adicionales</Space>}
        footer={[
          <Button key="cancel" onClick={() => setSolicitudOpen(false)}>Cancelar</Button>,
          <Button key="ok" type="primary" onClick={() => solicitudForm.submit()}>Crear Solicitud</Button>,
        ]}
        centered
        width={480}
      >
        <Form form={solicitudForm} layout="vertical" onFinish={handleSolicitudRoles} requiredMark={false}>
          <Form.Item label="Tipo de Rol" name="tipoRol" rules={[{ required: true, message: 'Selecciona el tipo de rol' }]}>
            <Select
              options={roleOptions.map((opt) => {
                const limit = roleLimits[opt.value] || 0;
                const count = roleCounts[opt.value] || 0;
                const precio = Number(preciosRol[opt.value]?.precioAnual ?? 0);
                return {
                  value: opt.value,
                  label: `${opt.label} — ${formatCurrency(precio)}/año — Usados: ${count}/${limit}`,
                };
              })}
              placeholder="Selecciona el rol"
            />
          </Form.Item>
          <Form.Item label="Cantidad" name="cantidad" rules={[{ required: true, message: 'Indica la cantidad' }]}>
            <Input type="number" min={1} max={100} placeholder="1" />
          </Form.Item>
          <Form.Item label="Motivo" name="motivo" rules={[{ required: true, message: 'Indica el motivo de la solicitud' }]}>
            <Input.TextArea rows={3} placeholder="Ej: Necesito 2 supervisores adicionales para cubrir el nuevo equipo..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={solicitudConfirmOpen}
        onCancel={() => { setSolicitudConfirmOpen(false); setSolicitudPendiente(null); }}
        title="Confirmar Pago"
        footer={[
          <Button key="cancel" onClick={() => { setSolicitudConfirmOpen(false); setSolicitudPendiente(null); }}>Cancelar</Button>,
          <Button key="pay" type="primary" onClick={handlePagarSolicitud}>Simular Pago</Button>,
        ]}
        centered
        width={420}
      >
        {solicitudPendiente && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Paragraph>
              Vas a adquirir <Typography.Text strong>{solicitudPendiente.cantidad} {roleLabel(solicitudPendiente.tipoRol)}</Typography.Text> adicionales.
            </Typography.Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Typography.Text>Precio unitario:</Typography.Text>
                <Typography.Text>{formatCurrency(solicitudPendiente.precioUnitario)}/año</Typography.Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Typography.Text>Cantidad:</Typography.Text>
                <Typography.Text>{solicitudPendiente.cantidad}</Typography.Text>
              </Space>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Typography.Text strong>Total:</Typography.Text>
                <Typography.Text strong>{formatCurrency(solicitudPendiente.total)}</Typography.Text>
              </Space>
            </Space>
            <Alert type="info" showIcon message="Pago simulado" description="En produccion esto conectaria con la pasarela de pago. En modo demo, el pago se registra automaticamente como pagado." />
          </Space>
        )}
      </Modal>

      {confirmationModal}
    </Space>
  );
};

const roleLabel = (rol: string) => roleOptions.find((option) => option.value === rol)?.label || rol;

export default Users;
