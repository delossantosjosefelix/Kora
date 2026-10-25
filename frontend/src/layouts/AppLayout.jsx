import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Key, Logout, Menu } from 'reicon-react';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { iniciales } from '../utils/format.js';
import notify from '../utils/notify.js';


export default function AppLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try {
      return window.localStorage.getItem('kora-sidebar-colapsado') === '1';
    } catch {
      return false;
    }
  });
  const menuRef = useRef(null);

  const alternarColapso = () => {
    setSidebarColapsado((valor) => {
      const siguiente = !valor;
      try {
        window.localStorage.setItem('kora-sidebar-colapsado', siguiente ? '1' : '0');
      } catch {
        // El almacenamiento puede no estar disponible; el estado sigue en memoria.
      }
      return siguiente;
    });
  };

  useEffect(() => {
    setSidebarAbierto(false);
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const manejarClick = (evento) => {
      if (menuRef.current && !menuRef.current.contains(evento.target)) {
        setMenuAbierto(false);
      }
    };

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
      }
    };

    document.addEventListener('mousedown', manejarClick);
    document.addEventListener('keydown', manejarTecla);

    return () => {
      document.removeEventListener('mousedown', manejarClick);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [menuAbierto]);

  if (!usuario) return null;

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();

  const manejarSalida = async () => {
    setMenuAbierto(false);
    const confirmado = await notify.confirm({
      titulo: 'Cerrar sesión',
      texto: '¿Deseas salir de Kora?',
      confirmar: 'Sí, cerrar sesión',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    await cerrarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-layout">
      <Sidebar
        abierto={sidebarAbierto}
        colapsado={sidebarColapsado}
        onAlternarColapso={alternarColapso}
        onExpandir={alternarColapso}
        onNavegar={() => setSidebarAbierto(false)}
      />

      {sidebarAbierto ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setSidebarAbierto(false)}
          aria-label="Cerrar menú de navegación"
        />
      ) : null}

      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button topbar-toggle"
              onClick={() => setSidebarAbierto(true)}
              aria-label="Abrir menú de navegación"
              title="Abrir menú"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="topbar-user" ref={menuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setMenuAbierto((valor) => !valor)}
              aria-expanded={menuAbierto}
              aria-haspopup="menu"
              aria-label={`Menú de usuario de ${nombreCompleto}`}
            >
              <span className="avatar avatar--sm">
                {iniciales(usuario.nombre, usuario.apellido)}
              </span>
              <span className="user-menu-text">
                <strong>{nombreCompleto}</strong>
                <span>{usuario.rol}</span>
              </span>
              <ChevronDown
                size={16}
                className={`user-menu-chevron${menuAbierto ? ' user-menu-chevron--open' : ''}`}
              />
            </button>

            {menuAbierto ? (
              <div className="user-menu" role="menu">
                <div className="user-menu-header">
                  <strong>{nombreCompleto}</strong>
                  <span>@{usuario.username}</span>
                </div>

                <Link
                  to="/cambiar-password"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => setMenuAbierto(false)}
                >
                  <Key size={16} />
                  Cambiar contraseña
                </Link>

                <button
                  type="button"
                  className="user-menu-item user-menu-item--danger"
                  role="menuitem"
                  onClick={manejarSalida}
                >
                  <Logout size={16} />
                  Cerrar sesión
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
