import { useCallback, useRef, useState } from 'react';
import { Plus } from 'reicon-react';
import ProductosPanel from '../components/catalogo/ProductosPanel.jsx';
import CategoriasPanel from '../components/catalogo/CategoriasPanel.jsx';
import UnidadesPanel from '../components/catalogo/UnidadesPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Catalogo() {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [tab, setTab] = useState('productos');
  const [totales, setTotales] = useState({
    productos: 0,
    categorias: 0,
    unidades: 0,
  });

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
              ? 'Nuevo producto'
              : tab === 'categorias'
                ? 'Nueva categoría'
                : 'Nueva unidad'}
          </button>
        ) : (
          <span className="badge badge--neutral">Solo lectura</span>
        )}
      </div>

      <div
        hidden={tab !== 'productos'}
        className="users-page-panel"
        style={{ display: tab === 'productos' ? 'flex' : 'none' }}
      >
        <ProductosPanel
          ref={productosRef}
          tab={tab}
          onCambiarTab={setTab}
          totales={totales}
          onTotalChange={actualizarTotalProductos}
        />
      </div>

      <div
        hidden={tab !== 'categorias'}
        className="users-page-panel"
        style={{ display: tab === 'categorias' ? 'flex' : 'none' }}
      >
        <CategoriasPanel
          ref={categoriasRef}
          tab={tab}
          onCambiarTab={setTab}
          totales={totales}
          onTotalChange={actualizarTotalCategorias}
        />
      </div>

      <div
        hidden={tab !== 'unidades'}
        className="users-page-panel"
        style={{ display: tab === 'unidades' ? 'flex' : 'none' }}
      >
        <UnidadesPanel
          ref={unidadesRef}
          tab={tab}
          onCambiarTab={setTab}
          totales={totales}
          onTotalChange={actualizarTotalUnidades}
        />
      </div>
    </div>
  );
}
