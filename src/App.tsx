import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthenticatedLayout } from './layouts/AuthenticatedLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import RuleEngine from './pages/RuleEngine';
import KYC from './pages/KYC';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import MotorHistorial from './pages/MotorHistorial';
import AdminGeneral from './pages/AdminGeneral';
import AdminEmpresa from './pages/AdminEmpresa';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/motor/historial" element={<MotorHistorial />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['EMPRESAS_VER']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/admin-general" element={<AdminGeneral />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['LICENCIAS_VER']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/admin-empresa" element={<AdminEmpresa />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['REGLAS_VER']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/rules" element={<Navigate to="/rule-engine" replace />} />
            <Route path="/rule-engine" element={<RuleEngine />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute requiredPermissions={['USUARIOS_VER']} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Acceso No Autorizado</h1>
              <p className="mt-2 text-gray-600">No tienes permisos para acceder a esta página.</p>
            </div>
          </div>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
