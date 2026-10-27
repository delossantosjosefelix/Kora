import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Archive,
  Eye,
  Filter,
  Loader,
  Search,
  Tag,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import CustomDateRangePicker from '../ui/CustomDateRangePicker.jsx';
import FilterDrawer from '../ui/FilterDrawer.jsx';
import Modal from '../ui/Modal.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import { api } from '../../services/api.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearEntero, formatearFecha, formatearFechaHora } from '../../utils/format.js';

const OPCIONES_TIPO_MOV = [
  { valor: '', etiqueta: 'Todos Los Movimientos' },
  { valor: 'ENTRADA_COMPRA', etiqueta: 'Entrada Por Compra' },
  { valor: 'SALIDA_VENTA', etiqueta: 'Salida Por Venta' },
  { valor: 'AJUSTE', etiqueta: 'Ajuste De Inventario' },
  { valor: 'MERMA', etiqueta: 'Merma / Daño' },
  { valor: 'DEVOLUCION_CLIENTE', etiqueta: 'Devolución De Cliente' },
  { valor: 'ANULACION_VENTA', etiqueta: 'Anulación De Venta' },
];

const ETIQUETAS_TIPO = {
  ENTRADA_COMPRA: { texto: 'Compra', clase: 'movement-text--compra' },
  SALIDA_VENTA: { texto: 'Venta', clase: 'movement-text--venta' },
  AJUSTE: { texto: 'Ajuste', clase: 'movement-text--ajuste' },
  MERMA: { texto: 'Merma', clase: 'movement-text--merma' },
  DEVOLUCION_CLIENTE: { texto: 'Devolución', clase: 'movement-text--devolucion' },
  ANULACION_VENTA: { texto: 'Anulación', clase: 'movement-text--anulacion' },
};

function formatearHora(fechaIso) {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MovimientosPanel({ refrescarKey, onTotalChange }) {
  const [movimientos, setMovimientos] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, total_paginas: 1 });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  const [movimientoDetalle, setMovimientoDetalle] = useState(null);

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '7',
      });

      if (filtroTipo) params.append('tipo', filtroTipo);
      if (busqueda.trim()) params.append('busqueda', busqueda.trim());
      if (fechaDesde) params.append('fechaDesde', `${fechaDesde}T00:00:00`);
      if (fechaHasta) params.append('fechaHasta', `${fechaHasta}T23:59:59`);

      const respuesta = await api.get(`/inventario/movimientos?${params.toString()}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo cargar el historial de movimientos.'),
        );
      }

      setMovimientos(respuesta.datos?.movimientos ?? []);
      setPaginacion(
        respuesta.datos?.paginacion ?? { total: 0, pagina: 1, total_paginas: 1 },
      );
      onTotalChange?.(respuesta.datos?.paginacion?.total ?? 0);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, [pagina, filtroTipo, busqueda, fechaDesde, fechaHasta, onTotalChange]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos, refrescarKey]);

  const hayFiltros =
    busqueda.trim() !== '' || filtroTipo !== '' || fechaDesde !== '' || fechaHasta !== '';

  const filtrosSecundariosActivos =
    (filtroTipo ? 1 : 0) + (fechaDesde || fechaHasta ? 1 : 0);

  return (
    <div className="users-page-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      {/* Barra de Filtros simplificada con un único botón Filtrar */}
      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="search"
            className="search-box-input"
            placeholder="Buscar Movimiento..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            aria-label="Buscar movimientos"
          />
        </div>

        <div className="users-controls">
          <button
            type="button"
            className={`button button--secondary filter-trigger-btn${filtrosSecundariosActivos > 0 ? ' filter-trigger-btn--active' : ''}`}
            onClick={() => setFiltrosAbierto(true)}
            aria-label="Abrir panel de filtros"
          >
            <Filter size={16} />
            <span>Filtrar</span>
            {filtrosSecundariosActivos > 0 ? (
              <span className="filter-badge">{filtrosSecundariosActivos}</span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Drawer lateral derecho para filtros */}
      <FilterDrawer
        abierto={filtrosAbierto}
        onCerrar={() => setFiltrosAbierto(false)}
        titulo="Filtros De Movimientos"
        totalFiltrosActivos={filtrosSecundariosActivos}
        onLimpiar={() => {
          setFiltroTipo('');
          setFechaDesde('');
          setFechaHasta('');
          setPagina(1);
        }}
        onAplicar={() => setPagina(1)}
      >
        <div className="filter-drawer-group">
          <label className="filter-drawer-group-label" htmlFor="filtro-tipo-mov">
            Tipo De Movimiento
          </label>
          <CustomSelect
            id="filtro-tipo-mov"
            className="custom-select-wrap--form"
            valor={filtroTipo}
            onChange={(val) => {
              setFiltroTipo(val);
              setPagina(1);
            }}
            placeholder="Todos Los Movimientos"
            opciones={OPCIONES_TIPO_MOV}
            aria-label="Filtrar por tipo de movimiento"
          />
        </div>

        <div className="filter-drawer-group">
          <span className="filter-drawer-group-label">
            Rango De Fechas
          </span>
          <CustomDateRangePicker
            desglosado
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onChange={({ fechaDesde: fD, fechaHasta: fH }) => {
              setFechaDesde(fD);
              setFechaHasta(fH);
              setPagina(1);
            }}
          />
        </div>
      </FilterDrawer>

      {/* Tabla de movimientos - Ancho optimizado sin scroll horizontal */}
      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table users-table--compact">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Fecha y hora</th>
                <th>Producto</th>
                <th style={{ width: '95px' }}>Operación</th>
                <th style={{ width: '115px', textAlign: 'right' }}>Variación</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Stock final</th>
                <th>Motivo / Referencia</th>
                <th style={{ width: '145px' }}>Responsable</th>
                <th style={{ textAlign: 'center', width: '60px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando historial de movimientos...
                    </div>
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Archive size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin movimientos coincidentes'
                          : 'Aún no hay movimientos registrados'}
                      </h3>
                      <p>
                        {hayFiltros
                          ? 'Prueba ajustando el rango de fechas o los filtros seleccionados.'
                          : 'Los movimientos se registrarán automáticamente con compras, ventas y ajustes.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movimientos.map((mov) => {
                  const metaTipo = ETIQUETAS_TIPO[mov.tipo] || {
                    texto: mov.tipo,
                    clase: 'movement-text--ajuste',
                  };
                  const esPositivo = mov.cantidad > 0;

                  return (
                    <tr key={mov.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {formatearFecha(mov.created_at)}
                          </div>
                          <div className="table-muted" style={{ fontSize: '0.78rem' }}>
                            {formatearHora(mov.created_at)}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div
                          className="product-cell product-cell--interactive"
                          onClick={() => setMovimientoDetalle(mov)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setMovimientoDetalle(mov);
                          }}
                          title="Ver detalles del movimiento"
                        >
                          <div>
                            <div
                              className="product-name cell-truncate"
                              style={{ maxWidth: '320px' }}
                              title={mov.producto_nombre}
                            >
                              {mov.producto_nombre}
                            </div>
                            <div className="product-meta">
                              <span className="product-code-badge">
                                <Tag size={12} />
                                {mov.producto_codigo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`movement-text ${metaTipo.clase}`}>
                          {metaTipo.texto}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`delta-tag ${esPositivo ? 'delta-tag--positive' : 'delta-tag--negative'}`}
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {esPositivo ? `+${formatearEntero(mov.cantidad)}` : formatearEntero(mov.cantidad)}{' '}
                          {mov.unidad_abreviatura}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatearEntero(mov.stock_resultante)} {mov.unidad_abreviatura}
                        </span>
                      </td>

                      <td>
                        <span
                          className="table-muted cell-truncate"
                          style={{ maxWidth: '340px' }}
                          title={
                            mov.motivo ||
                            (mov.referencia_tipo
                              ? `Operación de ${mov.referencia_tipo.toLowerCase()}`
                              : '-')
                          }
                        >
                          {mov.motivo ||
                            (mov.referencia_tipo
                              ? `Operación de ${mov.referencia_tipo.toLowerCase()}`
                              : '-')}
                        </span>
                      </td>

                      <td>
                        <div>
                          <div
                            className="user-role-text cell-truncate"
                            style={{ maxWidth: '200px' }}
                            title={mov.usuario_nombre}
                          >
                            {mov.usuario_nombre}
                          </div>
                          <div className="table-muted" style={{ fontSize: '0.76rem' }}>
                            @{mov.usuario_username}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setMovimientoDetalle(mov)}
                            title="Ver detalles"
                            aria-label={`Ver detalles del movimiento #${mov.id}`}
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {movimientos.length > 0 ? (
        <Paginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.total_paginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      {/* Modal de Detalle Completo del Movimiento */}
      <Modal
        abierto={Boolean(movimientoDetalle)}
        onCerrar={() => setMovimientoDetalle(null)}
        titulo="Detalle Del Movimiento"
        tamano="md"
        footer={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setMovimientoDetalle(null)}
          >
            Cerrar
          </button>
        }
      >
        {movimientoDetalle ? (
          <div className="detail-grid">
            <div className="detail-item detail-item--full">
              <span className="detail-label">Producto</span>
              <span className="detail-value" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {movimientoDetalle.producto_nombre}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Código Interno</span>
              <span className="detail-value">{movimientoDetalle.producto_codigo}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Operación</span>
              <span className="detail-value">
                <span
                  className={`movement-text ${
                    ETIQUETAS_TIPO[movimientoDetalle.tipo]?.clase || 'movement-text--ajuste'
                  }`}
                >
                  {ETIQUETAS_TIPO[movimientoDetalle.tipo]?.texto || movimientoDetalle.tipo}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Variación De Inventario</span>
              <span className="detail-value">
                <span
                  className={`delta-tag ${
                    movimientoDetalle.cantidad > 0 ? 'delta-tag--positive' : 'delta-tag--negative'
                  }`}
                  style={{ fontSize: '1rem' }}
                >
                  {movimientoDetalle.cantidad > 0
                    ? `+${formatearEntero(movimientoDetalle.cantidad)}`
                    : formatearEntero(movimientoDetalle.cantidad)}{' '}
                  {movimientoDetalle.unidad_abreviatura}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Stock Resultante</span>
              <span className="detail-value" style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                {formatearEntero(movimientoDetalle.stock_resultante)}{' '}
                {movimientoDetalle.unidad_abreviatura}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Fecha Y Hora</span>
              <span className="detail-value">
                {formatearFechaHora(movimientoDetalle.created_at)}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Referencia Del Sistema</span>
              <span className="detail-value">
                {movimientoDetalle.referencia_tipo
                  ? `${movimientoDetalle.referencia_tipo} ${
                      movimientoDetalle.referencia_id ? `#${movimientoDetalle.referencia_id}` : ''
                    }`
                  : 'Ajuste manual directo'}
              </span>
            </div>

            {movimientoDetalle.motivo ? (
              <div className="detail-item detail-item--full">
                <span className="detail-label">Motivo O Justificación</span>
                <div className="detail-value detail-value--box">
                  {movimientoDetalle.motivo}
                </div>
              </div>
            ) : null}

            <div className="detail-item">
              <span className="detail-label">Registrado Por</span>
              <span className="detail-value">{movimientoDetalle.usuario_nombre}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Nombre De Usuario</span>
              <span className="detail-value">@{movimientoDetalle.usuario_username}</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
