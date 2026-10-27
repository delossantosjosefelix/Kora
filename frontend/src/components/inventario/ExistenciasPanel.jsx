import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  Barcode,
  Edit,
  Eye,
  Filter,
  Grid,
  List,
  Loader,
  Package,
  Search,
  Tag,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import FilterDrawer from '../ui/FilterDrawer.jsx';
import Modal from '../ui/Modal.jsx';
import Paginacion from '../catalogo/Paginacion.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearEntero, formatearMoneda } from '../../utils/format.js';

const OPCIONES_ESTADO_STOCK = [
  { valor: 'TODOS', etiqueta: 'Todos Los Niveles' },
  { valor: 'NORMAL', etiqueta: 'Nivel Normal' },
  { valor: 'BAJO_STOCK', etiqueta: 'Bajo Stock (Alerta)' },
  { valor: 'AGOTADO', etiqueta: 'Agotados (Stock 0)' },
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
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  const [vista, setVista] = useState(() => {
    try {
      return localStorage.getItem('kora_vista_existencias') || 'tabla';
    } catch {
      return 'tabla';
    }
  });

  const cambiarVista = (nueva) => {
    setVista(nueva);
    setPagina(1);
    try {
      localStorage.setItem('kora_vista_existencias', nueva);
    } catch {
      // Silencioso
    }
  };

  const [productoDetalle, setProductoDetalle] = useState(null);

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
      const limite = vista === 'tarjetas' ? '8' : '7';
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite,
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
  }, [pagina, filtroEstadoStock, busqueda, filtroCategoria, onTotalChange, vista]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  useEffect(() => {
    cargarExistencias();
  }, [cargarExistencias, refrescarKey]);

  const opcionesCategorias = useMemo(() => {
    return [
      { valor: '', etiqueta: 'Todas Las Categorías' },
      ...categorias.map((c) => ({
        valor: String(c.id),
        etiqueta: c.nombre,
      })),
    ];
  }, [categorias]);

  const hayFiltros =
    busqueda.trim() !== '' || filtroCategoria !== '' || filtroEstadoStock !== 'TODOS';

  const filtrosSecundariosActivos =
    (filtroCategoria ? 1 : 0) + (filtroEstadoStock !== 'TODOS' ? 1 : 0);

  return (
    <div className="users-page-panel">
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      {/* Tarjetas KPI de resumen - Limpias y sin lineas laterales */}
      <div className="inventory-kpi-grid">
        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Total referencias</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearEntero(resumen.total_productos) : '-'}
          </span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Bajo stock</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearEntero(resumen.bajo_stock) : '-'}
          </span>
        </div>

        <div className="inventory-kpi-card">
          <span className="inventory-kpi-label">Agotados</span>
          <span className="inventory-kpi-value">
            {resumen ? formatearEntero(resumen.agotados) : '-'}
          </span>
        </div>

        {puedeVerCosto ? (
          <div className="inventory-kpi-card">
            <span className="inventory-kpi-label">Valorización de almacén</span>
            <span className="inventory-kpi-value">
              {resumen && resumen.valor_inventario_costo !== null
                ? formatearMoneda(resumen.valor_inventario_costo)
                : '-'}
            </span>
          </div>
        ) : null}
      </div>

      {/* Barra de Controles con buscador y botón de Filtrar */}
      <div className="users-bar">
        <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
          <Search size={16} className="search-box-icon" />
          <input
            type="search"
            className="search-box-input"
            placeholder="Buscar Producto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            aria-label="Buscar existencias"
          />
        </div>

        <div className="users-controls">
          <div className="view-mode-toggle" role="group" aria-label="Modo de visualización">
            <button
              type="button"
              className={`view-mode-btn${vista === 'tabla' ? ' view-mode-btn--active' : ''}`}
              onClick={() => cambiarVista('tabla')}
              title="Vista En Tabla"
              aria-label="Vista en tabla"
              aria-pressed={vista === 'tabla'}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`view-mode-btn${vista === 'tarjetas' ? ' view-mode-btn--active' : ''}`}
              onClick={() => cambiarVista('tarjetas')}
              title="Vista En Tarjetas"
              aria-label="Vista en tarjetas"
              aria-pressed={vista === 'tarjetas'}
            >
              <Grid size={16} />
            </button>
          </div>

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

      {/* Drawer lateral derecho de filtros */}
      <FilterDrawer
        abierto={filtrosAbierto}
        onCerrar={() => setFiltrosAbierto(false)}
        titulo="Filtros De Existencias"
        totalFiltrosActivos={filtrosSecundariosActivos}
        onLimpiar={() => {
          setFiltroCategoria('');
          setFiltroEstadoStock('TODOS');
          setPagina(1);
        }}
        onAplicar={() => setPagina(1)}
      >
        <div className="filter-drawer-group">
          <label className="filter-drawer-group-label" htmlFor="filtro-categoria-existencias">
            Categoría
          </label>
          <CustomSelect
            id="filtro-categoria-existencias"
            className="custom-select-wrap--form"
            valor={filtroCategoria}
            onChange={(val) => {
              setFiltroCategoria(val);
              setPagina(1);
            }}
            placeholder="Todas Las Categorías"
            opciones={opcionesCategorias}
            aria-label="Filtrar por categoría"
          />
        </div>

        <div className="filter-drawer-group">
          <label className="filter-drawer-group-label" htmlFor="filtro-nivel-stock">
            Nivel De Stock
          </label>
          <CustomSelect
            id="filtro-nivel-stock"
            className="custom-select-wrap--form"
            valor={filtroEstadoStock}
            onChange={(val) => {
              setFiltroEstadoStock(val);
              setPagina(1);
            }}
            placeholder="Todos Los Niveles"
            opciones={OPCIONES_ESTADO_STOCK}
            aria-label="Filtrar por nivel de stock"
          />
        </div>
      </FilterDrawer>

      {/* Contenedor de datos: Tabla o Tarjetas */}
      {vista === 'tabla' ? (
        <div className="users-card">
          <div className="users-table-wrap">
            <table className="users-table users-table--compact">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Existencias</th>
                  <th style={{ textAlign: 'right' }}>Stock mínimo</th>
                  {puedeVerCosto ? (
                    <>
                      <th style={{ textAlign: 'right' }}>Costo unitario</th>
                      <th style={{ textAlign: 'right' }}>Valor total</th>
                    </>
                  ) : null}
                  <th>Nivel</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
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
                        <div
                          className="product-cell product-cell--interactive"
                          onClick={() => setProductoDetalle(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setProductoDetalle(item);
                          }}
                          title="Ver detalles del producto"
                        >
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
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatearEntero(item.stock_actual)}
                        </span>{' '}
                        <span className="table-muted">{item.unidad_abreviatura}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="table-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatearEntero(item.stock_minimo)} {item.unidad_abreviatura}
                        </span>
                      </td>

                      {puedeVerCosto ? (
                        <>
                          <td style={{ textAlign: 'right' }}>
                            <span className="table-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatearMoneda(item.costo)}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {formatearMoneda(item.valor_total_costo)}
                            </span>
                          </td>
                        </>
                      ) : null}

                      <td>
                        <span
                          className={`stock-text stock-text--${item.estado_stock.toLowerCase()}`}
                        >
                          {item.estado_stock === 'AGOTADO'
                            ? 'Agotado'
                            : item.estado_stock === 'BAJO_STOCK'
                              ? 'Bajo stock'
                              : 'Normal'}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => setProductoDetalle(item)}
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${item.nombre}`}
                          >
                            <Eye size={17} />
                          </button>

                          {puedeAjustar ? (
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => onAbrirAjuste(item)}
                              title="Ajustar existencias"
                              aria-label={`Ajustar existencias de ${item.nombre}`}
                            >
                              <Edit size={17} />
                            </button>
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
      ) : (
        <div>
          {cargando ? (
            <div className="products-card-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`skel-inv-card-${i}`} className="product-grid-card">
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: '6px' }} />
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton skeleton--text" style={{ width: '80%' }} />
                    <div className="skeleton skeleton--text" style={{ width: '50%' }} />
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton skeleton--text" style={{ width: '60px' }} />
                    <div className="skeleton skeleton--btn" style={{ width: '32px', height: '32px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : existencias.length === 0 ? (
            <div className="users-card">
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
            </div>
          ) : (
            <div className="products-card-grid">
              {existencias.map((item) => (
                <div key={item.producto_id} className="product-grid-card">
                  <div
                    className="product-grid-card__image-box"
                    onClick={() => setProductoDetalle(item)}
                    title="Ver detalles del producto"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setProductoDetalle(item);
                    }}
                  >
                    <img
                      src={item.imagen_url || '/placeholder-producto.svg'}
                      alt={item.nombre}
                      className="product-grid-card__image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-producto.svg';
                      }}
                    />
                    <span
                      className={`product-status-dot ${
                        item.estado_stock === 'AGOTADO'
                          ? 'product-status-dot--agotado'
                          : item.estado_stock === 'BAJO_STOCK'
                            ? 'product-status-dot--alerta'
                            : 'product-status-dot--normal'
                      }`}
                      title={
                        item.estado_stock === 'AGOTADO'
                          ? 'Stock Agotado'
                          : item.estado_stock === 'BAJO_STOCK'
                            ? 'Bajo Stock'
                            : 'Stock Normal'
                      }
                    />
                  </div>

                  <div className="product-grid-card__body">
                    <h3
                      className="product-grid-card__title"
                      onClick={() => setProductoDetalle(item)}
                      title={item.nombre}
                    >
                      {item.nombre}
                    </h3>

                    <div className="product-grid-card__meta">
                      <div className="product-grid-card__meta-item">
                        <span>Código:</span>
                        <span className="product-grid-card__code">{item.codigo}</span>
                      </div>
                      <div className="product-grid-card__meta-item">
                        <span>Disponible:</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                          {formatearEntero(item.stock_actual)} {item.unidad_abreviatura}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="product-grid-card__footer">
                    <div className="product-grid-card__price-box">
                      {puedeVerCosto && item.costo !== null && item.costo !== undefined ? (
                        <>
                          <span className="product-grid-card__price">
                            {formatearMoneda(item.costo)}
                          </span>
                          <span className="product-grid-card__price-sub">Costo unitario</span>
                        </>
                      ) : (
                        <>
                          <span className="product-grid-card__price">
                            {formatearEntero(item.stock_minimo)} <small style={{ fontSize: '0.75rem', fontWeight: 400 }}>{item.unidad_abreviatura}</small>
                          </span>
                          <span className="product-grid-card__price-sub">Stock mínimo</span>
                        </>
                      )}
                    </div>

                    <div className="product-grid-card__actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setProductoDetalle(item)}
                        aria-label={`Ver detalles de ${item.nombre}`}
                        title="Ver Detalles"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {existencias.length > 0 ? (
        <Paginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.total_paginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      {/* Modal de Detalle del Producto */}
      <Modal
        abierto={Boolean(productoDetalle)}
        onCerrar={() => setProductoDetalle(null)}
        titulo="Detalle Del Producto"
        tamano="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setProductoDetalle(null)}
            >
              Cerrar
            </button>
            {puedeAjustar && productoDetalle ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const item = productoDetalle;
                  setProductoDetalle(null);
                  onAbrirAjuste(item);
                }}
              >
                <Edit size={16} />
                Ajustar Existencias
              </button>
            ) : null}
          </div>
        }
      >
        {productoDetalle ? (
          <div>
            <div className="detail-image-box">
              <img
                src={productoDetalle.imagen_url || '/placeholder-producto.svg'}
                alt={productoDetalle.nombre}
                className="detail-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder-producto.svg';
                }}
              />
            </div>

            <div className="detail-grid">
              <div className="detail-item detail-item--full">
                <span className="detail-label">Nombre Del Producto</span>
                <span className="detail-value" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                  {productoDetalle.nombre}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Código Interno</span>
                <span className="detail-value">{productoDetalle.codigo}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Código De Barras</span>
                <span className="detail-value">
                  {productoDetalle.codigo_barras || 'No registrado'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Categoría</span>
                <span className="detail-value">
                  {productoDetalle.categoria_nombre || 'Sin categoría'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Unidad De Medida</span>
                <span className="detail-value">
                  {productoDetalle.unidad_nombre
                    ? `${productoDetalle.unidad_nombre} (${productoDetalle.unidad_abreviatura})`
                    : productoDetalle.unidad_abreviatura || 'Unidades'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Stock Actual</span>
                <span className="detail-value" style={{ fontWeight: 600 }}>
                  {formatearEntero(productoDetalle.stock_actual)} {productoDetalle.unidad_abreviatura}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Stock Mínimo</span>
                <span className="detail-value">
                  {formatearEntero(productoDetalle.stock_minimo)} {productoDetalle.unidad_abreviatura}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Nivel De Stock</span>
                <span className="detail-value">
                  <span
                    className={`stock-text stock-text--${productoDetalle.estado_stock?.toLowerCase()}`}
                  >
                    {productoDetalle.estado_stock === 'AGOTADO'
                      ? 'Agotado'
                      : productoDetalle.estado_stock === 'BAJO_STOCK'
                        ? 'Bajo stock'
                        : 'Normal'}
                  </span>
                </span>
              </div>

              {puedeVerCosto ? (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Costo Unitario</span>
                    <span className="detail-value">
                      {productoDetalle.costo !== null && productoDetalle.costo !== undefined
                        ? formatearMoneda(productoDetalle.costo)
                        : 'No registrado'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Valor Total En Costo</span>
                    <span className="detail-value" style={{ fontWeight: 600 }}>
                      {formatearMoneda(productoDetalle.valor_total_costo)}
                    </span>
                  </div>
                </>
              ) : null}

              {productoDetalle.descripcion ? (
                <div className="detail-item detail-item--full">
                  <span className="detail-label">Descripción</span>
                  <div className="detail-value detail-value--box">
                    {productoDetalle.descripcion}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
