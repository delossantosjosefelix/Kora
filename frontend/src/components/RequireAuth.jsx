import { useAuth } from '../hooks/useAuth.js';

export function RequireAuth({ children, roles }) {
  const { usuario, cargando, estaAutenticado } = useAuth();

  if (cargando) {
    return (
      <div className="sin-permiso" style={{ textAlign: 'center', padding: '48px' }}>
        Cargando sesión...
      </div>
    );
  }

  if (!estaAutenticado) {
    return null;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="sin-permiso" style={{ textAlign: 'center', padding: '48px' }}>
        <h2 className="sin-permiso-titulo">Sin permisos</h2>
        <p>Su rol ({usuario.rol}) no puede acceder a esta sección.</p>
      </div>
    );
  }

  return children;
}
