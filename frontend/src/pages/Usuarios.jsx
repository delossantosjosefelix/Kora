import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AngleLeft,
  AngleRight,
  AnglesLeft,
  AnglesRight,
  CheckCircle,
  Edit,
  Eye,
  InfoCircle,
  Loader,
  Lock,
  Plus,
  Search,
  Trash,
  Users as UsersIcon,
  XCircle,
} from 'reicon-react';
import Modal from '../components/ui/Modal.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import CustomSelect from '../components/ui/CustomSelect.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import notify from '../utils/notify.js';
import { formatearFecha, formatearFechaHora, iniciales } from '../utils/format.js';

const FORMULARIO_VACIO = {
  nombre: '',
  apellido: '',
  username: '',
  rol_id: '',
  password: '',
  confirmarPassword: '',
  activo: true,
};

const POR_PAGINA = 8;

function mensajeError(respuesta, respaldo) {
  return respuesta?.datos?.mensaje || respaldo;
}

export default function Usuarios() {
  const { usuario: sesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [tabEstado, setTabEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const [respuestaRoles, respuestaUsuarios] = await Promise.all([
        api.get('/roles'),
        api.get('/usuarios'),
      ]);

      if (!respuestaRoles.ok) {
        throw new Error(
          mensajeError(respuestaRoles, 'No se pudieron cargar los roles.'),
        );
      }

      if (!respuestaUsuarios.ok) {
        throw new Error(
          mensajeError(respuestaUsuarios, 'No se pudieron cargar los usuarios.'),
        );
      }

      setRoles(respuestaRoles.datos?.roles ?? []);
      setUsuarios(respuestaUsuarios.datos?.usuarios ?? []);
    } catch (error) {
      setErrorCarga(error.message || 'No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const conteoTodos = usuarios.length;
  const conteoActivos = useMemo(
    () => usuarios.filter((u) => u.activo).length,
    [usuarios],
  );
  const conteoInactivos = useMemo(
    () => usuarios.filter((u) => !u.activo).length,
    [usuarios],
  );

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideTab =
        tabEstado === 'todos' ||
        (tabEstado === 'activos' && usuario.activo) ||
        (tabEstado === 'inactivos' && !usuario.activo);
      const coincideRol =
        !filtroRol || String(usuario.rol_id) === String(filtroRol);
      const contenido = `${usuario.nombre} ${usuario.apellido} ${usuario.username}`.toLowerCase();
      const coincideTexto = !texto || contenido.includes(texto);
      return coincideTab && coincideRol && coincideTexto;
    });
  }, [usuarios, busqueda, filtroRol, tabEstado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / POR_PAGINA),
  );
  const paginaValida = Math.min(pagina, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaValida - 1) * POR_PAGINA;
    return usuariosFiltrados.slice(inicio, inicio + POR_PAGINA);
  }, [usuariosFiltrados, paginaValida]);

  const hayFiltros = Boolean(
    busqueda.trim() || filtroRol || tabEstado !== 'todos',
  );

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      ...FORMULARIO_VACIO,
      rol_id: roles.length === 1 ? String(roles[0].id) : '',
    });
    setErrores({});
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setForm({
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
      username: usuario.username ?? '',
      rol_id: String(usuario.rol_id ?? ''),
      password: '',
      confirmarPassword: '',
      activo: Boolean(usuario.activo),
    });
    setErrores({});
    setErrorForm('');
    setModalAbierto(true);
  };

  const cerrarModal = useCallback(() => {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
    setErrores({});
    setErrorForm('');
  }, [guardando]);

  const actualizarCampo = (campo) => (evento) => {
    const valor =
      evento.target.type === 'checkbox'
        ? evento.target.checked
        : evento.target.value;

    setForm((anterior) => ({ ...anterior, [campo]: valor }));
    setErrores((anterior) => ({ ...anterior, [campo]: '' }));
    setErrorForm('');
  };

  const manejarGuardar = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.';
    if (!form.apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio.';
    }
    if (!form.username.trim()) {
      nuevosErrores.username = 'El nombre de usuario es obligatorio.';
    }
    if (!form.rol_id) nuevosErrores.rol_id = 'Selecciona un rol.';

    if (!editando && !form.password) {
      nuevosErrores.password = 'La contraseña inicial es obligatoria.';
    } else if (form.password && form.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (form.password && form.password !== form.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden.';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorForm('');

    try {
      const cuerpo = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        username: form.username.trim(),
        rol_id: Number(form.rol_id),
      };

      if (editando) {
        cuerpo.activo = form.activo;
      }

      if (form.password) {
        cuerpo.password = form.password;
      }

      const respuesta = editando
        ? await api.patch(`/usuarios/${editando.id}`, cuerpo)
        : await api.post('/usuarios', cuerpo);

      if (!respuesta.ok) {
        setErrorForm(
          mensajeError(respuesta, 'No se pudo guardar el usuario.'),
        );
        return;
      }

      notify.success(
        mensajeError(
          respuesta,
          editando ? 'Usuario actualizado.' : 'Usuario creado.',
        ),
      );

      setModalAbierto(false);
      setEditando(null);
      await cargarDatos();
    } catch {
      setErrorForm('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (usuario) => {
    const confirmado = await notify.confirm({
      titulo: usuario.activo ? 'Desactivar usuario' : 'Activar usuario',
      texto: usuario.activo
        ? 'La persona no podrá iniciar sesión mientras la cuenta esté desactivada.'
        : 'La persona podrá iniciar sesión nuevamente.',
      confirmar: usuario.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelar: 'Cancelar',
      peligro: usuario.activo,
    });

    if (!confirmado) return;

    setProcesandoId(usuario.id);

    try {
      const respuesta = await api.patch(`/usuarios/${usuario.id}`, {
        activo: !usuario.activo,
      });

      if (!respuesta.ok) {
        notify.error(
          mensajeError(respuesta, 'No se pudo cambiar el estado del usuario.'),
        );
        return;
      }

      notify.success(
        usuario.activo ? 'Usuario desactivado.' : 'Usuario activado.',
      );
      await cargarDatos();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (usuario) => {
    const confirmado = await notify.confirm({
      titulo: 'Eliminar usuario',
      texto: `¿Deseas eliminar definitivamente a ${usuario.nombre} ${usuario.apellido} (@${usuario.username})? Si tiene historial de ventas o movimientos, el sistema no permitirá borrarlo y deberás desactivarlo.`,
      confirmar: 'Sí, eliminar',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    setProcesandoId(usuario.id);

    try {
      const respuesta = await api.delete(`/usuarios/${usuario.id}`);

      if (!respuesta.ok) {
        notify.error(
          mensajeError(respuesta, 'No se pudo eliminar el usuario.'),
        );
        return;
      }

      notify.success('Usuario eliminado permanentemente.');
      await cargarDatos();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const esPropioUsuario = (usuario) =>
    String(usuario.id) === String(sesion?.id);

  const esAdminMaestro = (usuario) =>
    Boolean(
      usuario?.es_sistema ||
        usuario?.username?.toLowerCase() === 'admin',
    );

  const editandoPropioUsuario = Boolean(
    editando && String(editando.id) === String(sesion?.id),
  );

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Usuarios</h1>
        <button
          type="button"
          className="button--kora-primary"
          onClick={abrirCrear}
          disabled={cargando || roles.length === 0}
        >
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      <div className="users-bar">
        <div className="users-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tabEstado === 'todos'}
            className={`users-tab${tabEstado === 'todos' ? ' users-tab--active' : ''}`}
            onClick={() => {
              setTabEstado('todos');
              setPagina(1);
            }}
          >
            Todos los miembros
            <span className="users-tab-count">{conteoTodos}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabEstado === 'activos'}
            className={`users-tab${tabEstado === 'activos' ? ' users-tab--active' : ''}`}
            onClick={() => {
              setTabEstado('activos');
              setPagina(1);
            }}
          >
            Activos
            <span className="users-tab-count">{conteoActivos}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tabEstado === 'inactivos'}
            className={`users-tab${tabEstado === 'inactivos' ? ' users-tab--active' : ''}`}
            onClick={() => {
              setTabEstado('inactivos');
              setPagina(1);
            }}
          >
            Inactivos
            <span className="users-tab-count">{conteoInactivos}</span>
          </button>
        </div>

        <div className="users-controls">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="search"
              className="search-box-input"
              placeholder="Buscar Usuario..."
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value);
                setPagina(1);
              }}
              aria-label="Buscar usuarios"
            />
          </div>

          {roles.length > 1 ? (
            <CustomSelect
              valor={filtroRol}
              onChange={(nuevo) => {
                setFiltroRol(nuevo);
                setPagina(1);
              }}
              placeholder="Todos Los Roles"
              opciones={[
                { valor: '', etiqueta: 'Todos Los Roles' },
                ...roles.map((r) => ({
                  valor: String(r.id),
                  etiqueta: r.nombre,
                })),
              ]}
              aria-label="Filtrar por rol"
            />
          ) : null}
        </div>
      </div>

      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table users-table--compact">
            <thead>
              <tr>
                <th>Nombre / Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Contraseña</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <UsersIcon size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'Aún no hay usuarios'}
                      </h3>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar" aria-hidden="true">
                          {iniciales(usuario.nombre, usuario.apellido)}
                        </span>
                        <div>
                          <div className="user-name">
                            {usuario.nombre} {usuario.apellido}
                            {esAdminMaestro(usuario) ? (
                              <span
                                className="system-lock-icon"
                                title="Cuenta de seguridad del sistema"
                                aria-label="Cuenta de seguridad del sistema"
                              >
                                <Lock size={13} />
                              </span>
                            ) : null}
                          </div>
                          <span className="user-handle">
                            @{usuario.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="user-role-text">
                        {usuario.rol}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-status-text ${usuario.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-password-text ${usuario.debe_cambiar_password ? 'user-password-text--warning' : 'user-password-text--ok'}`}
                      >
                        {usuario.debe_cambiar_password ? 'Temporal' : 'Al día'}
                      </span>
                    </td>
                    <td className="table-muted">
                      {formatearFecha(usuario.ultimo_login)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setUsuarioDetalle(usuario)}
                          aria-label={`Ver detalles de ${usuario.nombre} ${usuario.apellido}`}
                          title="Ver detalles"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => abrirEditar(usuario)}
                          disabled={procesandoId === usuario.id}
                          aria-label={`Editar a ${usuario.nombre} ${usuario.apellido}`}
                          title="Editar usuario"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          type="button"
                          className={`icon-button${usuario.activo ? ' icon-button--danger' : ''}`}
                          onClick={() => alternarActivo(usuario)}
                          disabled={
                            procesandoId === usuario.id ||
                            esPropioUsuario(usuario) ||
                            esAdminMaestro(usuario)
                          }
                          aria-label={
                            usuario.activo
                              ? `Desactivar a ${usuario.nombre} ${usuario.apellido}`
                              : `Activar a ${usuario.nombre} ${usuario.apellido}`
                          }
                          title={
                            esAdminMaestro(usuario)
                              ? 'La cuenta de seguridad del sistema no se puede desactivar'
                              : esPropioUsuario(usuario)
                                ? 'No puedes desactivar tu propia cuenta'
                                : usuario.activo
                                  ? 'Desactivar usuario'
                                  : 'Activar usuario'
                          }
                        >
                          {procesandoId === usuario.id ? (
                            <Loader size={16} className="spin" />
                          ) : usuario.activo ? (
                            <XCircle size={17} />
                          ) : (
                            <CheckCircle size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => manejarEliminar(usuario)}
                          disabled={
                            procesandoId === usuario.id ||
                            esPropioUsuario(usuario) ||
                            esAdminMaestro(usuario)
                          }
                          aria-label={`Eliminar a ${usuario.nombre} ${usuario.apellido}`}
                          title={
                            esAdminMaestro(usuario)
                              ? 'La cuenta de seguridad del sistema no se puede eliminar'
                              : esPropioUsuario(usuario)
                                ? 'No puedes eliminar tu propia cuenta'
                                : 'Eliminar usuario'
                          }
                        >
                          <Trash size={16} />
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

      {usuariosFiltrados.length > 0 ? (
        <div className="users-pagination-bar">
          <span className="pagination-info">
            Página {paginaValida} de {totalPaginas}
          </span>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPagina(1)}
              disabled={paginaValida === 1}
              title="Primera página"
              aria-label="Primera página"
            >
              <AnglesLeft size={14} />
            </button>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaValida === 1}
              title="Página anterior"
              aria-label="Página anterior"
            >
              <AngleLeft size={14} />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter(
                (num) =>
                  Math.abs(num - paginaValida) <= 2 ||
                  num === 1 ||
                  num === totalPaginas,
              )
              .map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pagination-btn${num === paginaValida ? ' pagination-btn--active' : ''}`}
                  onClick={() => setPagina(num)}
                  aria-label={`Ir a la página ${num}`}
                  aria-current={num === paginaValida ? 'page' : undefined}
                >
                  {num}
                </button>
              ))}

            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaValida === totalPaginas}
              title="Página siguiente"
              aria-label="Página siguiente"
            >
              <AngleRight size={14} />
            </button>
            <button
              type="button"
              className="pagination-btn"
              onClick={() => setPagina(totalPaginas)}
              disabled={paginaValida === totalPaginas}
              title="Última página"
              aria-label="Última página"
            >
              <AnglesRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
        descripcion={
          editando
            ? 'Actualiza los datos, el rol o el estado de acceso.'
            : 'Crea una cuenta para una persona de tu equipo.'
        }
        footer={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-usuario"
              className="button button--primary"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <Loader size={17} className="spin" />
                  Guardando...
                </>
              ) : editando ? (
                'Guardar Cambios'
              ) : (
                'Crear Usuario'
              )}
            </button>
          </>
        }
      >
        <form
          id="form-usuario"
          className="form-stack"
          onSubmit={manejarGuardar}
          noValidate
        >
          {errorForm ? (
            <div className="alert alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{errorForm}</span>
            </div>
          ) : null}

          {editando && esAdminMaestro(editando) ? (
            <div className="alert alert--info">
              <Lock size={18} />
              <span>
                Esta es la cuenta de seguridad del sistema. Su rol, estado y
                nombre de usuario están protegidos contra modificaciones.
              </span>
            </div>
          ) : !editando ? (
            <div className="alert alert--info">
              <InfoCircle size={18} />
              <span>
                La persona deberá cambiar esta contraseña en su primer inicio de
                sesión.
              </span>
            </div>
          ) : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="usuario-nombre">Nombre</label>
              <input
                id="usuario-nombre"
                className={`input${errores.nombre ? ' input--error' : ''}`}
                value={form.nombre}
                onChange={actualizarCampo('nombre')}
                autoComplete="given-name"
                placeholder="Ej. Ana"
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre ? (
                <span className="field-error">{errores.nombre}</span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="usuario-apellido">Apellido</label>
              <input
                id="usuario-apellido"
                className={`input${errores.apellido ? ' input--error' : ''}`}
                value={form.apellido}
                onChange={actualizarCampo('apellido')}
                autoComplete="family-name"
                placeholder="Ej. Pérez"
                aria-invalid={Boolean(errores.apellido)}
              />
              {errores.apellido ? (
                <span className="field-error">{errores.apellido}</span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="usuario-username">Nombre de usuario</label>
              <input
                id="usuario-username"
                className={`input${errores.username ? ' input--error' : ''}`}
                value={form.username}
                onChange={actualizarCampo('username')}
                autoComplete="username"
                placeholder="Ej. ana.perez"
                aria-invalid={Boolean(errores.username)}
                disabled={Boolean(editando && esAdminMaestro(editando))}
              />
              {errores.username ? (
                <span className="field-error">{errores.username}</span>
              ) : editando && esAdminMaestro(editando) ? (
                <span className="field-hint">
                  El nombre de la cuenta de seguridad no se puede modificar.
                </span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="usuario-rol">Rol</label>
              <CustomSelect
                id="usuario-rol"
                className="custom-select-wrap--form"
                valor={form.rol_id}
                onChange={(nuevo) => {
                  setForm((ant) => ({ ...ant, rol_id: nuevo }));
                  setErrores((ant) => ({ ...ant, rol_id: '' }));
                  setErrorForm('');
                }}
                placeholder="Selecciona un rol"
                opciones={roles.map((rol) => ({
                  valor: String(rol.id),
                  etiqueta: rol.nombre,
                }))}
                disabled={Boolean(editando && esAdminMaestro(editando))}
                error={Boolean(errores.rol_id)}
                aria-label="Rol de usuario"
              />
              {errores.rol_id ? (
                <span className="field-error">{errores.rol_id}</span>
              ) : editando && esAdminMaestro(editando) ? (
                <span className="field-hint">
                  El rol de la cuenta de seguridad siempre es Administrador.
                </span>
              ) : null}
            </div>

            <div className="field--full">
              <PasswordInput
                id="usuario-password"
                label={editando ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                autoComplete="new-password"
                value={form.password}
                onChange={actualizarCampo('password')}
                error={errores.password}
                hint={
                  editando
                    ? 'Déjala vacía para conservar la contraseña actual.'
                    : 'Mínimo 8 caracteres.'
                }
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {form.password ? (
              <div className="field--full">
                <PasswordInput
                  id="usuario-confirmar-password"
                  label="Confirmar contraseña"
                  autoComplete="new-password"
                  value={form.confirmarPassword}
                  onChange={actualizarCampo('confirmarPassword')}
                  error={errores.confirmarPassword}
                  placeholder="Repite la contraseña"
                />
              </div>
            ) : null}
          </div>

          {editando ? (
            <div className="switch-field">
              <div className="switch-field-text">
                <strong>Usuario activo</strong>
                <span>
                  {editando && esAdminMaestro(editando)
                    ? 'La cuenta de seguridad del sistema no se puede desactivar.'
                    : editandoPropioUsuario
                      ? 'No puedes desactivar tu propia cuenta.'
                      : 'Si lo desactivas, la persona no podrá iniciar sesión.'}
                </span>
              </div>
              <input
                id="usuario-activo"
                type="checkbox"
                className="switch"
                checked={form.activo}
                onChange={actualizarCampo('activo')}
                disabled={Boolean(
                  editandoPropioUsuario || (editando && esAdminMaestro(editando)),
                )}
              />
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        abierto={Boolean(usuarioDetalle)}
        onCerrar={() => setUsuarioDetalle(null)}
        titulo="Detalles del usuario"
        descripcion="Ficha informativa del usuario en el sistema."
        footer={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setUsuarioDetalle(null)}
          >
            Cerrar
          </button>
        }
      >
        {usuarioDetalle ? (
          <div>
            <div className="detail-user-header">
              <span className="detail-user-avatar" aria-hidden="true">
                {iniciales(usuarioDetalle.nombre, usuarioDetalle.apellido)}
              </span>
              <div>
                <div className="detail-user-name">
                  <span>
                    {usuarioDetalle.nombre} {usuarioDetalle.apellido}
                  </span>
                  {esAdminMaestro(usuarioDetalle) ? (
                    <span
                      className="system-lock-icon"
                      title="Cuenta protegida de seguridad del sistema"
                    >
                      <Lock size={14} />
                    </span>
                  ) : null}
                </div>
                <span className="detail-user-handle">
                  @{usuarioDetalle.username}
                </span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Rol asignado</span>
                <span className="user-role-text">{usuarioDetalle.rol}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span
                  className={`user-status-text ${usuarioDetalle.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                >
                  {usuarioDetalle.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Contraseña</span>
                <span
                  className={`user-password-text ${usuarioDetalle.debe_cambiar_password ? 'user-password-text--warning' : 'user-password-text--ok'}`}
                >
                  {usuarioDetalle.debe_cambiar_password
                    ? 'Temporal (debe cambiar)'
                    : 'Al día'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Cuenta del sistema</span>
                <span className="detail-value">
                  {esAdminMaestro(usuarioDetalle)
                    ? 'Sí (Seguridad Kora)'
                    : 'No'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Último inicio de sesión</span>
                <span className="detail-value">
                  {formatearFechaHora(usuarioDetalle.ultimo_login)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Fecha de registro</span>
                <span className="detail-value">
                  {formatearFechaHora(usuarioDetalle.created_at)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
