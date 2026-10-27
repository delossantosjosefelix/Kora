import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  Category,
  CheckCircle,
  Edit,
  Eye,
  Loader,
  Search,
  Trash,
  XCircle,
} from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import CustomSelect from '../ui/CustomSelect.jsx';
import IconPicker from '../ui/IconPicker.jsx';
import CatalogoBar from './CatalogoBar.jsx';
import Paginacion from './Paginacion.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';
import { renderIcono } from '../../utils/iconosCatalogo.jsx';

const FORMULARIO_VACIO = {
  nombre: '',
  descripcion: '',
  icono: 'Tag',
  activo: true,
};

const POR_PAGINA = 7;

const CategoriasPanel = forwardRef(function CategoriasPanel(
  { onTotalChange },
  ref,
) {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [categoriaDetalle, setCategoriaDetalle] = useState(null);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const ruta = puedeGestionar
        ? '/categorias?incluirInactivas=true'
        : '/categorias';
      const respuesta = await api.get(ruta);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudieron cargar las categorías.'),
        );
      }

      setCategorias(respuesta.datos?.categorias ?? []);
    } catch (error) {
      setErrorCarga(
        error.message || 'No se pudieron cargar las categorías.',
      );
    } finally {
      setCargando(false);
    }
  }, [puedeGestionar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    onTotalChange?.(categorias.length);
  }, [categorias, onTotalChange]);

  const abrirCrear = useCallback(() => {
    if (!puedeGestionar) return;

    setEditando(null);
    setForm(FORMULARIO_VACIO);
    setErrores({});
    setErrorForm('');
    setModalAbierto(true);
  }, [puedeGestionar]);

  useImperativeHandle(
    ref,
    () => ({
      abrirCrear,
    }),
    [abrirCrear],
  );

  const abrirEditar = (categoria) => {
    if (!puedeGestionar) return;

    setEditando(categoria);
    setForm({
      nombre: categoria.nombre ?? '',
      descripcion: categoria.descripcion ?? '',
      icono: categoria.icono ?? 'Tag',
      activo: Boolean(categoria.activo),
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
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();

    if (!nombre) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (nombre.length > 60) {
      nuevosErrores.nombre =
        'El nombre no puede superar los 60 caracteres.';
    }

    if (descripcion.length > 150) {
      nuevosErrores.descripcion =
        'La descripción no puede superar los 150 caracteres.';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorForm('');

    try {
      const cuerpo = {
        nombre,
        descripcion,
        icono: form.icono || 'Tag',
      };

      if (editando) {
        cuerpo.activo = form.activo;
      }

      const respuesta = editando
        ? await api.patch(`/categorias/${editando.id}`, cuerpo)
        : await api.post('/categorias', cuerpo);

      if (!respuesta.ok) {
        setErrorForm(
          mensajeError(respuesta, 'No se pudo guardar la categoría.'),
        );
        return;
      }

      notify.success(
        mensajeError(
          respuesta,
          editando ? 'Categoría actualizada.' : 'Categoría creada.',
        ),
      );

      setModalAbierto(false);
      setEditando(null);
      await cargar();
    } catch {
      setErrorForm('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (categoria) => {
    const confirmado = await notify.confirm({
      titulo: categoria.activo ? 'Desactivar categoría' : 'Activar categoría',
      texto: categoria.activo
        ? 'La categoría dejará de estar disponible para productos nuevos. Los productos existentes conservan su categoría.'
        : 'La categoría volverá a estar disponible para el catálogo.',
      confirmar: categoria.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelar: 'Cancelar',
      peligro: categoria.activo,
    });

    if (!confirmado) return;

    setProcesandoId(categoria.id);

    try {
      const respuesta = await api.patch(`/categorias/${categoria.id}`, {
        activo: !categoria.activo,
      });

      if (!respuesta.ok) {
        notify.error(
          mensajeError(
            respuesta,
            'No se pudo cambiar el estado de la categoría.',
          ),
        );
        return;
      }

      notify.success(
        categoria.activo ? 'Categoría desactivada.' : 'Categoría activada.',
      );
      await cargar();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (categoria) => {
    const confirmado = await notify.confirm({
      titulo: 'Eliminar categoría',
      texto: `¿Deseas eliminar definitivamente la categoría "${categoria.nombre}"? Si tiene productos asociados, el sistema no permitirá borrarla y deberás desactivarla.`,
      confirmar: 'Sí, eliminar',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    setProcesandoId(categoria.id);

    try {
      const respuesta = await api.delete(`/categorias/${categoria.id}`);

      if (!respuesta.ok) {
        notify.error(
          mensajeError(respuesta, 'No se pudo eliminar la categoría.'),
        );
        return;
      }

      notify.success('Categoría eliminada.');
      await cargar();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const categoriasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return categorias.filter((categoria) => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && categoria.activo) ||
        (filtroEstado === 'inactivos' && !categoria.activo);
      const contenido =
        `${categoria.nombre} ${categoria.descripcion ?? ''}`.toLowerCase();
      const coincideTexto = !texto || contenido.includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [categorias, busqueda, filtroEstado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(categoriasFiltradas.length / POR_PAGINA),
  );
  const paginaValida = Math.min(pagina, totalPaginas);

  const categoriasPaginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * POR_PAGINA;
    return categoriasFiltradas.slice(inicio, inicio + POR_PAGINA);
  }, [categoriasFiltradas, paginaValida]);

  const hayFiltros = Boolean(
    busqueda.trim() || (puedeGestionar && filtroEstado !== 'todos'),
  );
  const columnas = 3;

  return (
    <div className="catalog-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      <CatalogoBar
        busqueda={busqueda}
        onBuscar={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        placeholderBusqueda="Buscar Categoría..."
        ariaLabelBusqueda="Buscar categorías"
        controlExtra={
          puedeGestionar ? (
            <CustomSelect
              valor={filtroEstado}
              onChange={(nuevo) => {
                setFiltroEstado(nuevo);
                setPagina(1);
              }}
              placeholder="Todos Los Estados"
              opciones={[
                { valor: 'todos', etiqueta: 'Todos Los Estados' },
                { valor: 'activos', etiqueta: 'Activas' },
                { valor: 'inactivos', etiqueta: 'Inactivas' },
              ]}
              aria-label="Filtrar por estado"
            />
          ) : null
        }
      />

      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table users-table--compact">
            <thead>
              <tr>
                <th>Nombre / Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={columnas}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando categorías...
                    </div>
                  </td>
                </tr>
              ) : categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={columnas}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Category size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'Aún no hay categorías'}
                      </h3>
                      {!hayFiltros && puedeGestionar ? (
                        <p>
                          Usa el botón Nueva categoría para crear la primera.
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                categoriasPaginadas.map((categoria) => (
                  <tr key={categoria.id}>
                    <td>
                      <div
                        className="user-cell user-cell--interactive"
                        onClick={() => setCategoriaDetalle(categoria)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setCategoriaDetalle(categoria);
                        }}
                        title="Ver detalles de la categoría"
                      >
                        <span className="user-avatar" aria-hidden="true">
                          {renderIcono(categoria.icono, { size: 18 })}
                        </span>
                        <div className="user-cell-info">
                          <div className="user-name">{categoria.nombre}</div>
                          {categoria.descripcion ? (
                            <span
                              className="user-handle user-handle--truncate"
                              title={categoria.descripcion}
                            >
                              {categoria.descripcion}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`user-status-text ${categoria.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                      >
                        {categoria.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setCategoriaDetalle(categoria)}
                          aria-label={`Ver detalles de ${categoria.nombre}`}
                          title="Ver detalles"
                        >
                          <Eye size={17} />
                        </button>

                        {puedeGestionar ? (
                          <>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => abrirEditar(categoria)}
                              disabled={procesandoId === categoria.id}
                              aria-label={`Editar ${categoria.nombre}`}
                              title="Editar categoría"
                            >
                              <Edit size={17} />
                            </button>

                            <button
                              type="button"
                              className={`icon-button${categoria.activo ? ' icon-button--danger' : ''}`}
                              onClick={() => alternarActivo(categoria)}
                              disabled={procesandoId === categoria.id}
                              aria-label={
                                categoria.activo
                                  ? `Desactivar ${categoria.nombre}`
                                  : `Activar ${categoria.nombre}`
                              }
                              title={
                                categoria.activo
                                  ? 'Desactivar categoría'
                                  : 'Activar categoría'
                              }
                            >
                              {procesandoId === categoria.id ? (
                                <Loader size={16} className="spin" />
                              ) : categoria.activo ? (
                                <XCircle size={17} />
                              ) : (
                                <CheckCircle size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="icon-button icon-button--danger"
                              onClick={() => manejarEliminar(categoria)}
                              disabled={procesandoId === categoria.id}
                              aria-label={`Eliminar ${categoria.nombre}`}
                              title="Eliminar categoría"
                            >
                              <Trash size={16} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {categoriasFiltradas.length > 0 ? (
        <Paginacion
          pagina={paginaValida}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar Categoría' : 'Nueva Categoría'}
        tamano="md"
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
              form="form-categoria"
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
                'Crear Categoría'
              )}
            </button>
          </>
        }
      >
        <form
          id="form-categoria"
          className="form-stack form-stack--compact"
          onSubmit={manejarGuardar}
          noValidate
        >
          {errorForm ? (
            <div className="alert alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{errorForm}</span>
            </div>
          ) : null}

          <div className="field-grid">
            <div className="field field--full">
              <IconPicker
                label="Icono Representativo"
                valor={form.icono || 'Tag'}
                onChange={(nuevoIcono) =>
                  setForm((f) => ({ ...f, icono: nuevoIcono }))
                }
                fallbackIcon="Tag"
                disabled={guardando}
              />
            </div>

            <div className="field field--full">
              <label htmlFor="categoria-nombre">Nombre</label>
              <input
                id="categoria-nombre"
                className={`input${errores.nombre ? ' input--error' : ''}`}
                value={form.nombre}
                onChange={actualizarCampo('nombre')}
                maxLength={60}
                placeholder="Ej. Bebidas"
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre ? (
                <span className="field-error">{errores.nombre}</span>
              ) : (
                <span className="field-hint">Máximo 60 caracteres.</span>
              )}
            </div>

            <div className="field field--full">
              <label htmlFor="categoria-descripcion">Descripción</label>
              <textarea
                id="categoria-descripcion"
                className={`textarea${errores.descripcion ? ' textarea--error' : ''}`}
                value={form.descripcion}
                onChange={actualizarCampo('descripcion')}
                maxLength={150}
                rows={3}
                placeholder="Opcional"
                aria-invalid={Boolean(errores.descripcion)}
              />
              {errores.descripcion ? (
                <span className="field-error">{errores.descripcion}</span>
              ) : (
                <span className="field-hint">
                  Opcional. Máximo 150 caracteres.
                </span>
              )}
            </div>
          </div>

          {editando ? (
            <div className="switch-field">
              <div className="switch-field-text">
                <strong>Categoría activa</strong>
                <span>
                  Si la desactivas, no estará disponible para productos nuevos.
                </span>
              </div>
              <input
                id="categoria-activo"
                type="checkbox"
                className="switch"
                checked={form.activo}
                onChange={actualizarCampo('activo')}
                aria-label="Categoría activa"
              />
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        abierto={Boolean(categoriaDetalle)}
        onCerrar={() => setCategoriaDetalle(null)}
        titulo="Detalle De La Categoría"
        tamano="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setCategoriaDetalle(null)}
            >
              Cerrar
            </button>
            {puedeGestionar && categoriaDetalle ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const cat = categoriaDetalle;
                  setCategoriaDetalle(null);
                  abrirEditar(cat);
                }}
              >
                <Edit size={16} />
                Editar Categoría
              </button>
            ) : null}
          </div>
        }
      >
        {categoriaDetalle ? (
          <div>
            <div className="detail-user-header">
              <span className="detail-user-avatar" aria-hidden="true">
                {renderIcono(categoriaDetalle.icono, { size: 22 })}
              </span>
              <div>
                <div className="detail-user-name">{categoriaDetalle.nombre}</div>
                <div className="detail-user-handle">Categoría de productos</div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Nombre</span>
                <span className="detail-value">{categoriaDetalle.nombre}</span>
              </div>

            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <span
                className={`user-status-text ${categoriaDetalle.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
              >
                {categoriaDetalle.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            {categoriaDetalle.descripcion ? (
              <div className="detail-item detail-item--full">
                <span className="detail-label">Descripción</span>
                <div className="detail-value detail-value--box">
                  {categoriaDetalle.descripcion}
                </div>
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
});

export default CategoriasPanel;
