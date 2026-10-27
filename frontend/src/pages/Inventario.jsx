import { useState, useCallback, useEffect } from 'react';
import { Plus } from 'reicon-react';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../services/api.js';
import ExistenciasPanel from '../components/inventario/ExistenciasPanel.jsx';
import MovimientosPanel from '../components/inventario/MovimientosPanel.jsx';
import SuplidoresPanel from '../components/inventario/SuplidoresPanel.jsx';
import AjusteInventarioModal from '../components/inventario/AjusteInventarioModal.jsx';
import SuplidorModal from '../components/inventario/SuplidorModal.jsx';

const TABS_INVENTARIO = ['existencias', 'movimientos', 'suplidores'];

export default function Inventario() {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;

  const [tab, setTab] = useState('existencias');
  const [direccion, setDireccion] = useState(null);
  const [totales, setTotales] = useState({
    existencias: 0,
    movimientos: 0,
    suplidores: 0,
  });

  const cambiarTab = (nuevaTab) => {
    if (nuevaTab === tab) return;
    const idxActual = TABS_INVENTARIO.indexOf(tab);
    const idxNuevo = TABS_INVENTARIO.indexOf(nuevaTab);
    setDireccion(idxNuevo >= idxActual ? 'adelante' : 'atras');
    setTab(nuevaTab);
  };

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
          <h1 className="users-title">Inventario</h1>
        </div>

        {puedeGestionar ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {tab === 'existencias' ? (
              <button
                type="button"
                className="button button--primary"
                onClick={abrirAjusteGeneral}
              >
                <Plus size={16} />
                Nuevo Ajuste
              </button>
            ) : tab === 'suplidores' ? (
              <button
                type="button"
                className="button button--primary"
                onClick={abrirCrearSuplidor}
              >
                <Plus size={16} />
                Nuevo Suplidor
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
            onClick={() => cambiarTab('existencias')}
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
                onClick={() => cambiarTab('movimientos')}
              >
                Movimientos
                <span className="users-tab-count">{totales.movimientos ?? 0}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={tab === 'suplidores'}
                className={`users-tab${tab === 'suplidores' ? ' users-tab--active' : ''}`}
                onClick={() => cambiarTab('suplidores')}
              >
                Suplidores
                <span className="users-tab-count">{totales.suplidores ?? 0}</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Paneles sincronizados con animación direccional */}
      <div
        className={`users-page-panel${tab === 'existencias' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
        style={{
          display: tab === 'existencias' ? 'flex' : 'none',
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
            className={`users-page-panel${tab === 'movimientos' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
            style={{
              display: tab === 'movimientos' ? 'flex' : 'none',
            }}
            hidden={tab !== 'movimientos'}
          >
            <MovimientosPanel
              refrescarKey={refrescarMovimientosKey}
              onTotalChange={actualizarTotalMovimientos}
            />
          </div>

          <div
            className={`users-page-panel${tab === 'suplidores' && direccion ? ` tab-panel--slide-${direccion}` : ''}`}
            style={{
              display: tab === 'suplidores' ? 'flex' : 'none',
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
