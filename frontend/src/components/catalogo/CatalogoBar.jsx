import { Filter, Grid, List, Search } from 'reicon-react';

export default function CatalogoBar({
  busqueda,
  onBuscar,
  placeholderBusqueda,
  ariaLabelBusqueda,
  onAbrirFiltros,
  totalFiltrosActivos = 0,
  mostrarBotonFiltros = false,
  controlExtra,
  vista = 'tabla',
  onCambiarVista,
  mostrarSelectorVista = false,
}) {
  return (
    <div className="users-bar">
      <div className="search-box" style={{ flex: 1, minWidth: '220px' }}>
        <Search size={16} className="search-box-icon" />
        <input
          type="search"
          className="search-box-input"
          placeholder={placeholderBusqueda}
          value={busqueda}
          onChange={(evento) => onBuscar(evento.target.value)}
          aria-label={ariaLabelBusqueda}
        />
      </div>

      <div className="users-controls">
        {controlExtra}

        {mostrarSelectorVista ? (
          <div className="view-mode-toggle" role="group" aria-label="Modo de visualización">
            <button
              type="button"
              className={`view-mode-btn${vista === 'tabla' ? ' view-mode-btn--active' : ''}`}
              onClick={() => onCambiarVista?.('tabla')}
              title="Vista En Tabla"
              aria-label="Vista En Tabla"
              aria-pressed={vista === 'tabla'}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`view-mode-btn${vista === 'tarjetas' ? ' view-mode-btn--active' : ''}`}
              onClick={() => onCambiarVista?.('tarjetas')}
              title="Vista En Tarjetas"
              aria-label="Vista En Tarjetas"
              aria-pressed={vista === 'tarjetas'}
            >
              <Grid size={16} />
            </button>
          </div>
        ) : null}

        {mostrarBotonFiltros ? (
          <button
            type="button"
            className={`button button--secondary filter-trigger-btn${totalFiltrosActivos > 0 ? ' filter-trigger-btn--active' : ''}`}
            onClick={onAbrirFiltros}
            aria-label="Abrir panel de filtros"
          >
            <Filter size={16} />
            <span>Filtrar</span>
            {totalFiltrosActivos > 0 ? (
              <span className="filter-badge">{totalFiltrosActivos}</span>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}

