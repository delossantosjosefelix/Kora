import { useCallback, useRef, useState } from 'react';
import { Plus } from 'reicon-react';
import CategoriasPanel from '../components/catalogo/CategoriasPanel.jsx';
import UnidadesPanel from '../components/catalogo/UnidadesPanel.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Catalogo() {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [tab, setTab] = useState('categorias');
  const [totales, setTotales] = useState({
    categorias: 0,
    unidades: 0,
  });

  const categoriasRef = useRef(null);
  const unidadesRef = useRef(null);

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
    const panel =
      tab === 'categorias' ? categoriasRef.current : unidadesRef.current;

    panel?.abrirCrear();
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="users-title">Catálogo</h1>
          <p className="page-subtitle">
            Categorías y unidades de medida del catálogo.
          </p>
        </div>

        {puedeGestionar ? (
          <button
            type="button"
            className="button--kora-primary"
            onClick={abrirCrear}
          >
            <Plus size={18} />
            {tab === 'categorias' ? 'Nueva categoría' : 'Nueva unidad'}
          </button>
        ) : (
          <span className="badge badge--neutral">Solo lectura</span>
        )}
      </div>

      <div hidden={tab !== 'categorias'}>
        <CategoriasPanel
          ref={categoriasRef}
          tab={tab}
          onCambiarTab={setTab}
          totales={totales}
          onTotalChange={actualizarTotalCategorias}
        />
      </div>

      <div hidden={tab !== 'unidades'}>
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
