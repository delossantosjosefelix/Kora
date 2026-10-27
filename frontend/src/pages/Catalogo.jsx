import { useCallback, useRef, useState } from 'react';
import { Plus } from 'reicon-react';
import ProductosPanel from '../components/catalogo/ProductosPanel.jsx';
import CategoriasPanel from '../components/catalogo/CategoriasPanel.jsx';
import UnidadesPanel from '../components/catalogo/UnidadesPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';

const TABS_CATALOGO = ['productos', 'categorias', 'unidades'];

export default function Catalogo() {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [tab, setTab] = useState('productos');
  const [direccion, setDireccion] = useState(null);
  const [totales, setTotales] = useState({
    productos: 0,
    categorias: 0,
    unidades: 0,
  });

  const cambiarTab = (nuevaTab) => {
    if (nuevaTab === tab) return;
    const idxActual = TABS_CATALOGO.indexOf(tab);
    const idxNuevo = TABS_CATALOGO.indexOf(nuevaTab);
    setDireccion(idxNuevo >= idxActual ? 'adelante' : 'atras');
    setTab(nuevaTab);
  };

  const productosRef = useRef(null);
  const categoriasRef = useRef(null);
  const unidadesRef = useRef(null);

  const actualizarTotalProductos = useCallback((total) => {
    setTotales((anterior) =>
      anterior.productos === total
        ? anterior
        : { ...anterior, productos: total },
    );
  }, []);

  const actualizarTotalCategorias = useCallback((total) => {
    setTotales((anterior) =>
      anterior.categorias === total
        ? anterior
        : { ...anterior, categorias: total },
    );
  }, []);

  const actualizarTotalUnidades = useCallback((total) => {
    setTotales((anterior) =>
      anterior.unidades === total
        ? anterior
        : { ...anterior, unidades: total },
    );
  }, []);

  const abrirCrear = () => {
    if (tab === 'productos') {
      productosRef.current?.abrirCrear();
    } else if (tab === 'categorias') {
      categoriasRef.current?.abrirCrear();
    } else {
      unidadesRef.current?.abrirCrear();
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h1 className="users-title">Catálogo</h1>

        {puedeGestionar ? (
          <button
            type="button"
            className="button--kora-primary"
            onClick={abrirCrear}
          >
            <Plus size={18} />
            {tab === 'productos'
              ? 'Nuevo Producto'
              : tab === 'categorias'
                ? 'Nueva Categoría'
                : 'Nueva Unidad'}
          </button>
        ) : (
          <span className="badge badge--neutral">Solo lectura</span>
        )}
      </div>

      {/* Pestañas de Navegación del Catálogo */}
      <div className="users-bar" style={{ marginBottom: '16px' }}>
        <div className="users-tabs" role="tablist" aria-label="Secciones del catálogo">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'productos'}
            className={`users-tab${tab === 'productos' ? ' users-tab--active' : ''}`}
            onClick={() => cambiarTab('productos')}
          >
            Productos
            <span className="users-tab-count">{totales.productos ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'categorias'}
            className={`users-tab${tab === 'categorias' ? ' users-tab--active' : ''}`}
            onClick={() => cambiarTab('categorias')}
          >
            Categorías
            <span className="users-tab-count">{totales.categorias ?? 0}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'unidades'}
            className={`users-tab${tab === 'unidades' ? ' users-tab--active' : ''}`}
            onClick={() => cambiarTab('unidades')}
          >
            Unidades
            <span className="users-tab-count">{totales.unidades ?? 0}</span>
          </button>
        </div>
      </div>

      {/* Paneles sincronizados con animación direccional */}
      <div
        hidden={tab !== 'productos'}
        className={`users-page-panel${tab === 'productos' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
        style={{ display: tab === 'productos' ? 'flex' : 'none' }}
      >
        <ProductosPanel
          ref={productosRef}
          onTotalChange={actualizarTotalProductos}
        />
      </div>

      <div
        hidden={tab !== 'categorias'}
        className={`users-page-panel${tab === 'categorias' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
        style={{ display: tab === 'categorias' ? 'flex' : 'none' }}
      >
        <CategoriasPanel
          ref={categoriasRef}
          onTotalChange={actualizarTotalCategorias}
        />
      </div>

      <div
        hidden={tab !== 'unidades'}
        className={`users-page-panel${tab === 'unidades' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
        style={{ display: tab === 'unidades' ? 'flex' : 'none' }}
      >
        <UnidadesPanel
          ref={unidadesRef}
          onTotalChange={actualizarTotalUnidades}
        />
      </div>
    </div>
  );
}
