import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Loader,
  Search,
  Trash,
  Truck,
  XCircle,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';

const OPCIONES_ESTADO = [
  { valor: 'TODOS', etiqueta: 'Todos los estados' },
  { valor: 'ACTIVOS', etiqueta: 'Activos' },
  { valor: 'INACTIVOS', etiqueta: 'Inactivos' },
];

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
  const [procesandoId, setProcesandoId] = useState(null);

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
            placeholder="Buscar por nombre, RNC, contacto o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar suplidores"
          />
        </div>

        <div className="users-controls">
          <CustomSelect
            valor={filtroEstado}
            onChange={setFiltroEstado}
            placeholder="Todos los estados"
            opciones={OPCIONES_ESTADO}
            aria-label="Filtrar por estado del suplidor"
          />
        </div>
      </div>

      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Suplidor / Razón social</th>
                <th>RNC o cédula</th>
                <th>Contacto</th>
                <th>Teléfono / Correo</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acciones</th>
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
                suplidores.map((sup) => (
                  <tr key={sup.id}>
                    <td>
                      <div>
                        <div className="product-name">{sup.nombre}</div>
                        {sup.compras_count > 0 ? (
                          <div className="product-meta">
                            <span className="table-muted" style={{ fontSize: '0.76rem' }}>
                              {sup.compras_count} compra(s) asociada(s)
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span className="product-code-badge">
                        {sup.rnc || 'No registrado'}
                      </span>
                    </td>

                    <td>
                      <span className="user-role-text">
                        {sup.contacto || '-'}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div>{sup.telefono || '-'}</div>
                        {sup.email ? (
                          <div className="table-muted" style={{ fontSize: '0.78rem' }}>
                            {sup.email}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span className="table-muted" style={{ maxWidth: '200px', display: 'inline-block' }}>
                        {sup.direccion || '-'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`user-status-text ${sup.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                      >
                        {sup.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
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
    </div>
  );
}
