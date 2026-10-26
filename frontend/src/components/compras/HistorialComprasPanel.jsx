import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Eye,
  FileText,
  Loader,
  Plus,
  Search,
  ShoppingCart,
  X,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
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
        limite: '12',
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
    { valor: '', etiqueta: 'Todos los suplidores' },
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
          <span className="inventory-kpi-label">Facturas registradas</span>
          <span className="inventory-kpi-value">{paginacion.total}</span>
          <span className="inventory-kpi-hint">Total acumulado en el sistema</span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Total en esta página</span>
          <span className="inventory-kpi-value">{formatearMoneda(totalMontoPagina)}</span>
          <span className="inventory-kpi-hint">Suma de las {compras.length} compras visibles</span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Suplidores en catálogo</span>
          <span className="inventory-kpi-value">{suplidores.length}</span>
          <span className="inventory-kpi-hint">Proveedores activos registrados</span>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="users-bar">
        <div className="users-controls" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-box-input"
              placeholder="Buscar por factura o suplidor..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <CustomSelect
            opciones={opcionesSuplidores}
            valor={suplidorId}
            onChange={(val) => {
              setSuplidorId(val);
              setPagina(1);
            }}
            ancho="230px"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Desde:</span>
            <input
              type="date"
              className="input input--sm"
              style={{ width: '135px' }}
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Hasta:</span>
            <input
              type="date"
              className="input input--sm"
              style={{ width: '135px' }}
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          {hayFiltros ? (
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={limpiarFiltros}
              title="Limpiar filtros"
            >
              <X size={14} />
              Limpiar
            </button>
          ) : null}
        </div>
      </div>

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
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>No. Factura</th>
              <th>Suplidor</th>
              <th style={{ textAlign: 'right' }}>Total (RD$)</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  <td><div className="skeleton skeleton--text" style={{ width: '90px' }} /></td>
                  <td><div className="skeleton skeleton--text" style={{ width: '110px' }} /></td>
                  <td><div className="skeleton skeleton--text" style={{ width: '160px' }} /></td>
                  <td><div className="skeleton skeleton--text" style={{ width: '90px', marginLeft: 'auto' }} /></td>
                  <td><div className="skeleton skeleton--badge" /></td>
                  <td><div className="skeleton skeleton--btn" style={{ margin: '0 auto' }} /></td>
                </tr>
              ))
            ) : compras.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div className="empty-state">
                    <ShoppingCart size={36} />
                    <p className="empty-state__title">
                      {hayFiltros
                        ? 'No se encontraron compras con los filtros aplicados'
                        : 'Aún no hay compras registradas'}
                    </p>
                    <p className="empty-state__description">
                      {hayFiltros
                        ? 'Prueba modificando el rango de fechas, suplidor o término de búsqueda.'
                        : 'Utiliza la pestaña "Registrar nueva compra" para ingresar la mercancía recibida.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              compras.map((compra) => (
                <tr key={compra.id}>
                  <td style={{ fontWeight: 600 }}>{formatearFecha(compra.fecha)}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 650 }}>
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
                  <td style={{ textAlign: 'right', fontWeight: 750, color: 'var(--color-ink)' }}>
                    {formatearMoneda(compra.total)}
                  </td>
                  <td>
                    <span
                      className={`compra-status-badge compra-status-badge--${
                        compra.estado === 'COMPLETADA' ? 'completada' : 'anulada'
                      }`}
                    >
                      {compra.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="button button--ghost button--sm"
                      onClick={() => setCompraModalId(compra.id)}
                      title="Ver detalle de la compra"
                      aria-label="Ver detalle"
                    >
                      <Eye size={15} />
                      Detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginacion.total_paginas > 1 ? (
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
