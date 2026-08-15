import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Card, Result, Spin } from 'antd';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Alerts = lazy(() => import('./pages/Alerts'));
const RuleEngine = lazy(() => import('./pages/RuleEngine'));
const KYC = lazy(() => import('./pages/KYC'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const MotorHistorial = lazy(() => import('./pages/MotorHistorial'));
const AdminEmpresa = lazy(() => import('./pages/AdminEmpresa'));

const PageLoader = () => (
  <Card style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
    <Spin tip="Cargando modulo..." />
  </Card>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute blockedRoles={['ADMINISTRADOR']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/:id/resolver" element={<Alerts />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/motor/historial" element={<MotorHistorial />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['LICENCIAS_VER']} requiredRoles={['ADMINISTRADOR']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/admin-empresa" element={<AdminEmpresa />} />
            <Route path="/admin-empresa/:section" element={<AdminEmpresa />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['REGLAS_VER']} blockedRoles={['ADMINISTRADOR']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/rules" element={<Navigate to="/rule-engine" replace />} />
            <Route path="/rule-engine" element={<RuleEngine />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['USUARIOS_VER']} requiredRoles={['ADMINISTRADOR']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>

          <Route path="/unauthorized" element={<Result status="403" title="Acceso No Autorizado" subTitle="No tienes permisos para acceder a esta pagina." />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
