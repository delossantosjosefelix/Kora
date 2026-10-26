import {
  AngleLeft,
  AngleRight,
  AnglesLeft,
  AnglesRight,
} from 'reicon-react';

export default function Paginacion({
  pagina = 1,
  totalPaginas = 1,
  onCambiarPagina,
}) {
  const total = Math.max(1, totalPaginas);
  const paginaValida = Math.min(Math.max(1, pagina), total);

  const numeros = Array.from({ length: total }, (_, indice) => indice + 1)
    .filter(
      (numero) =>
        Math.abs(numero - paginaValida) <= 2 ||
        numero === 1 ||
        numero === total,
    );

  return (
    <div className="users-pagination-bar">
      <span className="pagination-info">
        Página {paginaValida} de {total}
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(1)}
          disabled={paginaValida === 1}
          title="Primera página"
          aria-label="Primera página"
        >
          <AnglesLeft size={14} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(Math.max(1, paginaValida - 1))}
          disabled={paginaValida === 1}
          title="Página anterior"
          aria-label="Página anterior"
        >
          <AngleLeft size={14} />
        </button>

        {numeros.map((numero) => (
          <button
            key={numero}
            type="button"
            className={`pagination-btn${numero === paginaValida ? ' pagination-btn--active' : ''}`}
            onClick={() => onCambiarPagina(numero)}
            aria-label={`Ir a la página ${numero}`}
            aria-current={numero === paginaValida ? 'page' : undefined}
          >
            {numero}
          </button>
        ))}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(Math.min(total, paginaValida + 1))}
          disabled={paginaValida === total}
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <AngleRight size={14} />
        </button>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onCambiarPagina(total)}
          disabled={paginaValida === total}
          title="Última página"
          aria-label="Última página"
        >
          <AnglesRight size={14} />
        </button>
      </div>
    </div>
  );
}
