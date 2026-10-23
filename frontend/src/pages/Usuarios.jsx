import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import notify from '../utils/notify.js';
import { useAuth } from '../hooks/useAuth.js';

export default function Usuarios() {
  const { esAdministrador } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    id: '',
    nombre: '',
    apellido: '',
    username: '',
    rol_id: '',
    password: '',
    confirmarPassword: '',
    activo: true,
  });

  useEffect(() => {
    cargarRoles();
    cargarUsuarios();
  }, []);

  const cargarRoles = async () => {
    const respuesta = await api.get('/roles');
    if (respuesta.ok) {
      setRoles(respuesta.datos.roles);
    } else {
      notify.error(respuesta.datos?.mensaje || 'No se pudieron cargar los roles.');
    }
  };

  const cargarUsuarios = async () => {
    setCargando(true);
    const respuesta = await api.get('/usuarios');
    if (respuesta.ok) {
      setUsuarios(respuesta.datos.usuarios);
    } else {
      notify.error(respuesta.datos?.mensaje || 'No se pudieron cargar los usuarios.');
    }
    setCargando(false);
  };

  const rolNombre = (rolId) => {
    const rol = roles.find((r) => String(r.id) === String(rolId));
    return rol ? rol.nombre : '-';
  };

  const resetForm = () => {
    setEditando(false);
    setForm({
      id: '',
      nombre: '',
      apellido: '',
      username: '',
      rol_id: '',
      password: '',
      confirmarPassword: '',
      activo: true,
    });
  };

  const seleccionarUsuario = (usuario) => {
    setEditando(true);
    setForm({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      username: usuario.username,
      rol_id: usuario.rol_id,
      password: '',
      confirmarPassword: '',
      activo: usuario.activo,
    });
  };

  const manejarGuardar = async (evento) => {
    evento.preventDefault();

    if (!form.nombre.trim() || !form.apellido.trim() || !form.username.trim() || !form.rol_id) {
      notify.error('Complete nombre, apellido, nombre de usuario y rol.');
      return;
    }

    if (!editando && (!form.password || form.password.length < 8)) {
      notify.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.password && form.password !== form.confirmarPassword) {
      notify.error('Las contraseñas no coinciden.');
      return;
    }

    const cuerpo = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      username: form.username.trim(),
      rol_id: Number(form.rol_id),
      activo: form.activo,
    };

    if (form.password) {
      cuerpo.password = form.password;
    }

    const respuesta = editando
      ? await api.patch(`/usuarios/${form.id}`, cuerpo)
      : await api.post('/usuarios', cuerpo);

    if (respuesta.ok) {
      notify.success(respuesta.datos?.mensaje || editando ? 'Usuario actualizado.' : 'Usuario creado.');
      resetForm();
      cargarUsuarios();
    } else {
      notify.error(respuesta.datos?.mensaje || 'No se pudo guardar el usuario.');
    }
  };

  const alternarActivo = async (usuario) => {
    const confirmado = await notify.confirm({
      titulo: usuario.activo ? 'Desactivar usuario' : 'Activar usuario',
      texto: usuario.activo
        ? '¿Desea desactivar este usuario? No podrá iniciar sesión.'
        : '¿Desea activar este usuario?',
    });
    if (!confirmado) return;

    const respuesta = await api.patch(`/usuarios/${usuario.id}`, { activo: !usuario.activo });
    if (respuesta.ok) {
      notify.success(usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.');
      cargarUsuarios();
    } else {
      notify.error(respuesta.datos?.mensaje || 'No se pudo cambiar el estado del usuario.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="page-subtitle">Gestión de acceso al sistema. Solo Administrador.</p>
        </div>
      </div>

      <div className="card">
        <h2>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <form onSubmit={manejarGuardar} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label>Nombre</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Apellido</label>
              <input
                required
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Nombre de usuario</label>
              <input
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Rol</label>
              <select
                required
                value={form.rol_id}
                onChange={(e) => setForm({ ...form, rol_id: e.target.value })}
              >
                <option value="">Seleccione un rol</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
            {!editando && (
              <div className="form-field">
                <label>Contraseña</label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            {editando && (
              <div className="form-field">
                <label>Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            {editando && (
              <div className="form-field">
                <label>Confirmar contraseña nueva</label>
                <input
                  type="password"
                  minLength={8}
                  value={form.confirmarPassword}
                  onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                />
              </div>
            )}
            {editando && (
              <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                <input
                  id="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                <label htmlFor="activo" style={{ margin: 0, fontWeight: 600 }}>
                  Usuario activo
                </label>
              </div>
            )}
          </div>
          <div className="form-field-actions">
            <button type="submit" className="button button--primary">
              {editando ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button
              type="button"
              className="button"
              onClick={resetForm}
              disabled={cargando}
            >
              {editando ? 'Cancelar' : 'Limpiar'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Contraseña</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6}>Cargando usuarios...</td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay usuarios registrados.</td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.username}</td>
                  <td>{usuario.nombre} {usuario.apellido}</td>
                  <td>{rolNombre(usuario.rol_id)}</td>
                  <td>
                    <span className={`badge ${usuario.activo ? 'badge--ok' : 'badge--error'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${usuario.debe_cambiar_password ? 'badge--info' : 'badge--ok'}`}>
                      {usuario.debe_cambiar_password ? 'Pendiente' : 'Listo'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button type="button" onClick={() => seleccionarUsuario(usuario)} disabled={cargando}>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => alternarActivo(usuario)}
                        disabled={cargando}
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
