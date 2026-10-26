import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  Barcode,
  Edit,
  Loader,
  Package,
  Search,
  Tag,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearMoneda, formatearNumero } from '../../utils/format.js';

const OPCIONES_ESTADO_STOCK = [
  { valor: 'TODOS', etiqueta: 'Todos los niveles' },
  { valor: 'NORMAL', etiqueta: 'Nivel normal' },
  { valor: 'BAJO_STOCK', etiqueta: 'Bajo stock (alerta)' },
  { valor: 'AGOTADO', etiqueta: 'Agotados (stock 0)' },
];

export default function ExistenciasPanel({
  onAbrirAjuste,
  refrescarKey,
  onTotalChange,
}) {
  const { esAdministrador, esGerente } = useAuth();
  const puedeVerCosto = esAdministrador || esGerente;
  const puedeAjustar = esAdministrador || esGerente;

  const [existencias, setExistencias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, total_paginas: 1 });
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroEstadoStock, setFiltroEstadoStock] = useState('TODOS');
  const [pagina, setPagina] = useState(1);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await api.get('/categorias');
      if (res.ok) {
        setCategorias(res.datos?.categorias ?? []);
      }
    } catch {
      // Ignorar fallo secundario
    }
  }, []);

  const cargarExistencias = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: '10',
        estadoStock: filtroEstadoStock,
      });

      if (busqueda.trim()) {
        params.append('busqueda', busqueda.trim());
      }

      if (filtroCategoria) {
        params.append('categoriaId', filtroCategoria);
      }

      const respuesta = await api.get(`/inventario/existencias?${params.toString()}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudieron cargar las existencias de inventario.'),
        );
      }

      setExistencias(respuesta.datos?.existencias ?? []);
      setResumen(respuesta.datos?.resumen ?? null);
      setPaginacion(
        respuesta.datos?.paginacion ?? { total: 0, pagina: 1, total_paginas: 1 },
      );
      onTotalChange?.(respuesta.datos?.paginacion?.total ?? 0);
    } catch (error) {
      setErrorCarga(error.message);
    } finally {
      setCargando(false);
    }
  }, [pagina, filtroEstadoStock, busqueda, filtroCategoria, onTotalChange]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    cargarExistencias();
  }, [cargarExistencias, refrescarKey]);

  const opcionesCategorias = useMemo(() => {
    return [
      { valor: '', etiqueta: 'Todas las categorías' },
      ...categorias.map((c) => ({
        valor: String(c.id),
        etiqueta: c.nombre,
      })),
    ];
  }, [categorias]);

  const hayFiltros =
    busqueda.trim() !== '' || filtroCategoria !== '' || filtroEstadoStock !== 'TODOS';

  return (
    <div className="users-page-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      {/* Tarjetas KPI de resumen */}
      <div className="inventory-kpi-grid">
        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Total referencias</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearNumero(resumen.total_productos) : '-'}
          </span>
          <span className="inventory-kpi-hint">Productos activos en catálogo</span>
        </div>

        <div className="inventory-kpi-card inventory-kpi-card--warning">
          <span className="inventory-kpi-label">Bajo stock</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearNumero(resumen.bajo_stock) : '-'}
          </span>
          <span className="inventory-kpi-hint">Por debajo del stock mínimo</span>
        </div>

        <div className="inventory-kpi-card inventory-kpi-card--danger">
          <span className="inventory-kpi-label">Agotados</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearNumero(resumen.agotados) : '-'}
          </span>
          <span className="inventory-kpi-hint">Sin existencias para venta</span>
        </div>

        {puedeVerCosto ? (
          <div className="inventory-kpi-card inventory-kpi-card--primary">
            <span className="inventory-kpi-label">Valorización de almacén</span>
            <span className="inventory-kpi-value">
              {resumen && resumen.valor_inventario_costo !== null
                ? formatearMoneda(resumen.valor_inventario_costo)
                : '-'}
            </span>
            <span className="inventory-kpi-hint">Costo total de existencias</span>
          </div>
        ) : null}
      </div>

      {/* Barra de Controles y Filtros */}
      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="search"
            className="search-box-input"
            placeholder="Buscar por producto, código o barras..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            aria-label="Buscar existencias"
          />
        </div>

        <div className="users-controls">
          <CustomSelect
            valor={filtroCategoria}
            onChange={(val) => {
              setFiltroCategoria(val);
              setPagina(1);
            }}
            placeholder="Todas las categorías"
            opciones={opcionesCategorias}
            aria-label="Filtrar por categoría"
          />

          <CustomSelect
            valor={filtroEstadoStock}
            onChange={(val) => {
              setFiltroEstadoStock(val);
              setPagina(1);
            }}
            placeholder="Todos los niveles"
            opciones={OPCIONES_ESTADO_STOCK}
            aria-label="Filtrar por nivel de stock"
          />
        </div>
      </div>

      {/* Tabla de existencias */}
      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Existencias</th>
                <th>Stock mínimo</th>
                {puedeVerCosto ? (
                  <>
                    <th>Costo unitario</th>
                    <th>Valor total</th>
                  </>
                ) : null}
                <th>Nivel</th>
                {puedeAjustar ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={puedeVerCosto ? 8 : 6}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando existencias...
                    </div>
                  </td>
                </tr>
              ) : existencias.length === 0 ? (
                <tr>
                  <td colSpan={puedeVerCosto ? 8 : 6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Package size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'No hay productos registrados en inventario'}
                      </h3>
                      <p>
                        {hayFiltros
                          ? 'Intenta modificando los filtros de búsqueda o categoría.'
                          : 'Comienza creando productos desde la sección de Catálogo.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                existencias.map((item) => (
                  <tr key={item.producto_id}>
                    <td>
                      <div className="product-cell">
                        <img
                          src={item.imagen_url || '/placeholder-producto.svg'}
                          alt={item.nombre}
                          className="product-thumbnail"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-producto.svg';
                          }}
                        />
                        <div>
                          <div className="product-name">{item.nombre}</div>
                          <div className="product-meta">
                            <span className="product-code-badge" title="Código interno">
                              <Tag size={12} />
                              {item.codigo}
                            </span>
                            {item.codigo_barras ? (
                              <span className="product-code-badge" title="Código de barras">
                                <Barcode size={12} />
                                {item.codigo_barras}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="user-role-text">
                        {item.categoria_nombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                          {formatearNumero(item.stock_actual)}
                        </span>
                        <span className="table-muted">{item.unidad_abreviatura}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-muted">
                        {formatearNumero(item.stock_minimo)} {item.unidad_abreviatura}
                      </span>
                    </td>

                    {puedeVerCosto ? (
                      <>
                        <td>
                          <span className="table-muted">
                            {formatearMoneda(item.costo)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {formatearMoneda(item.valor_total_costo)}
                          </span>
                        </td>
                      </>
                    ) : null}

                    <td>
                      <span
                        className={`stock-badge stock-badge--${item.estado_stock.toLowerCase()}`}
                      >
                        {item.estado_stock === 'AGOTADO'
                          ? 'Agotado'
                          : item.estado_stock === 'BAJO_STOCK'
                            ? 'Bajo stock'
                            : 'Normal'}
                      </span>
                    </td>

                    {puedeAjustar ? (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button button--secondary button--sm"
                            onClick={() => onAbrirAjuste(item)}
                            title="Ajustar existencias o registrar merma"
                            aria-label={`Ajustar existencias de ${item.nombre}`}
                          >
                            <Edit size={14} />
                            Ajustar
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
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
