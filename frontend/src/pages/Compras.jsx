import { useState, useCallback } from 'react';
import { Plus, ShoppingCart } from 'reicon-react';
import HistorialComprasPanel from '../components/compras/HistorialComprasPanel.jsx';
import NuevaCompraPanel from '../components/compras/NuevaCompraPanel.jsx';

const TABS_COMPRAS = ['historial', 'nueva'];

export default function Compras() {
  const [tab, setTab] = useState('historial');
  const [direccion, setDireccion] = useState(null);
  const [totales, setTotales] = useState({
    historial: 0,
  });

  const [refrescarHistorialKey, setRefrescarHistorialKey] = useState(0);

  const cambiarTab = (nuevaTab) => {
    if (nuevaTab === tab) return;
    const idxActual = TABS_COMPRAS.indexOf(tab);
    const idxNuevo = TABS_COMPRAS.indexOf(nuevaTab);
    setDireccion(idxNuevo >= idxActual ? 'adelante' : 'atras');
    setTab(nuevaTab);
  };

  const actualizarTotalHistorial = useCallback((total) => {
    setTotales((t) => ({ ...t, historial: total }));
  }, []);

  const onCompraRegistrada = () => {
    setRefrescarHistorialKey((k) => k + 1);
    cambiarTab('historial');
  };

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title">Compras</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {tab === 'historial' ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() => cambiarTab('nueva')}
            >
              <Plus size={16} />
              Nueva Compra
            </button>
          ) : (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => cambiarTab('historial')}
            >
              <ShoppingCart size={16} />
              Historial
            </button>
          )}
        </div>
      </header>

      <div className="users-tabs">
        <button
          type="button"
          className={`users-tab ${tab === 'historial' ? 'users-tab--active' : ''}`}
          onClick={() => cambiarTab('historial')}
        >
          Historial
          <span className="users-tab-count">{totales.historial}</span>
        </button>

        <button
          type="button"
          className={`users-tab ${tab === 'nueva' ? 'users-tab--active' : ''}`}
          onClick={() => cambiarTab('nueva')}
        >
          Nueva Compra
        </button>
      </div>

      <div className="users-content">
        {tab === 'historial' ? (
          <div key={direccion ? `historial-${direccion}` : 'historial-init'} className={direccion ? `tab-panel--active tab-panel--slide-${direccion}` : ''}>
            <HistorialComprasPanel
              refrescarKey={refrescarHistorialKey}
              onTotalChange={actualizarTotalHistorial}
            />
          </div>
        ) : (
          <div key={direccion ? `nueva-${direccion}` : 'nueva-init'} className={direccion ? `tab-panel--active tab-panel--slide-${direccion}` : ''}>
            <NuevaCompraPanel onCompraRegistrada={onCompraRegistrada} />
          </div>
        )}
      </div>
    </div>
  );
}
