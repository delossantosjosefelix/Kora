import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import notify from '../utils/notify.js';

export default function Dashboard() {
  const { usuario, esAdministrador, esGerente, esCajero } = useAuth();

  const rolEtiqueta = usuario?.rol || '';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Panel de control</h1>
          <p className="page-subtitle">Bienvenido a Kora, {usuario?.nombre}.</p>
        </div>
      </div>

      <div className="card">
        <h2>Información de sesión</h2>
        <div className="form-grid">
          <div className="form-field">
            <label>Usuario</label>
            <p style={{ margin: 0 }}>{usuario?.username}</p>
          </div>
          <div className="form-field">
            <label>Rol</label>
            <p style={{ margin: 0 }}>{rolEtiqueta}</p>
          </div>
          <div className="form-field">
            <label>Estado</label>
            <p style={{ margin: 0 }}>{usuario?.debe_cambiar_password ? 'Debe cambiar contraseña' : 'Activo'}</p>
          </div>
          <div className="form-field">
            <label>Permisos</label>
            <p style={{ margin: 0 }}>
              {esAdministrador ? 'Administrador' : esGerente ? 'Gerente' : esCajero ? 'Cajero' : usuario?.rol}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Accesos rápidos</h2>
        <div className="form-grid">
          {esAdministrador && (
            <a
              href="/usuarios"
              className="button button--primary"
              onClick={(e) => {
                e.preventDefault();
                // Link handles navigation; kept for clarity
              }}
            >
              Gestionar usuarios
            </a>
          )}
          <a
            href="/cambiar-password"
            className="button"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            Cambiar mi contraseña
          </a>
        </div>
      </div>
    </div>
  );
}
