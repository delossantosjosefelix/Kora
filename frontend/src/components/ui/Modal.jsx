import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'reicon-react';

export default function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  footer,
  tamano = '',
}) {
  const panelRef = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    if (!abierto) return undefined;

    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar?.();
      }
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', manejarTecla);

    const temporizador = window.setTimeout(() => {
      const campos = panelRef.current?.querySelectorAll(
        'input:not([type="hidden"]), select, textarea',
      );
      const enfocable =
        campos?.[0] ?? panelRef.current?.querySelector('button, a[href]');
      enfocable?.focus();
    }, 40);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', manejarTecla);
      window.clearTimeout(temporizador);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar?.();
        }
      }}
    >
      <div
        ref={panelRef}
        className={`modal${tamano ? ` modal--${tamano}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <div className="modal-header">
          <div>
            <h2 id={tituloId}>{titulo}</h2>
            {descripcion ? <p>{descripcion}</p> : null}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onCerrar}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
