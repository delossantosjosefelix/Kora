import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building,
  Check,
  FileText,
  Loader,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash,
  X,
} from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';
import SuplidorModal from '../inventario/SuplidorModal.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearMoneda, formatearNumero } from '../../utils/format.js';

function obtenerFechaHoy() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function NuevaCompraPanel({ onCompraRegistrada }) {
  // Datos del formulario de cabecera
  const [suplidores, setSuplidores] = useState([]);
  const [cargandoSuplidores, setCargandoSuplidores] = useState(true);
  const [suplidorId, setSuplidorId] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fecha, setFecha] = useState(obtenerFechaHoy());
  const [observacion, setObservacion] = useState('');
  const [actualizarCostoGlobal, setActualizarCostoGlobal] = useState(false);

  // Lineas de compra
  const [items, setItems] = useState([]);

  // Busqueda de productos
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Estados de envio y modales auxiliares
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [modalSuplidorAbierto, setModalSuplidorAbierto] = useState(false);

  const searchContainerRef = useRef(null);

  // Cargar suplidores activos
  const cargarSuplidores = async () => {
    setCargandoSuplidores(true);
    try {
      const respuesta = await api.get('/suplidores?activo=ACTIVOS');
      if (respuesta.ok) {
        setSuplidores(respuesta.datos?.suplidores ?? []);
      }
    } catch {
      // Manejado silenciosamente
    } finally {
      setCargandoSuplidores(false);
    }
  };

  useEffect(() => {
    cargarSuplidores();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function manejarClicFuera(evento) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(evento.target)
      ) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClicFuera);
    return () => document.removeEventListener('mousedown', manejarClicFuera);
  }, []);

  // Busqueda de productos en tiempo real con debounce
  useEffect(() => {
    const texto = busquedaProducto.trim();
    if (!texto) {
      setResultadosBusqueda([]);
      setDropdownAbierto(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setBuscandoProductos(true);
      try {
        const respuesta = await api.get(
          `/productos?activo=ACTIVOS&busqueda=${encodeURIComponent(texto)}`,
        );
        if (respuesta.ok) {
          setResultadosBusqueda(respuesta.datos?.productos ?? []);
          setDropdownAbierto(true);
        }
      } catch {
        setResultadosBusqueda([]);
      } finally {
        setBuscandoProductos(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [busquedaProducto]);

  // Agregar producto a las lineas de compra
  const agregarProducto = (producto) => {
    setItems((prevItems) => {
      const indiceExistente = prevItems.findIndex(
        (it) => it.productoId === producto.id,
      );

      if (indiceExistente >= 0) {
        // Incrementar cantidad si ya existe
        return prevItems.map((it, idx) => {
          if (idx !== indiceExistente) return it;
          const nuevaCantidad = Number((it.cantidad + 1).toFixed(3));
          return {
            ...it,
            cantidad: nuevaCantidad,
            subtotal: Number((nuevaCantidad * it.costoUnitario).toFixed(2)),
          };
        });
      }

      // Nuevo item
      const costoInicial = Number(producto.costo ?? 0);
      return [
        ...prevItems,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          unidadAbreviatura: producto.unidad_abreviatura || 'und',
          cantidad: 1,
          costoUnitario: costoInicial,
          subtotal: costoInicial,
          actualizarCosto: actualizarCostoGlobal,
        },
      ];
    });

    setBusquedaProducto('');
    setDropdownAbierto(false);
  };

  // Modificar cantidad de una linea
  const cambiarCantidad = (indice, nuevoValor) => {
    const num = parseFloat(nuevoValor);
    const cantidadLimpia = isNaN(num) || num < 0 ? 0 : num;

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== indice) return it;
        return {
          ...it,
          cantidad: cantidadLimpia,
          subtotal: Number((cantidadLimpia * it.costoUnitario).toFixed(2)),
        };
      }),
    );
  };

  // Modificar costo unitario de una linea
  const cambiarCostoUnitario = (indice, nuevoValor) => {
    const num = parseFloat(nuevoValor);
    const costoLimpio = isNaN(num) || num < 0 ? 0 : num;

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== indice) return it;
        return {
          ...it,
          costoUnitario: costoLimpio,
          subtotal: Number((it.cantidad * costoLimpio).toFixed(2)),
        };
      }),
    );
  };

  // Alternar checkbox de actualizar costo individual
  const alternarActualizarCostoLinea = (indice) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== indice) return it;
        return { ...it, actualizarCosto: !it.actualizarCosto };
      }),
    );
  };

  // Eliminar una linea
  const eliminarLinea = (indice) => {
    setItems((prev) => prev.filter((_, idx) => idx !== indice));
  };

  // Manejar cambio en el checkbox global
  const cambiarActualizarCostoGlobal = (nuevoEstado) => {
    setActualizarCostoGlobal(nuevoEstado);
    // Cascadear a todas las lineas existentes
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        actualizarCosto: nuevoEstado,
      })),
    );
  };

  // Calculos de totales
  const totalArticulos = items.length;
  const totalUnidades = items.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);
  const totalCompra = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

  // Envio del formulario
  const manejarRegistrarCompra = async (e) => {
    e.preventDefault();
    setErrorEnvio('');

    if (!suplidorId) {
      setErrorEnvio('Debe seleccionar un suplidor para la compra.');
      notify.error('Selecciona un suplidor.');
      return;
    }

    if (items.length === 0) {
      setErrorEnvio('Debe agregar al menos un producto a la compra.');
      notify.error('Agrega productos a la compra.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].cantidad <= 0) {
        setErrorEnvio(
          `La cantidad del producto "${items[i].nombre}" debe ser mayor que cero.`,
        );
        notify.error(`Cantidad inválida en "${items[i].nombre}".`);
        return;
      }
    }

    const suplidorSeleccionado = suplidores.find((s) => s.id === suplidorId);

    const confirmado = await notify.confirm({
      titulo: 'Confirmar recepción de compra',
      mensaje: `¿Deseas registrar la compra a "${suplidorSeleccionado?.nombre || 'Suplidor'}" por un total de ${formatearMoneda(
        totalCompra,
      )}? Se ingresarán ${formatearNumero(
        totalUnidades,
      )} unidades al stock de inventario.`,
      textoConfirmar: 'Registrar compra',
      textoCancelar: 'Revisar',
    });

    if (!confirmado) return;

    setGuardando(true);

    try {
      const cuerpo = {
        suplidor_id: suplidorId,
        numero_factura_suplidor: numeroFactura.trim() || null,
        fecha: fecha || null,
        observacion: observacion.trim() || null,
        actualizar_costo: actualizarCostoGlobal,
        items: items.map((it) => ({
          producto_id: it.productoId,
          cantidad: it.cantidad,
          costo_unitario: it.costoUnitario,
          actualizar_costo: it.actualizarCosto,
        })),
      };

      const respuesta = await api.post('/compras', cuerpo);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo registrar la compra.'),
        );
      }

      notify.success(
        'Compra registrada exitosamente. Las existencias han sido actualizadas.',
      );

      // Limpiar formulario y notificar al padre
      setSuplidorId('');
      setNumeroFactura('');
      setObservacion('');
      setItems([]);
      onCompraRegistrada?.();
    } catch (err) {
      setErrorEnvio(err.message);
      notify.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesSuplidores = [
    { valor: '', etiqueta: 'Seleccione un suplidor...' },
    ...suplidores.map((s) => ({ valor: s.id, etiqueta: s.nombre })),
  ];

  return (
    <form onSubmit={manejarRegistrarCompra} className="compra-layout">
      {/* Columna Izquierda: Datos de la compra y productos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Tarjeta de Cabecera */}
        <div className="compra-card">
          <h2 className="compra-card-title">
            <FileText size={18} />
            Datos de la factura y suplidor
          </h2>

          <div className="field-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label" htmlFor="compra-suplidor">
                  Suplidor *
                </label>
                <button
                  type="button"
                  className="button button--ghost button--sm"
                  style={{ padding: '2px 6px', height: 'auto', minHeight: 'unset', fontSize: '0.78rem' }}
                  onClick={() => setModalSuplidorAbierto(true)}
                >
                  <Plus size={12} />
                  Nuevo suplidor
                </button>
              </div>
              <CustomSelect
                id="compra-suplidor"
                opciones={opcionesSuplidores}
                valor={suplidorId}
                onChange={setSuplidorId}
                ancho="100%"
                disabled={cargandoSuplidores}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="compra-factura">
                No. Factura o Comprobante
              </label>
              <input
                id="compra-factura"
                type="text"
                className="input"
                placeholder="Ej. B0100004523"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                maxLength={40}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="compra-fecha">
                Fecha de recepción
              </label>
              <input
                id="compra-fecha"
                type="date"
                className="input"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="compra-observacion">
              Observación / Notas de entrega
            </label>
            <input
              id="compra-observacion"
              type="text"
              className="input"
              placeholder="Detalles sobre entrega, flete o condición de la mercancía (opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={255}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              id="compra-actualizar-costo-global"
              type="checkbox"
              checked={actualizarCostoGlobal}
              onChange={(e) => cambiarActualizarCostoGlobal(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
            />
            <label
              htmlFor="compra-actualizar-costo-global"
              style={{ fontSize: '0.86rem', color: 'var(--color-ink)', fontWeight: 600, cursor: 'pointer' }}
            >
              Actualizar costo de referencia de los productos en el catálogo
            </label>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: '24px', marginTop: '-10px' }}>
            Si se activa, el costo unitario de esta compra pasará a ser el costo base del producto para futuros cálculos y valorización de inventario.
          </span>
        </div>

        {/* Tarjeta de Productos / Mercancia */}
        <div className="compra-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="compra-card-title">
              <Package size={18} />
              Mercancía recibida ({items.length})
            </h2>
          </div>

          {/* Buscador de productos con autocompletado */}
          <div ref={searchContainerRef} className="compra-search-wrapper">
            <div className="search-box" style={{ width: '100%' }}>
              {buscandoProductos ? (
                <Loader size={16} className="search-box-icon spin" />
              ) : (
                <Search size={16} className="search-box-icon" />
              )}
              <input
                type="text"
                className="search-box-input"
                style={{ width: '100%' }}
                placeholder="Escribe el nombre, código o código de barras del producto a recibir..."
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                onFocus={() => {
                  if (resultadosBusqueda.length > 0) setDropdownAbierto(true);
                }}
              />
              {busquedaProducto ? (
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: '28px', height: '28px', position: 'absolute', right: '6px' }}
                  onClick={() => {
                    setBusquedaProducto('');
                    setDropdownAbierto(false);
                  }}
                  title="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            {/* Dropdown de resultados */}
            {dropdownAbierto && resultadosBusqueda.length > 0 ? (
              <ul className="compra-search-dropdown">
                {resultadosBusqueda.map((prod) => (
                  <li
                    key={prod.id}
                    className="compra-search-item"
                    onClick={() => agregarProducto(prod)}
                  >
                    <div className="compra-search-item-info">
                      <span className="compra-search-item-title">{prod.nombre}</span>
                      <span className="compra-search-item-meta">
                        Código: {prod.codigo} | Unidad: {prod.unidad_abreviatura || 'und'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 650, color: 'var(--color-ink)' }}>
                        Costo actual: {formatearMoneda(prod.costo)}
                      </span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)' }}>
                        + Agregar a la compra
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : dropdownAbierto && busquedaProducto && !buscandoProductos ? (
              <ul className="compra-search-dropdown">
                <li style={{ padding: '12px', fontSize: '0.84rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  No se encontraron productos activos que coincidan.
                </li>
              </ul>
            ) : null}
          </div>

          {/* Tabla de lineas */}
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <ShoppingCart size={32} />
              <p className="empty-state__title">La lista de compra está vacía</p>
              <p className="empty-state__description">
                Busca productos arriba y agrégalos para ingresar las cantidades y costos recibidos.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Cantidad</th>
                    <th style={{ textAlign: 'right', width: '130px' }}>Costo unit. (RD$)</th>
                    <th style={{ textAlign: 'right', width: '120px' }}>Subtotal</th>
                    <th style={{ textAlign: 'center', width: '90px' }} title="Actualizar costo de catálogo">
                      Act. costo
                    </th>
                    <th style={{ textAlign: 'center', width: '48px' }}>Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((linea, index) => (
                    <tr key={linea.productoId}>
                      <td>
                        <div style={{ fontWeight: 650, color: 'var(--color-ink)' }}>
                          {linea.nombre}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          {linea.codigo} ({linea.unidadAbreviatura})
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          className="compra-table-input"
                          value={linea.cantidad === 0 ? '' : linea.cantidad}
                          onChange={(e) => cambiarCantidad(index, e.target.value)}
                          required
                        />
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="compra-table-input"
                          value={linea.costoUnitario === 0 ? '0' : linea.costoUnitario}
                          onChange={(e) => cambiarCostoUnitario(index, e.target.value)}
                          required
                        />
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {formatearMoneda(linea.subtotal)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={linea.actualizarCosto}
                          onChange={() => alternarActualizarCostoLinea(index)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                          title="Actualizar costo base en el catálogo"
                        />
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="button button--danger-soft button--sm icon-button"
                          onClick={() => eliminarLinea(index)}
                          title="Eliminar de la compra"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Resumen de Totales y Confirmacion */}
      <div className="compra-summary-sticky">
        <div className="compra-card">
          <h2 className="compra-card-title">
            <ShoppingCart size={18} />
            Resumen de compra
          </h2>

          <div className="compra-summary-rows">
            <div className="compra-summary-row">
              <span>Productos distintos:</span>
              <strong style={{ color: 'var(--color-ink)' }}>{totalArticulos}</strong>
            </div>

            <div className="compra-summary-row">
              <span>Unidades totales:</span>
              <strong style={{ color: 'var(--color-ink)' }}>{formatearNumero(totalUnidades)}</strong>
            </div>
          </div>

          <div className="compra-summary-total">
            <span>Total a pagar:</span>
            <span>{formatearMoneda(totalCompra)}</span>
          </div>

          {errorEnvio ? (
            <div className="alert alert--error" style={{ padding: '10px 12px', fontSize: '0.82rem' }}>
              <AlertCircle size={16} />
              <span>{errorEnvio}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="button button--primary button--block"
            disabled={guardando || items.length === 0 || !suplidorId}
            style={{ marginTop: '8px' }}
          >
            {guardando ? (
              <>
                <Loader size={16} className="spin" />
                Registrando mercancía...
              </>
            ) : (
              <>
                <Check size={18} />
                Registrar compra
              </>
            )}
          </button>

          <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Al registrar, el stock se incrementa inmediatamente en el inventario bajo movimiento de compra.
          </p>
        </div>
      </div>

      {/* Modal auxiliar para registrar suplidor nuevo sin salir */}
      <SuplidorModal
        abierto={modalSuplidorAbierto}
        onCerrar={() => setModalSuplidorAbierto(false)}
        onGuardadoExitoso={(nuevoSuplidor) => {
          cargarSuplidores();
          if (nuevoSuplidor?.id) setSuplidorId(nuevoSuplidor.id);
          setModalSuplidorAbierto(false);
        }}
      />
    </form>
  );
}
