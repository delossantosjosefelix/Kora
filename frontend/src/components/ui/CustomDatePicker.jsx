import { useEffect, useId, useRef, useState } from 'react';
import { AngleDown, AngleLeft, AngleRight, Calendar } from 'reicon-react';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_CABECERA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function parseFechaLocal(str) {
  if (!str) return null;
  const partes = String(str).split('T')[0].split('-');
  if (partes.length !== 3) return null;
  const [año, mes, dia] = partes.map(Number);
  if (!año || !mes || !dia) return null;
  return new Date(año, mes - 1, dia);
}

function formatearFechaLocal(fecha) {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return '';
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

function formatearEtiqueta(str) {
  const f = parseFechaLocal(str);
  if (!f) return '';
  const dia = f.getDate();
  const mesNombre = MESES[f.getMonth()].slice(0, 3).toLowerCase();
  const año = f.getFullYear();
  return `${dia} ${mesNombre}, ${año}`;
}

function mismoDia(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function CustomDatePicker({
  valor = '',
  onChange,
  placeholder = 'Seleccionar fecha',
  id,
  name,
  disabled = false,
  className = '',
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const idGenerado = useId();
  const pickerId = id || idGenerado;

  const fechaSeleccionada = parseFechaLocal(valor);
  const fechaRef = fechaSeleccionada || new Date();

  const [añoVista, setAñoVista] = useState(fechaRef.getFullYear());
  const [mesVista, setMesVista] = useState(fechaRef.getMonth());

  useEffect(() => {
    if (valor) {
      const f = parseFechaLocal(valor);
      if (f) {
        setAñoVista(f.getFullYear());
        setMesVista(f.getMonth());
      }
    }
  }, [valor]);

  useEffect(() => {
    if (!abierto) return undefined;

    const manejarClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    const manejarTecla = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    document.addEventListener('keydown', manejarTecla);

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [abierto]);

  const mesAnterior = (e) => {
    e.stopPropagation();
    if (mesVista === 0) {
      setMesVista(11);
      setAñoVista((prev) => prev - 1);
    } else {
      setMesVista((prev) => prev - 1);
    }
  };

  const mesSiguiente = (e) => {
    e.stopPropagation();
    if (mesVista === 11) {
      setMesVista(0);
      setAñoVista((prev) => prev + 1);
    } else {
      setMesVista((prev) => prev + 1);
    }
  };

  const primerDiaMes = new Date(añoVista, mesVista, 1);
  const diaSemanaInicio = (primerDiaMes.getDay() + 6) % 7;
  const ultimoDiaMes = new Date(añoVista, mesVista + 1, 0).getDate();
  const ultimoDiaMesAnterior = new Date(añoVista, mesVista, 0).getDate();

  const diasDelMes = [];

  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    diasDelMes.push({
      fecha: new Date(añoVista, mesVista - 1, ultimoDiaMesAnterior - i),
      esMesActual: false,
    });
  }

  for (let d = 1; d <= ultimoDiaMes; d++) {
    diasDelMes.push({
      fecha: new Date(añoVista, mesVista, d),
      esMesActual: true,
    });
  }

  const sobrantes = 42 - diasDelMes.length;
  for (let d = 1; d <= sobrantes; d++) {
    diasDelMes.push({
      fecha: new Date(añoVista, mesVista + 1, d),
      esMesActual: false,
    });
  }

  const hoyDate = new Date();

  const seleccionarDia = (fecha) => {
    const iso = formatearFechaLocal(fecha);
    onChange?.(iso);
    setAbierto(false);
  };

  const irAHoy = (e) => {
    e.stopPropagation();
    const hoyIso = formatearFechaLocal(hoyDate);
    onChange?.(hoyIso);
    setAñoVista(hoyDate.getFullYear());
    setMesVista(hoyDate.getMonth());
    setAbierto(false);
  };

  return (
    <div
      ref={contenedorRef}
      className={`custom-date-wrap custom-date-wrap--block ${className}`}
    >
      <button
        id={pickerId}
        name={name}
        type="button"
        disabled={disabled}
        className={`custom-select-trigger custom-select-trigger--filled ${
          abierto ? 'custom-select-trigger--open' : ''
        }`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '38px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.86rem',
        }}
        onClick={() => !disabled && setAbierto((prev) => !prev)}
        aria-expanded={abierto}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 500, color: valor ? 'var(--color-ink)' : 'var(--color-text-muted)' }}>
            {valor ? formatearEtiqueta(valor) : placeholder}
          </span>
        </span>
        <AngleDown size={14} style={{ color: 'var(--color-text-subtle)' }} />
      </button>

      {abierto ? (
        <div
          className="custom-date-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 'auto',
            zIndex: 100,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            padding: '12px',
            width: '280px',
          }}
        >
          {/* Navegación del mes */}
          <div className="custom-date-nav" style={{ marginBottom: '10px' }}>
            <button
              type="button"
              className="icon-button"
              onClick={mesAnterior}
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <AngleLeft size={16} />
            </button>

            <span className="custom-date-month-title" style={{ fontWeight: 600 }}>
              {MESES[mesVista]} {añoVista}
            </span>

            <button
              type="button"
              className="icon-button"
              onClick={mesSiguiente}
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <AngleRight size={16} />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="custom-date-weekdays">
            {DIAS_CABECERA.map((d) => (
              <span key={d} className="custom-date-weekday">
                {d}
              </span>
            ))}
          </div>

          {/* Cuadrícula de días */}
          <div className="custom-date-days-grid">
            {diasDelMes.map(({ fecha, esMesActual }, idx) => {
              const str = formatearFechaLocal(fecha);
              const esHoy = mismoDia(fecha, hoyDate);
              const esSeleccionado = valor === str;

              let claseDia = 'custom-date-day';
              if (!esMesActual) claseDia += ' custom-date-day--muted';
              if (esHoy) claseDia += ' custom-date-day--today';
              if (esSeleccionado) claseDia += ' custom-date-day--start';

              return (
                <button
                  key={`${str}-${idx}`}
                  type="button"
                  className={claseDia}
                  onClick={() => seleccionarDia(fecha)}
                >
                  <span className="custom-date-day-num">{fecha.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* Pie */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              marginTop: '10px',
              paddingTop: '8px',
            }}
          >
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={irAHoy}
            >
              Hoy
            </button>
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => setAbierto(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
