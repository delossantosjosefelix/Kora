import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  Loader,
  Search,
  Trash,
  Truck,
  XCircle,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import Modal from '../ui/Modal.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';

const OPCIONES_ESTADO = [
  { valor: 'TODOS', etiqueta: 'Todos Los Estados' },
  { valor: 'ACTIVOS', etiqueta: 'Activos' },
  { valor: 'INACTIVOS', etiqueta: 'Inactivos' },
];

const POR_PAGINA = 7;

export default function SuplidoresPanel({
  onAbrirCrear,
  onAbrirEditar,
  refrescarKey,
  onTotalChange,
}) {
  const [suplidores, setSuplidores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const [procesandoId, setProcesandoId] = useState(null);
  const [suplidorDetalle, setSuplidorDetalle] = useState(null);

  const cargarSuplidores = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const params = new URLSearchParams({
        activo: filtroEstado,
      });

      if (busqueda.trim()) {
        params.append('busqueda', busqueda.trim());
      }

      const respuesta = await api.get(`/suplidores?${params.toString()}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo cargar la lista de suplidores.'),
        );
      }

      const lista = respuesta.datos?.suplidores ?? [];
      setSuplidores(lista);
      onTotalChange?.(lista.length);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroEstado, onTotalChange]);

  useEffect(() => {
    cargarSuplidores();
  }, [cargarSuplidores, refrescarKey]);

  const totalPaginas = Math.max(1, Math.ceil(suplidores.length / POR_PAGINA));
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);

  const suplidoresPaginados = useMemo(() => {
    const inicio = (paginaValida - 1) * POR_PAGINA;
    return suplidores.slice(inicio, inicio + POR_PAGINA);
  }, [suplidores, paginaValida]);

  const alternarActivo = async (sup) => {
    setProcesandoId(sup.id);
    const nuevoEstado = !sup.activo;

    try {
      const respuesta = await api.patch(`/suplidores/${sup.id}`, {
        activo: nuevoEstado,
      });

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo cambiar el estado del suplidor.'),
        );
      }

      notify.success(
        nuevoEstado
          ? 'Suplidor activado exitosamente.'
          : 'Suplidor desactivado exitosamente.',
      );

      await cargarSuplidores();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (sup) => {
    const confirmado = await notify.confirm({
      titulo: 'Eliminar suplidor',
      texto: `¿Deseas eliminar al suplidor "${sup.nombre}"? Esta acción solo se permite si no tiene compras registradas.`,
      confirmar: 'Sí, eliminar',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    setProcesandoId(sup.id);

    try {
      const respuesta = await api.delete(`/suplidores/${sup.id}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo eliminar el suplidor.'),
        );
      }

      notify.success('Suplidor eliminado exitosamente.');
      await cargarSuplidores();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'TODOS';

  return (
    <div className="users-page-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="search"
            className="search-box-input"
            placeholder="Buscar Suplidor..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            aria-label="Buscar suplidores"
          />
        </div>

        <div className="users-controls">
          <CustomSelect
            valor={filtroEstado}
            onChange={(val) => {
              setFiltroEstado(val);
              setPagina(1);
            }}
            placeholder="Todos Los Estados"
            opciones={OPCIONES_ESTADO}
            aria-label="Filtrar por estado del suplidor"
          />
        </div>
      </div>

      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table users-table--compact">
            <thead>
              <tr>
                <th>Suplidor / Razón social</th>
                <th>RNC o cédula</th>
                <th>Contacto</th>
                <th>Teléfono / Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando suplidores...
                    </div>
                  </td>
                </tr>
              ) : suplidores.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Truck size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'Aún no hay suplidores registrados'}
                      </h3>
                      <p>
                        {hayFiltros
                          ? 'Prueba modificando el término de búsqueda o el estado.'
                          : 'Comienza registrando a tus proveedores de mercancías.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                suplidoresPaginados.map((sup) => (
                  <tr key={sup.id}>
                    <td>
                      <div
                        className="product-cell product-cell--interactive"
                        style={{ minWidth: '180px' }}
                        onClick={() => setSuplidorDetalle(sup)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSuplidorDetalle(sup);
                        }}
                        title="Ver detalles del suplidor"
                      >
                        <div>
                          <div
                            className="product-name cell-truncate"
                            style={{ maxWidth: '210px' }}
                            title={sup.nombre}
                          >
                            {sup.nombre}
                          </div>
                          {sup.compras_count > 0 ? (
                            <div className="product-meta">
                              <span className="table-muted" style={{ fontSize: '0.76rem' }}>
                                {sup.compras_count} compra(s) asociada(s)
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="product-code-badge">
                        {sup.rnc || 'No registrado'}
                      </span>
                    </td>

                    <td>
                      <span
                        className="user-role-text cell-truncate"
                        style={{ maxWidth: '140px' }}
                        title={sup.contacto || '-'}
                      >
                        {sup.contacto || '-'}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div>{sup.telefono || '-'}</div>
                        {sup.email ? (
                          <div
                            className="table-muted cell-truncate"
                            style={{ fontSize: '0.78rem', maxWidth: '160px' }}
                            title={sup.email}
                          >
                            {sup.email}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span
                        className="table-muted cell-truncate"
                        style={{ maxWidth: '180px' }}
                        title={sup.direccion || '-'}
                      >
                        {sup.direccion || '-'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`user-status-text ${
                          sup.activo ? 'user-status-text--active' : 'user-status-text--inactive'
                        }`}
                      >
                        {sup.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setSuplidorDetalle(sup)}
                          title="Ver detalles"
                          aria-label={`Ver detalles de ${sup.nombre}`}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => onAbrirEditar(sup)}
                          disabled={procesandoId === sup.id}
                          title="Editar suplidor"
                          aria-label={`Editar suplidor ${sup.nombre}`}
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          type="button"
                          className={`icon-button${sup.activo ? ' icon-button--danger' : ''}`}
                          onClick={() => alternarActivo(sup)}
                          disabled={procesandoId === sup.id}
                          title={sup.activo ? 'Desactivar suplidor' : 'Activar suplidor'}
                          aria-label={
                            sup.activo
                              ? `Desactivar suplidor ${sup.nombre}`
                              : `Activar suplidor ${sup.nombre}`
                          }
                        >
                          {procesandoId === sup.id ? (
                            <Loader size={16} className="spin" />
                          ) : sup.activo ? (
                            <XCircle size={17} />
                          ) : (
                            <CheckCircle size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => manejarEliminar(sup)}
                          disabled={procesandoId === sup.id}
                          title="Eliminar suplidor"
                          aria-label={`Eliminar suplidor ${sup.nombre}`}
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

      {suplidores.length > 0 ? (
        <Paginacion
          pagina={paginaValida}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      {/* Modal de Detalle Completo del Suplidor */}
      <Modal
        abierto={Boolean(suplidorDetalle)}
        onCerrar={() => setSuplidorDetalle(null)}
        titulo="Detalle Del Suplidor"
        tamano="md"
        footer={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setSuplidorDetalle(null)}
          >
            Cerrar
          </button>
        }
      >
        {suplidorDetalle ? (
          <div className="detail-grid">
            <div className="detail-item detail-item--full">
              <span className="detail-label">Razón social / Proveedor</span>
              <span className="detail-value" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {suplidorDetalle.nombre}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">RNC o cédula</span>
              <span className="detail-value">{suplidorDetalle.rnc || 'No registrado'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Persona de contacto</span>
              <span className="detail-value">{suplidorDetalle.contacto || 'No especificado'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Teléfono comercial</span>
              <span className="detail-value">{suplidorDetalle.telefono || 'No registrado'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Correo electrónico</span>
              <span className="detail-value">{suplidorDetalle.email || 'No registrado'}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Estado de cuenta</span>
              <span className="detail-value">
                <span
                  className={`user-status-text ${
                    suplidorDetalle.activo ? 'user-status-text--active' : 'user-status-text--inactive'
                  }`}
                >
                  {suplidorDetalle.activo ? 'Activo' : 'Inactivo'}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Compras registradas</span>
              <span className="detail-value" style={{ fontWeight: 600 }}>
                {suplidorDetalle.compras_count ?? 0} compra(s) asociada(s)
              </span>
            </div>

            {suplidorDetalle.direccion ? (
              <div className="detail-item detail-item--full">
                <span className="detail-label">Dirección física completa</span>
                <div className="detail-value detail-value--box">
                  {suplidorDetalle.direccion}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
