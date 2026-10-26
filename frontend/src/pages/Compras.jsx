import { useState, useCallback } from 'react';
import { Plus, ShoppingCart } from 'reicon-react';
import HistorialComprasPanel from '../components/compras/HistorialComprasPanel.jsx';
import NuevaCompraPanel from '../components/compras/NuevaCompraPanel.jsx';

export default function Compras() {
  const [tab, setTab] = useState('historial');
  const [totales, setTotales] = useState({
    historial: 0,
  });

  const [refrescarHistorialKey, setRefrescarHistorialKey] = useState(0);

  const actualizarTotalHistorial = useCallback((total) => {
    setTotales((t) => ({ ...t, historial: total }));
  }, []);

  const onCompraRegistrada = () => {
    setRefrescarHistorialKey((k) => k + 1);
    setTab('historial');
  };

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title">Compras y recepción de mercancía</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {tab === 'historial' ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setTab('nueva')}
            >
              <Plus size={16} />
              Nueva compra
            </button>
          ) : (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setTab('historial')}
            >
              <ShoppingCart size={16} />
              Ver historial
            </button>
          )}
        </div>
      </header>

      <div className="users-tabs">
        <button
          type="button"
          className={`users-tab ${tab === 'historial' ? 'users-tab--active' : ''}`}
          onClick={() => setTab('historial')}
        >
          Historial de compras
          <span className="users-tab-count">{totales.historial}</span>
        </button>

        <button
          type="button"
          className={`users-tab ${tab === 'nueva' ? 'users-tab--active' : ''}`}
          onClick={() => setTab('nueva')}
        >
          Registrar nueva compra
        </button>
      </div>

      <div className="users-content">
        {tab === 'historial' ? (
          <HistorialComprasPanel
            refrescarKey={refrescarHistorialKey}
            onTotalChange={actualizarTotalHistorial}
          />
        ) : (
          <NuevaCompraPanel onCompraRegistrada={onCompraRegistrada} />
        )}
      </div>
    </div>
  );
}
