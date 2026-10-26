import {
  AngleLeft,
  AngleRight,
  AnglesLeft,
  AnglesRight,
} from 'reicon-react';

export default function Paginacion({
  pagina,
  totalPaginas,
  onCambiarPagina,
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  const numeros = Array.from({ length: totalPaginas }, (_, indice) => indice + 1)
    .filter(
      (numero) =>
        Math.abs(numero - pagina) <= 2 ||
        numero === 1 ||
        numero === totalPaginas,
    );

  return (
    <div className="users-pagination-bar">
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(1)}
          disabled={pagina === 1}
          title="Primera página"
          aria-label="Primera página"
        >
          <AnglesLeft size={14} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(Math.max(1, pagina - 1))}
          disabled={pagina === 1}
          title="Página anterior"
          aria-label="Página anterior"
        >
          <AngleLeft size={14} />
        </button>

        {numeros.map((numero) => (
          <button
            key={numero}
            type="button"
            className={`pagination-btn${numero === pagina ? ' pagination-btn--active' : ''}`}
            onClick={() => onCambiarPagina(numero)}
            aria-label={`Ir a la página ${numero}`}
            aria-current={numero === pagina ? 'page' : undefined}
          >
            {numero}
          </button>
        ))}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(Math.min(totalPaginas, pagina + 1))}
          disabled={pagina === totalPaginas}
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <AngleRight size={14} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(totalPaginas)}
          disabled={pagina === totalPaginas}
          title="Última página"
          aria-label="Última página"
        >
          <AnglesRight size={14} />
        </button>
      </div>
    </div>
  );
}
