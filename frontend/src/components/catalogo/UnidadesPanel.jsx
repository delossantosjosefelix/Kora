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
  CheckCircle,
  Edit,
  Eye,
  Loader,
  Ruler,
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
import { Package } from 'reicon-react';

const FORMULARIO_VACIO = {
  nombre: '',
  abreviatura: '',
  icono: 'Package',
  activo: true,
};

const POR_PAGINA = 7;

const UnidadesPanel = forwardRef(function UnidadesPanel(
  { onTotalChange },
  ref,
) {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [unidadDetalle, setUnidadDetalle] = useState(null);
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
        ? '/unidades?incluirInactivas=true'
        : '/unidades';
      const respuesta = await api.get(ruta);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudieron cargar las unidades.'),
        );
      }

      setUnidades(respuesta.datos?.unidades ?? []);
    } catch (error) {
      setErrorCarga(error.message || 'No se pudieron cargar las unidades.');
    } finally {
      setCargando(false);
    }
  }, [puedeGestionar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    onTotalChange?.(unidades.length);
  }, [unidades, onTotalChange]);

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

  const abrirEditar = (unidad) => {
    if (!puedeGestionar) return;

    setEditando(unidad);
    setForm({
      nombre: unidad.nombre ?? '',
      abreviatura: unidad.abreviatura ?? '',
      icono: unidad.icono ?? 'Package',
      activo: Boolean(unidad.activo),
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
    const abreviatura = form.abreviatura.trim();

    if (!nombre) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (nombre.length > 30) {
      nuevosErrores.nombre =
        'El nombre no puede superar los 30 caracteres.';
    }

    if (!abreviatura) {
      nuevosErrores.abreviatura = 'La abreviatura es obligatoria.';
    } else if (abreviatura.length > 10) {
      nuevosErrores.abreviatura =
        'La abreviatura no puede superar los 10 caracteres.';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    setErrorForm('');

    try {
      const cuerpo = {
        nombre,
        abreviatura,
        icono: form.icono || 'Package',
      };

      if (editando) {
        cuerpo.activo = form.activo;
      }

      const respuesta = editando
        ? await api.patch(`/unidades/${editando.id}`, cuerpo)
        : await api.post('/unidades', cuerpo);

      if (!respuesta.ok) {
        setErrorForm(
          mensajeError(respuesta, 'No se pudo guardar la unidad.'),
        );
        return;
      }

      notify.success(
        mensajeError(
          respuesta,
          editando ? 'Unidad actualizada.' : 'Unidad creada.',
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

  const alternarActivo = async (unidad) => {
    const confirmado = await notify.confirm({
      titulo: unidad.activo ? 'Desactivar unidad' : 'Activar unidad',
      texto: unidad.activo
        ? 'La unidad dejará de estar disponible para productos nuevos. Los productos existentes conservan su unidad.'
        : 'La unidad volverá a estar disponible para el catálogo.',
      confirmar: unidad.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelar: 'Cancelar',
      peligro: unidad.activo,
    });

    if (!confirmado) return;

    setProcesandoId(unidad.id);

    try {
      const respuesta = await api.patch(`/unidades/${unidad.id}`, {
        activo: !unidad.activo,
      });

      if (!respuesta.ok) {
        notify.error(
          mensajeError(
            respuesta,
            'No se pudo cambiar el estado de la unidad.',
          ),
        );
        return;
      }

      notify.success(
        unidad.activo ? 'Unidad desactivada.' : 'Unidad activada.',
      );
      await cargar();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (unidad) => {
    const confirmado = await notify.confirm({
      titulo: 'Eliminar unidad',
      texto: `¿Deseas eliminar definitivamente la unidad "${unidad.nombre}" (${unidad.abreviatura})? Si tiene productos asociados, el sistema no permitirá borrarla y deberás desactivarla.`,
      confirmar: 'Sí, eliminar',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    setProcesandoId(unidad.id);

    try {
      const respuesta = await api.delete(`/unidades/${unidad.id}`);

      if (!respuesta.ok) {
        notify.error(
          mensajeError(respuesta, 'No se pudo eliminar la unidad.'),
        );
        return;
      }

      notify.success('Unidad eliminada.');
      await cargar();
    } catch {
      notify.error('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setProcesandoId(null);
    }
  };

  const unidadesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return unidades.filter((unidad) => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && unidad.activo) ||
        (filtroEstado === 'inactivos' && !unidad.activo);
      const contenido =
        `${unidad.nombre} ${unidad.abreviatura}`.toLowerCase();
      const coincideTexto = !texto || contenido.includes(texto);

      return coincideEstado && coincideTexto;
    });
  }, [unidades, busqueda, filtroEstado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(unidadesFiltradas.length / POR_PAGINA),
  );
  const paginaValida = Math.min(pagina, totalPaginas);

  const unidadesPaginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * POR_PAGINA;
    return unidadesFiltradas.slice(inicio, inicio + POR_PAGINA);
  }, [unidadesFiltradas, paginaValida]);

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
        placeholderBusqueda="Buscar Unidad..."
        ariaLabelBusqueda="Buscar unidades"
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
                <th>Nombre / Abreviatura</th>
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
                      Cargando unidades...
                    </div>
                  </td>
                </tr>
              ) : unidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={columnas}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Ruler size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'Aún no hay unidades'}
                      </h3>
                      {!hayFiltros && puedeGestionar ? (
                        <p>
                          Usa el botón Nueva unidad para crear la primera.
                        </p>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                unidadesPaginadas.map((unidad) => (
                  <tr key={unidad.id}>
                    <td>
                      <div
                        className="user-cell user-cell--interactive"
                        onClick={() => setUnidadDetalle(unidad)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setUnidadDetalle(unidad);
                        }}
                        title="Ver detalles de la unidad"
                      >
                        <span className="user-avatar" aria-hidden="true">
                          {renderIcono(unidad.icono, { size: 18 }, Package)}
                        </span>
                        <div className="user-cell-info">
                          <div className="user-name">{unidad.nombre}</div>
                          <span className="user-handle">
                            {unidad.abreviatura}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`user-status-text ${unidad.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                      >
                        {unidad.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setUnidadDetalle(unidad)}
                          aria-label={`Ver detalles de ${unidad.nombre}`}
                          title="Ver detalles"
                        >
                          <Eye size={17} />
                        </button>

                        {puedeGestionar ? (
                          <>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => abrirEditar(unidad)}
                              disabled={procesandoId === unidad.id}
                              aria-label={`Editar ${unidad.nombre}`}
                              title="Editar unidad"
                            >
                              <Edit size={17} />
                            </button>

                            <button
                              type="button"
                              className={`icon-button${unidad.activo ? ' icon-button--danger' : ''}`}
                              onClick={() => alternarActivo(unidad)}
                              disabled={procesandoId === unidad.id}
                              aria-label={
                                unidad.activo
                                  ? `Desactivar ${unidad.nombre}`
                                  : `Activar ${unidad.nombre}`
                              }
                              title={
                                unidad.activo
                                  ? 'Desactivar unidad'
                                  : 'Activar unidad'
                              }
                            >
                              {procesandoId === unidad.id ? (
                                <Loader size={16} className="spin" />
                              ) : unidad.activo ? (
                                <XCircle size={17} />
                              ) : (
                                <CheckCircle size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="icon-button icon-button--danger"
                              onClick={() => manejarEliminar(unidad)}
                              disabled={procesandoId === unidad.id}
                              aria-label={`Eliminar ${unidad.nombre}`}
                              title="Eliminar unidad"
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

      {unidadesFiltradas.length > 0 ? (
        <Paginacion
          pagina={paginaValida}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar Unidad' : 'Nueva Unidad'}
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
              form="form-unidad"
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
                'Crear Unidad'
              )}
            </button>
          </>
        }
      >
        <form
          id="form-unidad"
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
                valor={form.icono || 'Package'}
                onChange={(nuevoIcono) =>
                  setForm((f) => ({ ...f, icono: nuevoIcono }))
                }
                fallbackIcon="Package"
                disabled={guardando}
              />
            </div>

            <div className="field">
              <label htmlFor="unidad-nombre">Nombre</label>
              <input
                id="unidad-nombre"
                className={`input${errores.nombre ? ' input--error' : ''}`}
                value={form.nombre}
                onChange={actualizarCampo('nombre')}
                maxLength={30}
                placeholder="Ej. Libra"
                aria-invalid={Boolean(errores.nombre)}
              />
              {errores.nombre ? (
                <span className="field-error">{errores.nombre}</span>
              ) : (
                <span className="field-hint">Máximo 30 caracteres.</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="unidad-abreviatura">Abreviatura</label>
              <input
                id="unidad-abreviatura"
                className={`input${errores.abreviatura ? ' input--error' : ''}`}
                value={form.abreviatura}
                onChange={actualizarCampo('abreviatura')}
                maxLength={10}
                placeholder="Ej. lb"
                aria-invalid={Boolean(errores.abreviatura)}
              />
              {errores.abreviatura ? (
                <span className="field-error">{errores.abreviatura}</span>
              ) : (
                <span className="field-hint">Máximo 10 caracteres.</span>
              )}
            </div>
          </div>

          {editando ? (
            <div className="switch-field">
              <div className="switch-field-text">
                <strong>Unidad activa</strong>
                <span>
                  Si la desactivas, no estará disponible para productos nuevos.
                </span>
              </div>
              <input
                id="unidad-activo"
                type="checkbox"
                className="switch"
                checked={form.activo}
                onChange={actualizarCampo('activo')}
                aria-label="Unidad activa"
              />
            </div>
          ) : null}
        </form>
      </Modal>

      <Modal
        abierto={Boolean(unidadDetalle)}
        onCerrar={() => setUnidadDetalle(null)}
        titulo="Detalle De La Unidad"
        tamano="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setUnidadDetalle(null)}
            >
              Cerrar
            </button>
            {puedeGestionar && unidadDetalle ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const uni = unidadDetalle;
                  setUnidadDetalle(null);
                  abrirEditar(uni);
                }}
              >
                <Edit size={16} />
                Editar Unidad
              </button>
            ) : null}
          </div>
        }
      >
        {unidadDetalle ? (
          <div>
            <div className="detail-user-header">
              <span className="detail-user-avatar" aria-hidden="true">
                {renderIcono(unidadDetalle.icono, { size: 22 }, Package)}
              </span>
              <div>
                <div className="detail-user-name">{unidadDetalle.nombre}</div>
                <div className="detail-user-handle">Unidad de medida ({unidadDetalle.abreviatura})</div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Nombre</span>
                <span className="detail-value">{unidadDetalle.nombre}</span>
              </div>

            <div className="detail-item">
              <span className="detail-label">Abreviatura</span>
              <span className="detail-value">{unidadDetalle.abreviatura}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Estado</span>
              <span
                className={`user-status-text ${unidadDetalle.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
              >
                {unidadDetalle.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
        ) : null}
      </Modal>
    </div>
  );
});

export default UnidadesPanel;
