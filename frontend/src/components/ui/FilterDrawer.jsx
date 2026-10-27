import { useEffect, useRef, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X } from 'reicon-react';

export default function FilterDrawer({
  abierto,
  onCerrar,
  titulo = 'Filtros',
  totalFiltrosActivos = 0,
  onLimpiar,
  onAplicar,
  children,
}) {
  const panelRef = useRef(null);
  const tituloId = useId();
  const [montado, setMontado] = useState(abierto);
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    let timer;
    let frame;

    if (abierto) {
      setMontado(true);
      frame = requestAnimationFrame(() => {
        setActivo(true);
      });
    } else {
      setActivo(false);
      timer = setTimeout(() => {
        setMontado(false);
      }, 240);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [abierto]);

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

    // Enfocar el panel al abrir para accesibilidad
    const temporizador = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', manejarTecla);
      window.clearTimeout(temporizador);
    };
  }, [abierto, onCerrar]);

  if (!montado) return null;

  return createPortal(
    <>
      <div
        className={`filter-drawer-backdrop${activo ? ' filter-drawer-backdrop--active' : ''}`}
        onClick={onCerrar}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className={`filter-drawer${activo ? ' filter-drawer--active' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
      >
        <header className="filter-drawer-header">
          <div className="filter-drawer-title-group">
            <Filter size={18} />
            <h2 id={tituloId} className="filter-drawer-title">
              {titulo}
            </h2>
            {totalFiltrosActivos > 0 ? (
              <span className="filter-badge" title={`${totalFiltrosActivos} Filtros Activos`}>
                {totalFiltrosActivos}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onCerrar}
            aria-label="Cerrar Panel De Filtros"
            title="Cerrar Filtros"
          >
            <X size={18} />
          </button>
        </header>

        <div className="filter-drawer-body">
          {children}
        </div>

        <footer className="filter-drawer-footer">
          <button
            type="button"
            className="button button--ghost button--sm"
            onClick={onLimpiar}
            disabled={totalFiltrosActivos === 0}
          >
            Restablecer
          </button>

          <button
            type="button"
            className="button button--primary button--sm"
            onClick={() => {
              onAplicar?.();
              onCerrar?.();
            }}
          >
            Aplicar Filtros
          </button>
        </footer>
      </aside>
    </>,
    document.body,
  );
}
