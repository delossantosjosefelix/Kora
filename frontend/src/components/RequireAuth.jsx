import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader, ShieldAlert } from 'reicon-react';
import { useAuth } from '../hooks/useAuth.js';

export function RequireAuth({ children, roles }) {
  const { usuario, cargando, estaAutenticado } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="app-loading">
        <Loader size={18} className="spin" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (usuario.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="state-card-icon">
            <ShieldAlert size={26} />
          </div>
          <h1>Sin permisos</h1>
          <p>Tu rol actual ({usuario.rol}) no puede acceder a esta sección.</p>
          <Link to="/dashboard" className="button button--primary">
            <ArrowLeft size={16} />
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
}
