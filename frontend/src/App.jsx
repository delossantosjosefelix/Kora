import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import AuthLayout from './layouts/AuthLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CambiarPassword from './pages/CambiarPassword.jsx';
import Usuarios from './pages/Usuarios.jsx';

export default function App() {
  const { cargando, estaAutenticado } = useAuth();

  if (cargando) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route
        path="/cambiar-password"
        element={
          <AppLayout>
            <RequireAuth>
              <CambiarPassword />
            </RequireAuth>
          </AppLayout>
        }
      />
      <Route
        element={
          <AppLayout>
            <RequireAuth />
          </AppLayout>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="usuarios"
          element={
            <RequireAuth roles={['Administrador']}>
              <Usuarios />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
