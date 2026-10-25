import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'reicon-react';
import BrandLogo from './BrandLogo.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { NAV_ITEMS } from '../navigation.js';

const claseEnlace = ({ isActive }) =>
  `sidebar-item${isActive ? ' sidebar-item--active' : ''}`;

const claseSubenlace = ({ isActive }) =>
  `sidebar-subitem${isActive ? ' sidebar-subitem--active' : ''}`;

function visiblesPara(items, rol) {
  return items
    .filter((item) => item.roles.includes(rol))
    .map((item) =>
      item.hijos
        ? { ...item, hijos: item.hijos.filter((hijo) => hijo.roles.includes(rol)) }
        : item,
    )
    .filter((item) => !item.hijos || item.hijos.length > 0);
}

function GrupoDesplegable({ item, onNavegar, colapsado, onExpandir }) {
  const { pathname } = useLocation();
  const contieneActivo = item.hijos.some((hijo) => pathname.startsWith(hijo.path));
  const [abiertoManual, setAbiertoManual] = useState(null);
  const abierto = !colapsado && (abiertoManual ?? contieneActivo);
  const idPanel = `submenu-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

  const alternar = () => {
    if (colapsado) {
      setAbiertoManual(true);
      onExpandir();
      return;
    }
    setAbiertoManual(!abierto);
  };

  return (
    <div className="sidebar-group">
      <button
        type="button"
        className={`sidebar-item sidebar-item--toggle${contieneActivo ? ' sidebar-item--parent-active' : ''}`}
        aria-expanded={abierto}
        aria-controls={idPanel}
        title={colapsado ? item.label : undefined}
        onClick={alternar}
      >
        <span className="sidebar-item-icon" aria-hidden="true">
          <item.icon size={20} />
        </span>
        <span className="sidebar-item-label">{item.label}</span>
        <ChevronDown
          size={16}
          className={`sidebar-chevron${abierto ? ' sidebar-chevron--open' : ''}`}
        />
      </button>

      <div
        id={idPanel}
        className={`sidebar-submenu${abierto ? ' sidebar-submenu--open' : ''}`}
      >
        <div className="sidebar-submenu-inner">
          {item.hijos.map((hijo) => (
            <NavLink
              key={hijo.path}
              to={hijo.path}
              className={claseSubenlace}
              onClick={onNavegar}
              tabIndex={abierto ? 0 : -1}
            >
              {hijo.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  abierto = false,
  colapsado = false,
  onAlternarColapso = () => {},
  onExpandir = () => {},
  onNavegar,
}) {
  const { usuario } = useAuth();
  const toggleColapso = onAlternarColapso || onExpandir;

  if (!usuario) return null;

  const items = visiblesPara(NAV_ITEMS, usuario.rol);

  return (
    <aside
      className={`sidebar${abierto ? ' sidebar--abierto' : ''}${colapsado ? ' sidebar--colapsado' : ''}`}
    >
      <div className="sidebar-brand">
        <button
          type="button"
          className="sidebar-brand-btn"
          onClick={toggleColapso}
          aria-label={colapsado ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          aria-expanded={!colapsado}
          title={colapsado ? 'Clic para expandir menú lateral' : 'Clic para contraer menú lateral'}
        >
          <BrandLogo variante="negro" className="sidebar-logo" alt="Kora" />
          <span className="sidebar-brand-name">Kora</span>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {items.map((item) =>
          item.hijos ? (
            <GrupoDesplegable
              key={item.label}
              item={item}
              onNavegar={onNavegar}
              colapsado={colapsado}
              onExpandir={onExpandir}
            />
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={claseEnlace}
              onClick={onNavegar}
              title={colapsado ? item.label : undefined}
            >
              <span className="sidebar-item-icon" aria-hidden="true">
                <item.icon size={20} />
              </span>
              <span className="sidebar-item-label">{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>
    </aside>
  );
}
