import { useState, useCallback, useEffect } from 'react';
import { Edit, Plus } from 'reicon-react';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../services/api.js';
import ExistenciasPanel from '../components/inventario/ExistenciasPanel.jsx';
import MovimientosPanel from '../components/inventario/MovimientosPanel.jsx';
import SuplidoresPanel from '../components/inventario/SuplidoresPanel.jsx';
import AjusteInventarioModal from '../components/inventario/AjusteInventarioModal.jsx';
import SuplidorModal from '../components/inventario/SuplidorModal.jsx';

export default function Inventario() {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [tab, setTab] = useState('existencias');
  const [totales, setTotales] = useState({
    existencias: 0,
    movimientos: 0,
    suplidores: 0,
  });

  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [productoParaAjuste, setProductoParaAjuste] = useState(null);
  const [productosLista, setProductosLista] = useState([]);

  const [modalSuplidorAbierto, setModalSuplidorAbierto] = useState(false);
  const [suplidorEditando, setSuplidorEditando] = useState(null);

  const [refrescarExistenciasKey, setRefrescarExistenciasKey] = useState(0);
  const [refrescarMovimientosKey, setRefrescarMovimientosKey] = useState(0);
  const [refrescarSuplidoresKey, setRefrescarSuplidoresKey] = useState(0);

  const cargarProductosParaSelect = useCallback(async () => {
    try {
      const res = await api.get('/inventario/existencias?limite=100');
      if (res.ok) {
        setProductosLista(res.datos?.existencias ?? []);
      }
    } catch {
      // Ignorar fallo de carga previa
    }
  }, [refrescarExistenciasKey]);

  useEffect(() => {
    cargarProductosParaSelect();
  }, [cargarProductosParaSelect]);

  const abrirAjusteGeneral = () => {
    setProductoParaAjuste(null);
    setModalAjusteAbierto(true);
  };

  const abrirAjusteEspecifico = (item) => {
    setProductoParaAjuste(item);
    setModalAjusteAbierto(true);
  };

  const abrirCrearSuplidor = () => {
    setSuplidorEditando(null);
    setModalSuplidorAbierto(true);
  };

  const abrirEditarSuplidor = (sup) => {
    setSuplidorEditando(sup);
    setModalSuplidorAbierto(true);
  };

  const onAjusteExitoso = async () => {
    setRefrescarExistenciasKey((k) => k + 1);
    setRefrescarMovimientosKey((k) => k + 1);
  };

  const onSuplidorExitoso = async () => {
    setRefrescarSuplidoresKey((k) => k + 1);
  };

  // Callbacks estables: evitan que los paneles vuelvan a pedir datos en cada render.
  const actualizarTotalExistencias = useCallback((total) => {
    setTotales((t) => ({ ...t, existencias: total }));
  }, []);

  const actualizarTotalMovimientos = useCallback((total) => {
    setTotales((t) => ({ ...t, movimientos: total }));
  }, []);

  const actualizarTotalSuplidores = useCallback((total) => {
    setTotales((t) => ({ ...t, suplidores: total }));
  }, []);

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title">Inventario y existencias</h1>
        </div>

        {puedeGestionar ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {tab === 'existencias' ? (
              <button
                type="button"
                className="button button--primary"
                onClick={abrirAjusteGeneral}
              >
                <Edit size={16} />
                Nuevo ajuste o merma
              </button>
            ) : tab === 'suplidores' ? (
              <button
                type="button"
                className="button button--primary"
                onClick={abrirCrearSuplidor}
              >
                <Plus size={16} />
                Nuevo suplidor
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* Pestañas de Navegación de Inventario */}
      <div className="users-bar" style={{ marginBottom: '16px' }}>
        <div className="users-tabs" role="tablist" aria-label="Secciones de inventario">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'existencias'}
            className={`users-tab${tab === 'existencias' ? ' users-tab--active' : ''}`}
            onClick={() => setTab('existencias')}
          >
            Existencias
            <span className="users-tab-count">{totales.existencias ?? 0}</span>
          </button>

          {puedeGestionar ? (
            <>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'movimientos'}
                className={`users-tab${tab === 'movimientos' ? ' users-tab--active' : ''}`}
                onClick={() => setTab('movimientos')}
              >
                Movimientos
                <span className="users-tab-count">{totales.movimientos ?? 0}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={tab === 'suplidores'}
                className={`users-tab${tab === 'suplidores' ? ' users-tab--active' : ''}`}
                onClick={() => setTab('suplidores')}
              >
                Suplidores
                <span className="users-tab-count">{totales.suplidores ?? 0}</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Paneles sincronizados */}
      <div
        style={{
          display: tab === 'existencias' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '20px',
        }}
        hidden={tab !== 'existencias'}
      >
        <ExistenciasPanel
          onAbrirAjuste={abrirAjusteEspecifico}
          refrescarKey={refrescarExistenciasKey}
          onTotalChange={actualizarTotalExistencias}
        />
      </div>

      {puedeGestionar ? (
        <>
          <div
            style={{
              display: tab === 'movimientos' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '20px',
            }}
            hidden={tab !== 'movimientos'}
          >
            <MovimientosPanel
              refrescarKey={refrescarMovimientosKey}
              onTotalChange={actualizarTotalMovimientos}
            />
          </div>

          <div
            style={{
              display: tab === 'suplidores' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '20px',
            }}
            hidden={tab !== 'suplidores'}
          >
            <SuplidoresPanel
              onAbrirCrear={abrirCrearSuplidor}
              onAbrirEditar={abrirEditarSuplidor}
              refrescarKey={refrescarSuplidoresKey}
              onTotalChange={actualizarTotalSuplidores}
            />
          </div>
        </>
      ) : null}

      {/* Modales */}
      {puedeGestionar ? (
        <>
          <AjusteInventarioModal
            abierto={modalAjusteAbierto}
            onCerrar={() => setModalAjusteAbierto(false)}
            productoSeleccionado={productoParaAjuste}
            productos={productosLista}
            onAjusteExitoso={onAjusteExitoso}
          />

          <SuplidorModal
            abierto={modalSuplidorAbierto}
            onCerrar={() => setModalSuplidorAbierto(false)}
            suplidorEditando={suplidorEditando}
            onGuardadoExitoso={onSuplidorExitoso}
          />
        </>
      ) : null}
    </div>
  );
}
