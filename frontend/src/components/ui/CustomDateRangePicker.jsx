import { useState, useEffect, useRef, useId, useMemo } from 'react';
import {
  AngleDown,
  AngleLeft,
  AngleRight,
  Calendar,
  XCircle,
} from 'reicon-react';

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

function formatearEtiquetaFecha(str) {
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

export default function CustomDateRangePicker({
  fechaDesde = '',
  fechaHasta = '',
  onChange,
  placeholder = 'Filtrar Por Fechas',
  className = '',
  desglosado = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const idGenerado = useId();

  // Fecha de referencia para el calendario visible (año y mes)
  const fechaInicialRef = parseFechaLocal(fechaDesde) || new Date();
  const [añoVista, setAñoVista] = useState(fechaInicialRef.getFullYear());
  const [mesVista, setMesVista] = useState(fechaInicialRef.getMonth());

  // Rango en edición temporal
  const [tempDesde, setTempDesde] = useState(fechaDesde);
  const [tempHasta, setTempHasta] = useState(fechaHasta);
  const [hoverDate, setHoverDate] = useState(null);

  useEffect(() => {
    setTempDesde(fechaDesde);
    setTempHasta(fechaHasta);
    if (fechaDesde) {
      const f = parseFechaLocal(fechaDesde);
      if (f) {
        setAñoVista(f.getFullYear());
        setMesVista(f.getMonth());
      }
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    if (desglosado || !abierto) return undefined;

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
  }, [abierto, desglosado]);

  const mesAnterior = () => {
    if (mesVista === 0) {
      setMesVista(11);
      setAñoVista((a) => a - 1);
    } else {
      setMesVista((m) => m - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesVista === 11) {
      setMesVista(0);
      setAñoVista((a) => a + 1);
    } else {
      setMesVista((m) => m + 1);
    }
  };

  const diasDelMes = useMemo(() => {
    const primerDiaMes = new Date(añoVista, mesVista, 1);
    const ultimoDiaMes = new Date(añoVista, mesVista + 1, 0);

    // Ajuste lunes = 0, domingo = 6
    const diaInicio = (primerDiaMes.getDay() + 6) % 7;
    const totalDias = ultimoDiaMes.getDate();

    const dias = [];

    // Días del mes anterior para rellenar
    const ultimoDiaMesAnterior = new Date(añoVista, mesVista, 0).getDate();
    for (let i = diaInicio - 1; i >= 0; i--) {
      dias.push({
        fecha: new Date(añoVista, mesVista - 1, ultimoDiaMesAnterior - i),
        esMesActual: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDias; d++) {
      dias.push({
        fecha: new Date(añoVista, mesVista, d),
        esMesActual: true,
      });
    }

    // Días del mes siguiente para completar cuadrícula (múltiplo de 7)
    const restante = (7 - (dias.length % 7)) % 7;
    for (let s = 1; s <= restante; s++) {
      dias.push({
        fecha: new Date(añoVista, mesVista + 1, s),
        esMesActual: false,
      });
    }

    return dias;
  }, [añoVista, mesVista]);

  const clickDia = (fecha) => {
    const str = formatearFechaLocal(fecha);

    if (!tempDesde || (tempDesde && tempHasta)) {
      // Comenzar nueva selección
      setTempDesde(str);
      setTempHasta('');
      onChange?.({ fechaDesde: str, fechaHasta: '' });
    } else if (tempDesde && !tempHasta) {
      // Completar el rango
      const fDesde = parseFechaLocal(tempDesde);
      let desdeFinal = tempDesde;
      let hastaFinal = str;
      if (fecha < fDesde) {
        desdeFinal = str;
        hastaFinal = tempDesde;
      }
      setTempDesde(desdeFinal);
      setTempHasta(hastaFinal);
      onChange?.({ fechaDesde: desdeFinal, fechaHasta: hastaFinal });
      if (!desglosado) {
        setAbierto(false);
      }
    }
  };

  const aplicarPreset = (tipo) => {
    const hoy = new Date();
    let desde = '';
    let hasta = '';

    if (tipo === 'HOY') {
      desde = formatearFechaLocal(hoy);
      hasta = formatearFechaLocal(hoy);
    } else if (tipo === 'AYER') {
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      desde = formatearFechaLocal(ayer);
      hasta = formatearFechaLocal(ayer);
    } else if (tipo === '7DIAS') {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - 6);
      desde = formatearFechaLocal(inicio);
      hasta = formatearFechaLocal(hoy);
    } else if (tipo === '30DIAS') {
      const inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - 29);
      desde = formatearFechaLocal(inicio);
      hasta = formatearFechaLocal(hoy);
    } else if (tipo === 'ESTE_MES') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      desde = formatearFechaLocal(inicio);
      hasta = formatearFechaLocal(fin);
    }

    setTempDesde(desde);
    setTempHasta(hasta);
    const f = parseFechaLocal(desde);
    if (f) {
      setAñoVista(f.getFullYear());
      setMesVista(f.getMonth());
    }
    onChange?.({ fechaDesde: desde, fechaHasta: hasta });
    if (!desglosado) {
      setAbierto(false);
    }
  };

  const limpiar = () => {
    setTempDesde('');
    setTempHasta('');
    onChange?.({ fechaDesde: '', fechaHasta: '' });
    if (!desglosado) {
      setAbierto(false);
    }
  };

  const textoBoton = useMemo(() => {
    if (fechaDesde && fechaHasta) {
      if (fechaDesde === fechaHasta) {
        return formatearEtiquetaFecha(fechaDesde);
      }
      const d = parseFechaLocal(fechaDesde);
      const h = parseFechaLocal(fechaHasta);
      if (d && h && d.getFullYear() === h.getFullYear()) {
        const diaD = d.getDate();
        const mesD = MESES[d.getMonth()].slice(0, 3).toLowerCase();
        const diaH = h.getDate();
        const mesH = MESES[h.getMonth()].slice(0, 3).toLowerCase();
        return `${diaD} ${mesD} - ${diaH} ${mesH}, ${d.getFullYear()}`;
      }
      return `${formatearEtiquetaFecha(fechaDesde)} - ${formatearEtiquetaFecha(fechaHasta)}`;
    }
    if (fechaDesde) return `Desde ${formatearEtiquetaFecha(fechaDesde)}`;
    if (fechaHasta) return `Hasta ${formatearEtiquetaFecha(fechaHasta)}`;
    return placeholder;
  }, [fechaDesde, fechaHasta, placeholder]);

  const haySeleccion = Boolean(fechaDesde || fechaHasta);
  const fDesdeDate = parseFechaLocal(tempDesde);
  const fHastaDate = parseFechaLocal(tempHasta);
  const hoyDate = new Date();

  // MODO DESGLOSADO / INLINE (incorporado directamente en el panel sin dropdown)
  if (desglosado) {
    return (
      <div className={`custom-date-inline${className ? ` ${className}` : ''}`}>
        <div className="custom-date-inline-header">
          <div className="custom-date-inline-label">
            <Calendar size={15} />
            <span>{textoBoton}</span>
          </div>
          {haySeleccion ? (
            <button
              type="button"
              className="custom-date-inline-clear"
              onClick={limpiar}
              title="Limpiar fechas"
              aria-label="Limpiar fechas"
            >
              Limpiar
            </button>
          ) : null}
        </div>

        {/* Accesos rápidos predefinidos */}
        <div className="custom-date-presets">
          <button
            type="button"
            className="custom-date-preset-btn"
            onClick={() => aplicarPreset('HOY')}
          >
            Hoy
          </button>
          <button
            type="button"
            className="custom-date-preset-btn"
            onClick={() => aplicarPreset('AYER')}
          >
            Ayer
          </button>
          <button
            type="button"
            className="custom-date-preset-btn"
            onClick={() => aplicarPreset('7DIAS')}
          >
            Últimos 7 Días
          </button>
          <button
            type="button"
            className="custom-date-preset-btn"
            onClick={() => aplicarPreset('30DIAS')}
          >
            Últimos 30 Días
          </button>
          <button
            type="button"
            className="custom-date-preset-btn"
            onClick={() => aplicarPreset('ESTE_MES')}
          >
            Este Mes
          </button>
        </div>

        {/* Navegación del mes */}
        <div className="custom-date-nav">
          <button
            type="button"
            className="icon-button"
            onClick={mesAnterior}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <AngleLeft size={16} />
          </button>

          <span className="custom-date-month-title">
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

        {/* Cuadrícula interactiva de días */}
        <div className="custom-date-days-grid">
          {diasDelMes.map(({ fecha, esMesActual }, idx) => {
            const str = formatearFechaLocal(fecha);
            const esHoy = mismoDia(fecha, hoyDate);
            const esInicio = tempDesde === str;
            const esFin = tempHasta === str;

            let enRango = false;
            if (fDesdeDate && fHastaDate) {
              enRango = fecha >= fDesdeDate && fecha <= fHastaDate;
            } else if (fDesdeDate && hoverDate && !tempHasta) {
              const menor = fDesdeDate < hoverDate ? fDesdeDate : hoverDate;
              const mayor = fDesdeDate < hoverDate ? hoverDate : fDesdeDate;
              enRango = fecha >= menor && fecha <= mayor;
            }

            let claseDia = 'custom-date-day';
            if (!esMesActual) claseDia += ' custom-date-day--muted';
            if (esHoy) claseDia += ' custom-date-day--today';
            if (enRango) claseDia += ' custom-date-day--in-range';
            if (esInicio) claseDia += ' custom-date-day--start';
            if (esFin) claseDia += ' custom-date-day--end';

            return (
              <button
                key={`${str}-${idx}`}
                type="button"
                className={claseDia}
                onClick={() => clickDia(fecha)}
                onMouseEnter={() => setHoverDate(fecha)}
                onMouseLeave={() => setHoverDate(null)}
              >
                <span className="custom-date-day-num">{fecha.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // MODO FLOTANTE / DROPDOWN
  return (
    <div ref={contenedorRef} className={`custom-date-wrap${className ? ` ${className}` : ''}`}>
      <button
        id={idGenerado}
        type="button"
        className={`custom-date-trigger${abierto ? ' custom-date-trigger--open' : ''}${haySeleccion ? ' custom-date-trigger--active' : ''}`}
        onClick={() => setAbierto((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
      >
        <Calendar size={16} className="custom-date-icon" />
        <span className="custom-date-label">{textoBoton}</span>

        {haySeleccion ? (
          <span
            className="custom-date-clear-btn"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              limpiar();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                limpiar();
              }
            }}
            title="Limpiar Fechas"
            aria-label="Limpiar Fechas"
          >
            <XCircle size={15} />
          </span>
        ) : null}

        <AngleDown
          size={16}
          className={`custom-select-arrow${abierto ? ' custom-select-arrow--open' : ''}`}
        />
      </button>

      {abierto ? (
        <div className="custom-date-popover" role="dialog" aria-label="Selector de rango de fechas">
          {/* Accesos rápidos predefinidos */}
          <div className="custom-date-presets">
            <button
              type="button"
              className="custom-date-preset-btn"
              onClick={() => aplicarPreset('HOY')}
            >
              Hoy
            </button>
            <button
              type="button"
              className="custom-date-preset-btn"
              onClick={() => aplicarPreset('AYER')}
            >
              Ayer
            </button>
            <button
              type="button"
              className="custom-date-preset-btn"
              onClick={() => aplicarPreset('7DIAS')}
            >
              Últimos 7 Días
            </button>
            <button
              type="button"
              className="custom-date-preset-btn"
              onClick={() => aplicarPreset('30DIAS')}
            >
              Últimos 30 Días
            </button>
            <button
              type="button"
              className="custom-date-preset-btn"
              onClick={() => aplicarPreset('ESTE_MES')}
            >
              Este Mes
            </button>
          </div>

          {/* Navegación del mes */}
          <div className="custom-date-nav">
            <button
              type="button"
              className="icon-button"
              onClick={mesAnterior}
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <AngleLeft size={16} />
            </button>

            <span className="custom-date-month-title">
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

          {/* Cuadrícula interactiva de días */}
          <div className="custom-date-days-grid">
            {diasDelMes.map(({ fecha, esMesActual }, idx) => {
              const str = formatearFechaLocal(fecha);
              const esHoy = mismoDia(fecha, hoyDate);
              const esInicio = tempDesde === str;
              const esFin = tempHasta === str;

              let enRango = false;
              if (fDesdeDate && fHastaDate) {
                enRango = fecha >= fDesdeDate && fecha <= fHastaDate;
              } else if (fDesdeDate && hoverDate && !tempHasta) {
                const menor = fDesdeDate < hoverDate ? fDesdeDate : hoverDate;
                const mayor = fDesdeDate < hoverDate ? hoverDate : fDesdeDate;
                enRango = fecha >= menor && fecha <= mayor;
              }

              let claseDia = 'custom-date-day';
              if (!esMesActual) claseDia += ' custom-date-day--muted';
              if (esHoy) claseDia += ' custom-date-day--today';
              if (enRango) claseDia += ' custom-date-day--in-range';
              if (esInicio) claseDia += ' custom-date-day--start';
              if (esFin) claseDia += ' custom-date-day--end';

              return (
                <button
                  key={`${str}-${idx}`}
                  type="button"
                  className={claseDia}
                  onClick={() => clickDia(fecha)}
                  onMouseEnter={() => setHoverDate(fecha)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  <span className="custom-date-day-num">{fecha.getDate()}</span>
                </button>
              );
            })}
          </div>

          {/* Pie del selector */}
          <div className="custom-date-footer">
            <button
              type="button"
              className="button button--ghost button--sm"
              onClick={limpiar}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="button button--primary button--sm"
              onClick={() => {
                if (tempDesde && !tempHasta) {
                  onChange?.({ fechaDesde: tempDesde, fechaHasta: tempDesde });
                }
                setAbierto(false);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
