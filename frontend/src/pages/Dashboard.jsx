import { Link } from 'react-router-dom';
import { ArrowRight, Key, Users } from 'reicon-react';
import { useAuth } from '../hooks/useAuth.js';
import {
  claseRol,
  formatearFecha,
  formatearFechaHora,
  iniciales,
} from '../utils/format.js';

export default function Dashboard() {
  const { usuario, esAdministrador, esGerente } = useAuth();
  const puedeGestionarUsuarios = esAdministrador || esGerente;
  const nombreCompleto = `${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`.trim();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Hola, {usuario?.nombre}</h1>
          <p className="page-subtitle">Este es el resumen de tu cuenta en Kora.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card profile-card">
          <div className="profile-head">
            <span className="avatar">{iniciales(usuario?.nombre, usuario?.apellido)}</span>
            <div>
              <h2>{nombreCompleto}</h2>
              <p>@{usuario?.username}</p>
              <div className="profile-meta">
                <span className={`badge ${claseRol(usuario?.rol)}`}>{usuario?.rol}</span>
                <span className={`badge ${usuario?.activo === false ? 'badge--error' : 'badge--ok'}`}>
                  {usuario?.activo === false ? 'Cuenta inactiva' : 'Cuenta activa'}
                </span>
              </div>
            </div>
          </div>

          <dl className="profile-stats">
            <div className="profile-stat">
              <dt>Miembro desde</dt>
              <dd>{formatearFecha(usuario?.created_at)}</dd>
            </div>
            <div className="profile-stat">
              <dt>Último acceso</dt>
              <dd>{formatearFechaHora(usuario?.ultimo_login)}</dd>
            </div>
            <div className="profile-stat">
              <dt>Contraseña</dt>
              <dd>
                {usuario?.debe_cambiar_password ? 'Cambio pendiente' : 'Actualizada'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Accesos rápidos</h2>
              <p>Atajos a las tareas disponibles para tu rol.</p>
            </div>
          </div>
          <div className="card-body action-list">
            {puedeGestionarUsuarios ? (
              <Link to="/usuarios" className="action-card">
                <span className="action-card-icon">
                  <Users size={18} />
                </span>
                <div>
                  <strong>Gestionar usuarios</strong>
                  <span>Altas, roles y estado de acceso</span>
                </div>
                <ArrowRight size={16} className="action-card-chevron" />
              </Link>
            ) : null}

            <Link to="/cambiar-password" className="action-card">
              <span className="action-card-icon">
                <Key size={18} />
              </span>
              <div>
                <strong>Cambiar mi contraseña</strong>
                <span>Actualiza tu clave de acceso</span>
              </div>
              <ArrowRight size={16} className="action-card-chevron" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
