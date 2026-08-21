import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertOutlined,
  AuditOutlined,
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  ApiOutlined,
  CloudSyncOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Drawer, Grid, Layout, Menu, Space, Typography } from 'antd';
import { useAuthStore } from '../store';
import { RegulaIcon } from '../components/common';
import { alertsApi } from '../api';

interface NavigationItem {
  key: string;
  name: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: boolean;
}

const { Header, Sider, Content } = Layout;

const operationalNavigation: NavigationItem[] = [
  { key: '/dashboard', name: 'Tablero', icon: <BarChartOutlined />, permission: 'ALERTAS_VER' },
  { key: '/alerts', name: 'Alertas', icon: <AlertOutlined />, permission: 'ALERTAS_VER', badge: true },
  { key: '/rule-engine', name: 'Motor de Reglas', icon: <AuditOutlined />, permission: 'REGLAS_VER' },
  { key: '/listas-control', name: 'Listas de Control', icon: <SafetyCertificateOutlined />, permission: 'CATALOGOS_VER' },
  { key: '/motor/historial', name: 'Motor Historial', icon: <HistoryOutlined />, permission: 'AUDITORIA_VER' },
  { key: '/kyc', name: 'KYC', icon: <SearchOutlined />, permission: 'ALERTAS_VER' },
  { key: '/reports', name: 'Reportes', icon: <FileTextOutlined />, permission: 'REPORTES_VER' },
  { key: '/users', name: 'Usuarios', icon: <TeamOutlined />, permission: 'USUARIOS_VER' },
  { key: '/profile', name: 'Mi Perfil', icon: <UserOutlined /> },
];

const adminEmpresaNavigation: NavigationItem[] = [
  { key: '/admin-empresa', name: 'Tablero', icon: <BarChartOutlined />, permission: 'LICENCIAS_VER' },
  { key: '/admin-empresa/licencia-pagos', name: 'Licencia y Pagos', icon: <CreditCardOutlined />, permission: 'LICENCIAS_VER' },
  { key: '/admin-empresa/consumo', name: 'Consumo', icon: <DatabaseOutlined />, permission: 'LICENCIAS_VER' },
  { key: '/admin-empresa/apis', name: 'APIs y Conectividad', icon: <ApiOutlined />, permission: 'LICENCIAS_VER' },
  { key: '/admin-empresa/configuracion', name: 'Configuración Local', icon: <CloudSyncOutlined />, permission: 'LICENCIAS_VER' },
  { key: '/listas-control', name: 'Listas de Control', icon: <SafetyCertificateOutlined />, permission: 'CATALOGOS_VER' },
  { key: '/admin-empresa/auditoria', name: 'Auditoría Local', icon: <HistoryOutlined />, permission: 'AUDITORIA_VER' },
  { key: '/users', name: 'Usuarios', icon: <TeamOutlined />, permission: 'USUARIOS_VER' },
  { key: '/profile', name: 'Mi Perfil', icon: <UserOutlined /> },
];

export const AuthenticatedLayout = () => {
  const screens = Grid.useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [unassignedAlerts, setUnassignedAlerts] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();

  const baseNavigation = user?.rol === 'ADMINISTRADOR'
    ? adminEmpresaNavigation
    : operationalNavigation;

  const filteredNavigation = useMemo(
    () => baseNavigation.filter((item) => !item.permission || hasPermission(item.permission as never)),
    [baseNavigation, hasPermission]
  );

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/alerts')) return '/alerts';
    if (location.pathname === '/rules') return '/rule-engine';
    const sorted = [...filteredNavigation].sort((a, b) => b.key.length - a.key.length);
    return sorted.find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key || location.pathname;
  }, [filteredNavigation, location.pathname]);

  const selectedItemName = filteredNavigation.find((item) => item.key === selectedKey)?.name || 'Tablero';
  const homePath = user?.rol === 'ADMINISTRADOR'
    ? '/admin-empresa'
    : '/dashboard';

  const menuItems = filteredNavigation.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <span>{item.name}</span>
        {item.badge && unassignedAlerts > 0 && <Badge count={unassignedAlerts} size="small" />}
      </Space>
    ),
  }));

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let active = true;
    const loadUnassignedAlerts = async () => {
      try {
        const count = await alertsApi.countUnassigned();
        if (active) setUnassignedAlerts(count);
      } catch {
        if (active) setUnassignedAlerts(0);
      }
    };
    loadUnassignedAlerts();
    const interval = window.setInterval(loadUnassignedAlerts, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  const brand = (
    <Link to={homePath} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, color: '#fff' }}>
      <RegulaIcon size={36} />
      {!collapsed && (
        <div style={{ minWidth: 0 }}>
          <Typography.Text style={{ color: '#fff', display: 'block', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>Regula</Typography.Text>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Plataforma De Riesgo</Typography.Text>
        </div>
      )}
    </Link>
  );

  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={({ key }) => {
        navigate(String(key));
        setDrawerOpen(false);
      }}
      style={{ borderInlineEnd: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={280}
        collapsedWidth={88}
        breakpoint="lg"
        style={{ position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0, zIndex: 100, overflow: 'auto', display: screens.lg ? 'block' : 'none' }}
      >
        <div style={{ padding: collapsed ? '20px 18px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
          {brand}
          {!collapsed && <Button type="text" icon={<MenuFoldOutlined />} onClick={() => setCollapsed(true)} style={{ color: '#fff' }} />}
          {collapsed && <Button type="text" icon={<MenuUnfoldOutlined />} onClick={() => setCollapsed(false)} style={{ color: '#fff' }} />}
        </div>
        {menu}
        <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 10, color: '#fff' }}>
            <Space>
              <Avatar style={{ backgroundColor: '#de7426' }}>{userInitial}</Avatar>
              {!collapsed && (
                <div style={{ maxWidth: 160 }}>
                  <Typography.Text ellipsis style={{ color: '#fff', display: 'block', fontSize: 12, fontWeight: 700 }}>{user?.email}</Typography.Text>
                  <Typography.Text ellipsis style={{ color: 'rgba(255,255,255,0.45)', display: 'block', fontSize: 11 }}>{user?.rol}</Typography.Text>
                </div>
              )}
            </Space>
            {!collapsed && <SettingOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
          </Link>
        </div>
      </Sider>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="left"
        width={280}
        styles={{ body: { padding: 0, background: '#4e616e' }, header: { display: 'none' } }}
      >
        <div style={{ padding: 24 }}>{brand}</div>
        {menu}
      </Drawer>

      <Layout style={{ marginInlineStart: screens.lg ? (collapsed ? 88 : 280) : 0, transition: 'margin 0.2s ease' }}>
        <Header style={{ position: 'sticky', top: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 24, borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            {!screens.lg && <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />}
            <Typography.Text type="secondary">Plataforma De Monitoreo</Typography.Text>
            <Typography.Text strong>{selectedItemName}</Typography.Text>
          </Space>
          <Space>
            <Badge dot={unassignedAlerts > 0}>
              <AlertOutlined style={{ fontSize: 18, color: '#4e616e' }} />
            </Badge>
            <Avatar size="small" style={{ backgroundColor: '#de7426' }}>{userInitial}</Avatar>
          </Space>
        </Header>
        <Content style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
