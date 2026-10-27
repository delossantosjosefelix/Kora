import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  InfoCircle,
  Loader,
  Refresh,
  Vault,
} from 'reicon-react';
import AbrirCajaForm from '../components/caja/AbrirCajaForm.jsx';
import { api } from '../services/api.js';
import { mensajeError } from '../utils/apiError.js';
import { formatearFechaHora, formatearMoneda } from '../utils/format.js';
import notify from '../utils/notify.js';

function TurnoAbiertoCard({ turno }) {
  return (
    <section className="caja-card caja-card--turno" aria-live="polite">
      <div className="caja-card-header">
        <div className="caja-turno-heading">
          <span className="caja-turno-icon">
            <Vault size={22} />
          </span>
          <div>
            <h2 className="caja-card-title">Turno abierto</h2>
            <p className="caja-card-subtitle">
              {turno.caja_nombre} - Iniciado el {formatearFechaHora(turno.fecha_apertura)}
            </p>
          </div>
        </div>
        <span className="badge badge--ok">ABIERTO</span>
      </div>

      <div className="caja-stats">
        <div className="caja-stat">
          <span className="caja-stat-label">Efectivo inicial</span>
          <strong className="caja-stat-value">
            {formatearMoneda(turno.efectivo_inicial)}
          </strong>
        </div>

        <div className="caja-stat">
          <span className="caja-stat-label">Usuario</span>
          <strong className="caja-stat-value caja-stat-value--text">
            {turno.usuario_nombre}
          </strong>
        </div>

        <div className="caja-stat">
          <span className="caja-stat-label">Observación</span>
          <strong className="caja-stat-value caja-stat-value--text">
            {turno.observacion || 'Sin observación'}
          </strong>
        </div>
      </div>

      <div className="alert alert--info caja-note">
        <InfoCircle size={17} />
        <span>No puedes abrir otro turno mientras este permanezca abierto.</span>
      </div>
    </section>
  );
}

function EstadoCajasCard({ cajas }) {
  const cajasActivas = cajas.filter((caja) => caja.activa);
  const disponibles = cajasActivas.filter((caja) => caja.estado === 'DISPONIBLE').length;

  return (
    <section className="caja-card">
      <div className="caja-card-header">
        <div>
          <h2 className="caja-card-title">Estado de las cajas</h2>
          <p className="caja-card-subtitle">
            {disponibles} de {cajasActivas.length} disponibles
          </p>
        </div>
      </div>

      {cajas.length === 0 ? (
        <p className="caja-muted">No hay cajas registradas.</p>
      ) : (
        <ul className="caja-box-list">
          {cajas.map((caja) => {
            const esDisponible = caja.estado === 'DISPONIBLE';
            const esOcupada = caja.estado === 'OCUPADA';

            return (
              <li key={caja.id} className="caja-box-row">
                <span className="caja-box-icon">
                  <Vault size={17} />
                </span>

                <div className="caja-box-info">
                  <span className="caja-box-name">{caja.nombre}</span>
                  <span className="caja-box-meta">
                    {esOcupada && caja.turno
                      ? `${caja.turno.usuario_nombre} - ${formatearFechaHora(caja.turno.fecha_apertura)}`
                      : esDisponible
                        ? 'Lista para abrir un turno'
                        : 'Fuera de servicio'}
                  </span>
                </div>

                <span
                  className={`badge ${
                    esDisponible
                      ? 'badge--ok'
                      : esOcupada
                        ? 'badge--warning'
                        : 'badge--neutral'
                  }`}
                >
                  {esDisponible ? 'Disponible' : esOcupada ? 'Ocupada' : 'Inactiva'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ReglasCajaCard() {
  return (
    <section className="caja-card">
      <h2 className="caja-card-title">Reglas del turno</h2>
      <ul className="caja-rules">
        <li>
          <Check size={16} />
          <span>No hay venta sin un turno de caja abierto.</span>
        </li>
        <li>
          <Check size={16} />
          <span>Solo puedes tener un turno activo a la vez.</span>
        </li>
        <li>
          <Check size={16} />
          <span>El efectivo inicial se cuenta al abrir la caja.</span>
        </li>
      </ul>
    </section>
  );
}

function EstadoVacio({ titulo, texto }) {
  return (
    <section className="caja-card">
      <div className="empty-state caja-empty">
        <span className="empty-state-icon">
          <Vault size={28} />
        </span>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
    </section>
  );
}

export default function Caja() {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [cajas, setCajas] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorApertura, setErrorApertura] = useState('');

  const cargarEstado = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) {
      setCargando(true);
      setErrorCarga('');
    }

    try {
      const respuesta = await api.get('/cajas');

      if (!respuesta.ok) {
        const mensaje = mensajeError(
          respuesta,
          'No se pudo consultar el estado de las cajas.',
        );

        if (silencioso) {
          notify.error(mensaje);
        } else {
          setErrorCarga(mensaje);
        }

        return;
      }

      setCajas(respuesta.datos?.cajas ?? []);
      setTurnoActual(respuesta.datos?.turno_actual ?? null);
    } catch {
      const mensaje = 'No se pudo conectar con el servidor.';

      if (silencioso) {
        notify.error(mensaje);
      } else {
        setErrorCarga(mensaje);
      }
    } finally {
      if (!silencioso) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const cajasDisponibles = useMemo(
    () => cajas.filter((caja) => caja.activa && caja.estado === 'DISPONIBLE'),
    [cajas],
  );

  const abrirCaja = async ({ cajaId, efectivoInicial, observacion }) => {
    if (enviando) {
      return;
    }

    if (turnoActual) {
      setErrorApertura('Ya tienes un turno abierto. Debes cerrarlo antes de abrir otro.');
      return;
    }

    setEnviando(true);
    setErrorApertura('');

    try {
      const respuesta = await api.post('/cajas/turnos', {
        caja_id: cajaId,
        efectivo_inicial: efectivoInicial,
        observacion: observacion || null,
      });

      if (!respuesta.ok) {
        setErrorApertura(
          mensajeError(respuesta, 'No se pudo abrir la caja. Intenta de nuevo.'),
        );
        await cargarEstado({ silencioso: true });
        return;
      }

      notify.success(respuesta.datos?.mensaje ?? 'Caja abierta correctamente.');
      setTurnoActual(respuesta.datos?.turno ?? null);
      await cargarEstado({ silencioso: true });
    } catch {
      setErrorApertura('No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const estadoTexto = errorCarga
    ? 'Estado no disponible'
    : turnoActual
      ? 'Turno abierto'
      : cargando
        ? 'Consultando...'
        : 'Sin turno abierto';

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <h1 className="users-title">Caja</h1>
        </div>

        <div className="caja-header-actions">
          <span className={`badge ${turnoActual ? 'badge--ok' : 'badge--neutral'}`}>
            {estadoTexto}
          </span>

          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => cargarEstado()}
            disabled={cargando || enviando}
          >
            {cargando ? (
              <Loader size={15} className="spin" />
            ) : (
              <Refresh size={15} />
            )}
            Actualizar
          </button>
        </div>
      </header>

      {cargando ? (
        <div className="caja-loading" role="status">
          <Loader size={20} className="spin" />
          <span>Consultando el estado de las cajas...</span>
        </div>
      ) : errorCarga ? (
        <div className="alert alert--error caja-error-carga" role="alert">
          <AlertCircle size={18} />
          <div className="caja-error-text">
            <strong>No se pudo cargar la información</strong>
            <span>{errorCarga}</span>
          </div>
          <button
            type="button"
            className="button button--secondary button--sm"
            onClick={() => cargarEstado()}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="caja-layout">
          <div className="caja-main">
            {turnoActual ? (
              <TurnoAbiertoCard turno={turnoActual} />
            ) : cajasDisponibles.length > 0 ? (
              <AbrirCajaForm
                cajasDisponibles={cajasDisponibles}
                onAbrir={abrirCaja}
                enviando={enviando}
                errorServidor={errorApertura}
              />
            ) : (
              <EstadoVacio
                titulo={
                  cajas.length === 0
                    ? 'No hay cajas registradas'
                    : 'No hay cajas disponibles'
                }
                texto={
                  cajas.length === 0
                    ? 'Pide a un administrador que registre una caja para comenzar a operar.'
                    : 'Todas las cajas están ocupadas. Espera a que se cierre un turno para abrir uno nuevo.'
                }
              />
            )}
          </div>

          <aside className="caja-side">
            <EstadoCajasCard cajas={cajas} />
            <ReglasCajaCard />
          </aside>
        </div>
      )}
    </div>
  );
}
