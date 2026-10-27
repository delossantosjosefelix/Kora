import { useEffect, useId, useRef, useState } from 'react';
import { AngleDown, Check } from 'reicon-react';

export default function CustomSelect({
  valor,
  onChange,
  opciones = [],
  placeholder = 'Seleccionar...',
  id,
  name,
  disabled = false,
  error = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const idGenerado = useId();
  const selectId = id || idGenerado;

  const opcionSeleccionada = opciones.find(
    (op) => String(op.valor) === String(valor),
  );

  const etiquetaMostrar = opcionSeleccionada
    ? opcionSeleccionada.etiqueta
    : placeholder;

  useEffect(() => {
    if (!abierto) return undefined;

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
    document.addEventListener('keydown', manejarTecla);

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [abierto]);

  const alternar = () => {
    if (disabled) return;
    setAbierto((prev) => !prev);
  };

  const seleccionar = (nuevoValor) => {
    onChange?.(nuevoValor);
    setAbierto(false);
  };

  return (
    <div
      ref={contenedorRef}
      className={`custom-select-wrap ${className}`.trim()}
    >
      <button
        id={selectId}
        type="button"
        className={`custom-select-trigger${abierto ? ' custom-select-trigger--open' : ''}${error ? ' custom-select-trigger--error' : ''}${disabled ? ' custom-select-trigger--disabled' : ''}`}
        onClick={alternar}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={ariaLabel}
      >
        <span className="custom-select-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {opcionSeleccionada?.icono ? opcionSeleccionada.icono : null}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etiquetaMostrar}</span>
        </span>
        <AngleDown
          size={16}
          className={`custom-select-arrow${abierto ? ' custom-select-arrow--open' : ''}`}
        />
      </button>

      {abierto && !disabled ? (
        <div className="custom-select-dropdown" role="listbox">
          {opciones.map((op) => {
            const esActivo = String(op.valor) === String(valor);
            return (
              <button
                key={String(op.valor)}
                type="button"
                role="option"
                aria-selected={esActivo}
                className={`custom-select-option${esActivo ? ' custom-select-option--active' : ''}`}
                onClick={() => seleccionar(op.valor)}
              >
                <span className="custom-select-option-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {op.icono ? op.icono : null}
                  <span>{op.etiqueta}</span>
                </span>
                {esActivo ? (
                  <Check size={14} className="custom-select-option-check" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {name ? (
        <input type="hidden" name={name} value={valor ?? ''} />
      ) : null}
    </div>
  );
}
