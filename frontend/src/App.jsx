import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader } from 'reicon-react';
import { useAuth } from './hooks/useAuth.js';
import AuthLayout from './layouts/AuthLayout.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Catalogo from './pages/Catalogo.jsx';
import CambiarPassword from './pages/CambiarPassword.jsx';
import Usuarios from './pages/Usuarios.jsx';

function destinoInicial(usuario) {
  return usuario?.debe_cambiar_password ? '/cambiar-password' : '/dashboard';
}

export default function App() {
  const { cargando, estaAutenticado, usuario } = useAuth();

  if (cargando) {
    return (
      <div className="app-loading">
        <Loader size={18} className="spin" />
        <span>Cargando Kora...</span>
      </div>
    );
  }

  const inicio = destinoInicial(usuario);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          estaAutenticado ? (
            <Navigate to={inicio} replace />
          ) : (
            <AuthLayout>
              <Login />
            </AuthLayout>
          )
        }
      />

      <Route
        path="/cambiar-password"
        element={
          !estaAutenticado ? (
            <Navigate to="/login" replace />
          ) : (
            <AuthLayout>
              <CambiarPassword />
            </AuthLayout>
          )
        }
      />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={inicio} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route
            path="/usuarios"
            element={
              <RequireAuth roles={['Administrador', 'Gerente']}>
                <Usuarios />
              </RequireAuth>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={estaAutenticado ? inicio : '/login'} replace />} />
    </Routes>
  );
}
