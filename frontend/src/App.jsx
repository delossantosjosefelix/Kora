import { useCallback, useEffect, useState } from 'react';
import BrandLogo from './components/BrandLogo.jsx';
import notify from './utils/notify.js';
import './styles/app.css';

const formatoHora = new Intl.DateTimeFormat('es-DO', {
  dateStyle: 'long',
  timeStyle: 'medium',
});

export default function App() {
  const [estado, setEstado] = useState('cargando');
  const [salud, setSalud] = useState(null);
  const [mensajeError, setMensajeError] = useState('');

  const consultarSalud = useCallback(async () => {
    setEstado('cargando');
    setMensajeError('');

    try {
      const respuesta = await fetch('/api/health', {
        headers: { Accept: 'application/json' },
      });
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok || !datos?.ok) {
        throw new Error(datos?.mensaje || 'La API no respondió correctamente.');
      }

      setSalud(datos);
      setEstado('conectada');
      notify.success('API conectada correctamente', { id: 'estado-api' });
    } catch (error) {
      setSalud(null);
      setEstado('error');
      setMensajeError(
        error.message === 'Failed to fetch'
          ? 'No se pudo contactar con la API. Verifica que el backend esté encendido en el puerto 3000.'
          : error.message,
      );
      notify.error('No se pudo conectar con la API', { id: 'estado-api' });
    }
  }, []);

  useEffect(() => {
    consultarSalud();
  }, [consultarSalud]);

  const cargando = estado === 'cargando';
  const conectada = estado === 'conectada';

  const titulo = cargando
    ? 'Comprobando la API...'
    : conectada
      ? 'API conectada'
      : 'Sin conexión con la API';

  const descripcion = cargando
    ? 'Estamos consultando el estado de Kora y su base de datos.'
    : conectada
      ? 'El backend de Kora está en línea y PostgreSQL respondió correctamente.'
      : mensajeError;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BrandLogo className="brand-logo" alt="" />
          <div>
            <span className="brand-name">Kora</span>
            <span className="brand-subtitle">Punto de venta</span>
          </div>
        </div>
        <span className="topbar-badge">Día 1 · Proyecto base</span>
      </header>

      <main className="main">
        <section className="status-card" aria-live="polite">
          <div className={`status-icon status-icon--${estado}`} aria-hidden="true">
            {cargando ? <span className="spinner" /> : conectada ? '✓' : '!'}
          </div>

          <p className="eyebrow">Estado del sistema</p>
          <h1>{titulo}</h1>
          <p className="status-message">{descripcion}</p>

          <dl className="status-details">
            <div className="status-row">
              <dt>API</dt>
              <dd className={conectada ? 'is-ok' : estado === 'error' ? 'is-error' : ''}>
                {cargando ? 'Comprobando' : conectada ? 'En línea' : 'Sin respuesta'}
              </dd>
            </div>
            <div className="status-row">
              <dt>Base de datos</dt>
              <dd className={conectada ? 'is-ok' : estado === 'error' ? 'is-error' : ''}>
                {salud?.baseDatos || (cargando ? 'Comprobando' : 'Sin conexión')}
              </dd>
            </div>
            <div className="status-row">
              <dt>Hora de PostgreSQL</dt>
              <dd>
                {salud?.horaBaseDatos
                  ? formatoHora.format(new Date(salud.horaBaseDatos))
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className="status-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={consultarSalud}
              disabled={cargando}
            >
              {cargando ? 'Comprobando...' : 'Volver a comprobar'}
            </button>
            <span className="status-footnote">
              <code>/api/health</code> · PostgreSQL
            </span>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Kora · Prototipo académico</span>
        <span>Recibo interno, no válido como comprobante fiscal.</span>
      </footer>
    </div>
  );
}
