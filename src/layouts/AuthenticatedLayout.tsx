import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Search,
  Users,
  Menu,
  X,
  Settings,
  User,
  History,
  ChevronsLeft,
  ChevronsRight,
  Workflow,
} from 'lucide-react';
import { useAuthStore } from '../store';
import { cn } from '../utils';
import { RegulaIcon } from '../components/common';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'ANALISTA', 'AUDITOR'] },
  { name: 'Alertas', href: '/alerts', icon: AlertTriangle, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'ANALISTA', 'AUDITOR'], badge: 24 },
  { name: 'Motor de Reglas', href: '/rule-engine', icon: Workflow, roles: ['ADMINISTRADOR', 'SUPERVISOR'] },
  { name: 'Motor Historial', href: '/motor/historial', icon: History, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR'] },
  { name: 'KYC', href: '/kyc', icon: Search, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'ANALISTA', 'AUDITOR'] },
  { name: 'Reportes', href: '/reports', icon: FileText, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'ANALISTA', 'AUDITOR'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['ADMINISTRADOR'] },
  { name: 'Mi Perfil', href: '/profile', icon: User, roles: ['ADMINISTRADOR', 'SUPERVISOR', 'ANALISTA', 'AUDITOR'] },
];

export const AuthenticatedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const location = useLocation();
  const { user, hasRole } = useAuthStore();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.some((role) => hasRole(role as 'ADMINISTRADOR' | 'SUPERVISOR' | 'ANALISTA' | 'AUDITOR'))
  );

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-[280px] flex-col bg-secondary">
          <div className="px-6 mb-10 flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <RegulaIcon className="w-10 h-10" />
              <div>
                <h1 className="text-headline-sm font-bold text-white leading-tight">Regula</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/40 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 transition-colors duration-200',
                    isActive
                      ? 'bg-primary-container text-on-primary-container border-l-4 border-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className={cn('text-body-md', isActive ? 'font-semibold' : '')}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="ml-auto bg-critical text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-6 pt-6 border-t border-white/10">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
                {getUserInitials()}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">{user?.email}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.rol}</p>
              </div>
              <Settings className="w-4 h-4 text-white/40 ml-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={cn('hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-200', collapsed ? 'lg:w-[88px]' : 'lg:w-[280px]')}>
        <div className="flex flex-col flex-grow bg-secondary py-6">
          <div className={cn('mb-10 flex px-4', collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between gap-3 px-6')}>
            <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}>
            <RegulaIcon className="h-10 w-10 shrink-0" />
            {!collapsed && <div>
              <h1 className="text-headline-sm font-bold text-white leading-tight">Regula</h1>
            </div>}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-white"
              title={collapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4 shrink-0" /> : <ChevronsLeft className="h-4 w-4 shrink-0" />}
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href === '/rule-engine' && location.pathname === '/rules');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 transition-colors duration-200',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-container text-on-primary-container border-l-4 border-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {!collapsed && <span className={cn('text-body-md', isActive ? 'font-semibold' : '')}>
                    {item.name}
                  </span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-critical text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto px-4 pt-6 border-t border-white/10">
            <Link
              to="/profile"
              title={collapsed ? user?.email : undefined}
              className={cn('flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10', collapsed && 'justify-center')}
            >
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
                {getUserInitials()}
              </div>
              {!collapsed && <div className="overflow-hidden">
                <p className="text-white text-xs font-bold truncate">{user?.email}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.rol}</p>
              </div>}
              {!collapsed && <Settings className="w-4 h-4 text-white/40 ml-auto" />}
            </Link>
          </div>
        </div>
      </div>

      {/* Topbar */}
      <header className={cn('fixed top-0 right-0 z-40 hidden h-16 items-center justify-between border-b border-surface-container-highest bg-white px-gutter transition-all duration-200 lg:flex', collapsed ? 'left-[88px]' : 'left-[280px]')}>
        <div className="hidden md:flex items-center gap-4">
          <span className="text-secondary/40 font-medium">Monitoring Platform</span>
          <span className="text-secondary/20">/</span>
          <span className="text-secondary font-bold">Real-time Dashboard</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-l border-surface-container-highest pl-6">
            <button className="relative text-secondary/60 hover:text-secondary transition-colors">
              <AlertTriangle className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-critical rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile topbar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center h-16 bg-white border-b border-surface-container-highest">
        <button
          onClick={() => setSidebarOpen(true)}
          className="px-4 text-secondary/60 hover:text-secondary"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center ml-2">
          <RegulaIcon className="w-6 h-6" />
          <span className="ml-2 text-lg font-semibold text-secondary">Regula</span>
        </div>
      </div>

      {/* Main content */}
      <div className={cn('transition-all duration-200 lg:pt-16', collapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]')}>
        <main className="p-gutter min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
