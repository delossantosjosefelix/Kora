import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Archive,
  Loader,
  Search,
  Tag,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import { api } from '../../services/api.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearFecha, formatearNumero } from '../../utils/format.js';

const OPCIONES_TIPO_MOV = [
  { valor: '', etiqueta: 'Todos los movimientos' },
  { valor: 'ENTRADA_COMPRA', etiqueta: 'Entrada por compra' },
  { valor: 'SALIDA_VENTA', etiqueta: 'Salida por venta' },
  { valor: 'AJUSTE', etiqueta: 'Ajuste de inventario' },
  { valor: 'MERMA', etiqueta: 'Merma / daño' },
  { valor: 'DEVOLUCION_CLIENTE', etiqueta: 'Devolución de cliente' },
  { valor: 'ANULACION_VENTA', etiqueta: 'Anulación de venta' },
];

const ETIQUETAS_TIPO = {
  ENTRADA_COMPRA: { texto: 'Compra', clase: 'movement-badge--compra' },
  SALIDA_VENTA: { texto: 'Venta', clase: 'movement-badge--venta' },
  AJUSTE: { texto: 'Ajuste', clase: 'movement-badge--ajuste' },
  MERMA: { texto: 'Merma', clase: 'movement-badge--merma' },
  DEVOLUCION_CLIENTE: { texto: 'Devolución', clase: 'movement-badge--devolucion' },
  ANULACION_VENTA: { texto: 'Anulación', clase: 'movement-badge--anulacion' },
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

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '12',
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

  const limpiarFiltrosFechas = () => {
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  };

  return (
    <div className="users-page-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      {/* Barra de Filtros */}
      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="search"
            className="search-box-input"
            placeholder="Buscar por producto, código o motivo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            aria-label="Buscar movimientos"
          />
        </div>

        <div className="users-controls" style={{ flexWrap: 'wrap' }}>
          <CustomSelect
            valor={filtroTipo}
            onChange={(val) => {
              setFiltroTipo(val);
              setPagina(1);
            }}
            placeholder="Todos los movimientos"
            opciones={OPCIONES_TIPO_MOV}
            aria-label="Filtrar por tipo de movimiento"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              className="input input--sm"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPagina(1);
              }}
              title="Fecha inicial"
              aria-label="Fecha inicial"
            />
            <span className="table-muted">-</span>
            <input
              type="date"
              className="input input--sm"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPagina(1);
              }}
              title="Fecha final"
              aria-label="Fecha final"
            />
            {fechaDesde || fechaHasta ? (
              <button
                type="button"
                className="button button--ghost button--sm"
                onClick={limpiarFiltrosFechas}
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Producto</th>
                <th>Operación</th>
                <th>Variación</th>
                <th>Stock final</th>
                <th>Motivo / Referencia</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando historial de movimientos...
                    </div>
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
                    clase: 'movement-badge--ajuste',
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
                        <div>
                          <div className="product-name">{mov.producto_nombre}</div>
                          <div className="product-meta">
                            <span className="product-code-badge">
                              <Tag size={12} />
                              {mov.producto_codigo}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`movement-badge ${metaTipo.clase}`}>
                          {metaTipo.texto}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`delta-tag ${esPositivo ? 'delta-tag--positive' : 'delta-tag--negative'}`}
                        >
                          {esPositivo ? `+${formatearNumero(mov.cantidad)}` : formatearNumero(mov.cantidad)}{' '}
                          {mov.unidad_abreviatura}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700 }}>
                          {formatearNumero(mov.stock_resultante)} {mov.unidad_abreviatura}
                        </span>
                      </td>

                      <td>
                        <span className="table-muted" style={{ maxWidth: '240px', display: 'inline-block' }}>
                          {mov.motivo ||
                            (mov.referencia_tipo
                              ? `Operación de ${mov.referencia_tipo.toLowerCase()}`
                              : '-')}
                        </span>
                      </td>

                      <td>
                        <div>
                          <div className="user-role-text">{mov.usuario_nombre}</div>
                          <div className="table-muted" style={{ fontSize: '0.76rem' }}>
                            @{mov.usuario_username}
                          </div>
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

      {paginacion.total_paginas > 1 ? (
        <Paginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.total_paginas}
          onCambiarPagina={setPagina}
        />
      ) : null}
    </div>
  );
}
