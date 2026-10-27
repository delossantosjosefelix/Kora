import { useEffect, useRef, useState } from 'react';
import { HelpCircle, InfoCircle } from 'reicon-react';

export default function InfoTooltip({
  texto,
  posicion = 'top',
  tipo = 'help',
  ariaLabel = 'Más información',
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    const manejarClickFuera = (evento) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target)
      ) {
        setAbierto(false);
      }
    };

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    document.addEventListener('touchstart', manejarClickFuera);
    document.addEventListener('keydown', manejarTecla);

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('touchstart', manejarClickFuera);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [abierto]);

  if (!texto) return null;

  return (
    <span className="info-tooltip" ref={contenedorRef}>
      <button
        type="button"
        className={`info-tooltip-btn${abierto ? ' info-tooltip-btn--activo' : ''}`}
        onClick={(evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          setAbierto((prev) => !prev);
        }}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        aria-label={ariaLabel}
        aria-expanded={abierto}
      >
        {tipo === 'info' ? <InfoCircle size={14} /> : <HelpCircle size={14} />}
      </button>

      {abierto ? (
        <span
          role="tooltip"
          className={`info-tooltip-popover info-tooltip-popover--${posicion}`}
          onClick={(evento) => evento.stopPropagation()}
        >
          {texto}
        </span>
      ) : null}
    </span>
  );
}
