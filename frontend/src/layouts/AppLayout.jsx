import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Sidebar from '../components/Sidebar.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import notify from '../utils/notify.js';
import '../styles/layout.css';

export default function AppLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const manejarSalida = () => {
    notify
      .confirm({
        titulo: 'Cerrar sesión',
        texto: '¿Desea salir de Kora?',
        confirmar: 'Sí, cerrar',
        cancelar: 'Cancelar',
      })
      .then((confirmado) => {
        if (confirmado) {
          cerrarSesion();
        }
      });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button type="button" className="topbar-toggle" aria-label="Alternar menú">
            ☰
          </button>
          <div className="topbar-brand">
            <BrandLogo variante="blanco" className="topbar-logo" alt="Kora" />
          </div>
          <div className="topbar-user">
            <span>{usuario.nombre} {usuario.apellido}</span>
            <span className="topbar-role">{usuario.rol}</span>
          </div>
          <button type="button" className="button button--primary" onClick={manejarSalida}>
            Cerrar sesión
          </button>
        </header>
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  );
}
