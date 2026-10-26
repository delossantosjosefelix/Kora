import { Search } from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';

const OPCIONES_ESTADO = [
  { valor: 'todos', etiqueta: 'Todos los estados' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'inactivos', etiqueta: 'Inactivos' },
];

export default function CatalogoBar({
  tab,
  onCambiarTab,
  totales,
  busqueda,
  onBuscar,
  filtroEstado,
  onCambiarFiltro,
  mostrarFiltro,
  controlExtra,
  placeholderBusqueda,
  ariaLabelBusqueda,
}) {
  return (
    <div className="users-bar">
      <div className="users-tabs" role="tablist" aria-label="Secciones del catálogo">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'productos'}
          className={`users-tab${tab === 'productos' ? ' users-tab--active' : ''}`}
          onClick={() => onCambiarTab('productos')}
        >
          Productos
          <span className="users-tab-count">{totales.productos ?? 0}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'categorias'}
          className={`users-tab${tab === 'categorias' ? ' users-tab--active' : ''}`}
          onClick={() => onCambiarTab('categorias')}
        >
          Categorías
          <span className="users-tab-count">{totales.categorias ?? 0}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'unidades'}
          className={`users-tab${tab === 'unidades' ? ' users-tab--active' : ''}`}
          onClick={() => onCambiarTab('unidades')}
        >
          Unidades
          <span className="users-tab-count">{totales.unidades ?? 0}</span>
        </button>
      </div>

      <div className="users-controls">
        <div className="search-box">
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

        {controlExtra}

        {mostrarFiltro ? (
          <CustomSelect
            valor={filtroEstado}
            onChange={onCambiarFiltro}
            placeholder="Todos los estados"
            opciones={OPCIONES_ESTADO}
            aria-label="Filtrar por estado"
          />
        ) : null}
      </div>
    </div>
  );
}
