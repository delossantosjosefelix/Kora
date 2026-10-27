import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Eye,
  Filter,
  Search,
  ShoppingCart,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import CustomDateRangePicker from '../ui/CustomDateRangePicker.jsx';
import FilterDrawer from '../ui/FilterDrawer.jsx';
import InfoTooltip from '../ui/InfoTooltip.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import DetalleCompraModal from './DetalleCompraModal.jsx';
import { api } from '../../services/api.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearFecha, formatearMoneda } from '../../utils/format.js';

export default function HistorialComprasPanel({ refrescarKey, onTotalChange }) {
  const [compras, setCompras] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, total_paginas: 1 });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [suplidorId, setSuplidorId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  const [suplidores, setSuplidores] = useState([]);
  const [compraModalId, setCompraModalId] = useState(null);

  // Cargar lista de suplidores para el filtro
  useEffect(() => {
    async function cargarSuplidores() {
      try {
        const respuesta = await api.get('/suplidores');
        if (respuesta.ok) {
          setSuplidores(respuesta.datos?.suplidores ?? []);
        }
      } catch {
        // Silencioso: el filtro solo no tendrá opciones adicionales
      }
    }
    cargarSuplidores();
  }, []);

  const cargarCompras = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '7',
      });

      if (busqueda.trim()) params.append('busqueda', busqueda.trim());
      if (suplidorId) params.append('suplidorId', suplidorId);
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);

      const respuesta = await api.get(`/compras?${params.toString()}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo cargar el historial de compras.'),
        );
      }

      setCompras(respuesta.datos?.compras ?? []);
      setPaginacion(
        respuesta.datos?.paginacion ?? { total: 0, pagina: 1, total_paginas: 1 },
      );
      onTotalChange?.(respuesta.datos?.paginacion?.total ?? 0);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda, suplidorId, fechaDesde, fechaHasta, onTotalChange]);

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras, refrescarKey]);

  const opcionesSuplidores = [
    { valor: '', etiqueta: 'Todos Los Suplidores' },
    ...suplidores.map((s) => ({ valor: s.id, etiqueta: s.nombre })),
  ];

  const hayFiltros =
    busqueda.trim() !== '' || suplidorId !== '' || fechaDesde !== '' || fechaHasta !== '';

  const limpiarFiltros = () => {
    setBusqueda('');
    setSuplidorId('');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  };

  const totalMontoPagina = compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tarjetas resumen */}
      <div className="inventory-kpi-grid">
        <div className="inventory-kpi-card inventory-kpi-card--primary">
          <span className="inventory-kpi-label">Facturas Registradas</span>
          <span className="inventory-kpi-value">{paginacion.total}</span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Total En Esta Página</span>
          <span className="inventory-kpi-value">{formatearMoneda(totalMontoPagina)}</span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Suplidores En Catálogo</span>
          <span className="inventory-kpi-value">{suplidores.length}</span>
        </div>
      </div>

      {/* Barra de filtros con buscador y botón de Filtrar */}
      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            className="search-box-input"
            placeholder="Buscar Compra..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        <div className="users-controls">
          <button
            type="button"
            className={`button button--secondary filter-trigger-btn${(suplidorId ? 1 : 0) + (fechaDesde || fechaHasta ? 1 : 0) > 0 ? ' filter-trigger-btn--active' : ''}`}
            onClick={() => setFiltrosAbierto(true)}
            aria-label="Abrir panel de filtros"
          >
            <Filter size={16} />
            <span>Filtrar</span>
            {(suplidorId ? 1 : 0) + (fechaDesde || fechaHasta ? 1 : 0) > 0 ? (
              <span className="filter-badge">
                {(suplidorId ? 1 : 0) + (fechaDesde || fechaHasta ? 1 : 0)}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Drawer lateral derecho para filtros */}
      <FilterDrawer
        abierto={filtrosAbierto}
        onCerrar={() => setFiltrosAbierto(false)}
        titulo="Filtros De Compras"
        totalFiltrosActivos={(suplidorId ? 1 : 0) + (fechaDesde || fechaHasta ? 1 : 0)}
        onLimpiar={limpiarFiltros}
        onAplicar={() => setPagina(1)}
      >
        <div className="filter-drawer-group">
          <label className="filter-drawer-group-label" htmlFor="filtro-suplidor-compras">
            Suplidor
          </label>
          <CustomSelect
            id="filtro-suplidor-compras"
            className="custom-select-wrap--form"
            opciones={opcionesSuplidores}
            valor={suplidorId}
            onChange={(val) => {
              setSuplidorId(val);
              setPagina(1);
            }}
            placeholder="Todos Los Suplidores"
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

      {/* Mensaje de error de carga */}
      {errorCarga ? (
        <div className="alert alert--error">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {errorCarga}
          </div>
        </div>
      ) : null}

      {/* Tabla de compras */}
      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table users-table--compact">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Fecha</th>
                <th style={{ width: '150px' }}>No. Factura</th>
                <th>Suplidor</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Total (RD$)</th>
                <th style={{ width: '110px' }}>Estado</th>
                <th style={{ textAlign: 'center', width: '70px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td><div className="skeleton skeleton--text" style={{ width: '90px' }} /></td>
                    <td><div className="skeleton skeleton--text" style={{ width: '110px' }} /></td>
                    <td><div className="skeleton skeleton--text" style={{ width: '160px' }} /></td>
                    <td><div className="skeleton skeleton--text" style={{ width: '90px', marginLeft: 'auto' }} /></td>
                    <td><div className="skeleton skeleton--text" style={{ width: '70px' }} /></td>
                    <td><div className="skeleton skeleton--btn" style={{ margin: '0 auto' }} /></td>
                  </tr>
                ))
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <div className="empty-state">
                      <ShoppingCart size={36} />
                      <p
                        className="empty-state__title"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: 'center',
                          margin: 0,
                        }}
                      >
                        <span>
                          {hayFiltros
                            ? 'No Se Encontraron Compras'
                            : 'Sin Compras Registradas'}
                        </span>
                        <InfoTooltip
                          tipo="help"
                          texto={
                            hayFiltros
                              ? 'Prueba modificando el rango de fechas, suplidor o término de búsqueda.'
                              : 'Utiliza la pestaña Nueva Compra para ingresar la mercancía recibida.'
                          }
                        />
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id}>
                    <td style={{ fontWeight: 600 }}>{formatearFecha(compra.fecha)}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {compra.numero_factura_suplidor || 'Sin número'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                        {compra.suplidor_nombre || 'Desconocido'}
                      </div>
                      {compra.observacion ? (
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                          {compra.observacion}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-ink)' }}>
                      {formatearMoneda(compra.total)}
                    </td>
                    <td>
                      <span
                        className={`user-status-text ${
                          compra.estado === 'COMPLETADA'
                            ? 'user-status-text--active'
                            : 'user-status-text--inactive'
                        }`}
                      >
                        {compra.estado === 'COMPLETADA' ? 'Completada' : 'Anulada'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setCompraModalId(compra.id)}
                          title="Ver detalle de la compra"
                          aria-label="Ver detalle"
                        >
                          <Eye size={16} />
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

      {/* Paginación */}
      {compras.length > 0 ? (
        <Paginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.total_paginas}
          onCambiarPagina={(nueva) => setPagina(nueva)}
        />
      ) : null}

      {/* Modal de detalle */}
      <DetalleCompraModal
        abierto={Boolean(compraModalId)}
        onCerrar={() => setCompraModalId(null)}
        compraId={compraModalId}
      />
    </div>
  );
}
