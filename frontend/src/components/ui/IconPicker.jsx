import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check } from 'reicon-react';
import {
  LISTA_ICONOS,
  CATEGORIAS_ICONOS,
  obtenerComponenteIcono,
} from '../../utils/iconosCatalogo.jsx';

export default function IconPicker({
  valor = 'Tag',
  onChange,
  label = 'Icono representativo',
  fallbackIcon = 'Tag',
  disabled = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  const contenedorRef = useRef(null);
  const inputBusquedaRef = useRef(null);

  // Cerrar al hacer clic fuera o presionar Esc
  useEffect(() => {
    if (!abierto) return;

    const manejarClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };

    const manejarTecla = (e) => {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', manejarClicFuera);
    document.addEventListener('keydown', manejarTecla);

    // Auto-focus en el buscador al abrir
    const timer = setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('mousedown', manejarClicFuera);
      document.removeEventListener('keydown', manejarTecla);
      clearTimeout(timer);
    };
  }, [abierto]);

  const IconoActual = obtenerComponenteIcono(valor, obtenerComponenteIcono(fallbackIcon));

  const iconosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return LISTA_ICONOS.filter((item) => {
      if (categoriaSeleccionada !== 'Todos' && item.grupo !== categoriaSeleccionada) {
        return false;
      }
      if (!q) return true;
      const coincideNombre = item.nombre.toLowerCase().includes(q);
      const coincideEtiqueta = item.etiqueta.toLowerCase().includes(q);
      const coincidePalabras = item.palabras.toLowerCase().includes(q);
      return coincideNombre || coincideEtiqueta || coincidePalabras;
    });
  }, [busqueda, categoriaSeleccionada]);

  const seleccionarIcono = (nombreIcono) => {
    onChange?.(nombreIcono);
    setAbierto(false);
    setBusqueda('');
  };

  return (
    <div className="icon-picker-container" ref={contenedorRef}>
      {label ? <span className="field-label">{label}</span> : null}

      <div className="icon-picker-trigger-wrap">
        <button
          type="button"
          className={`icon-picker-trigger${abierto ? ' icon-picker-trigger--open' : ''}`}
          onClick={() => !disabled && setAbierto((ant) => !ant)}
          disabled={disabled}
          title="Hacer clic para cambiar icono"
          aria-haspopup="dialog"
          aria-expanded={abierto}
        >
          <div className="icon-picker-preview-box">
            <IconoActual size={20} />
          </div>
          <div className="icon-picker-trigger-info">
            <span className="icon-picker-trigger-name">
              {LISTA_ICONOS.find((i) => i.nombre === valor)?.etiqueta || valor}
            </span>
            <span className="icon-picker-trigger-action">Cambiar Icono</span>
          </div>
        </button>
      </div>

      {abierto ? (
        <div className="icon-picker-popover" role="dialog" aria-label="Selector de iconos">
          <div className="icon-picker-popover-header">
            <div className="search-box icon-picker-search">
              <Search size={14} className="search-box-icon" />
              <input
                ref={inputBusquedaRef}
                type="search"
                className="search-box-input"
                placeholder="Buscar Por Nombre O Uso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar icono"
              />
              {busqueda ? (
                <button
                  type="button"
                  className="icon-picker-clear-search"
                  onClick={() => setBusqueda('')}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>

            {/* Pestañas de categoría de icono */}
            <div className="icon-picker-pills" role="tablist">
              {CATEGORIAS_ICONOS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={categoriaSeleccionada === cat}
                  className={`icon-picker-pill${categoriaSeleccionada === cat ? ' icon-picker-pill--active' : ''}`}
                  onClick={() => setCategoriaSeleccionada(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="icon-picker-grid-wrap">
            {iconosFiltrados.length === 0 ? (
              <div className="icon-picker-empty">
                <span>Sin Iconos Coincidentes</span>
              </div>
            ) : (
              <div className="icon-picker-grid">
                {iconosFiltrados.map((item) => {
                  const IconoItem = obtenerComponenteIcono(item.nombre);
                  const esSeleccionado = item.nombre === valor;

                  return (
                    <button
                      key={item.nombre}
                      type="button"
                      className={`icon-picker-item${esSeleccionado ? ' icon-picker-item--selected' : ''}`}
                      onClick={() => seleccionarIcono(item.nombre)}
                      title={`${item.etiqueta} (${item.nombre})`}
                      aria-label={item.etiqueta}
                    >
                      <IconoItem size={18} />
                      {esSeleccionado ? (
                        <span className="icon-picker-check-badge">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
