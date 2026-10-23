import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { NAV_ITEMS, ITEM_SALIDA } from '../navigation.js';

const enlaceActivo = ({ isActive, className }) =>
  `${className ?? ''} sidebar-item ${isActive ? 'sidebar-item--active' : ''}`;

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(usuario.rol));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-text">Kora</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={enlaceActivo}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              <item.icon size={18} />
            </span>
            <span className="sidebar-item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{usuario.nombre} {usuario.apellido}</div>
          <div className="sidebar-user-role">{usuario.rol}</div>
        </div>
        <button
          type="button"
          className="sidebar-item sidebar-item--danger"
          onClick={cerrarSesion}
          aria-label="Cerrar sesión"
        >
          <span className="sidebar-item-icon" aria-hidden="true">
            <LogOut size={18} />
          </span>
          <span className="sidebar-item-label">{ITEM_SALIDA.label}</span>
        </button>
      </div>
    </aside>
  );
}
