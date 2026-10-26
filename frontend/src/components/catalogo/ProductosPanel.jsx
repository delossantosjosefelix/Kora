import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  Barcode,
  CheckCircle,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader,
  Package,
  Search,
  Tag,
  Trash,
  Upload,
  XCircle,
} from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import CustomSelect from '../ui/CustomSelect.jsx';
import CatalogoBar from './CatalogoBar.jsx';
import Paginacion from './Paginacion.jsx';
import { api } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';
import {
  formatearFecha,
  formatearMoneda,
  formatearNumero,
} from '../../utils/format.js';

const TASAS_ITBIS = [
  { valor: '18', etiqueta: '18 % (Estándar)' },
  { valor: '16', etiqueta: '16 % (Reducido)' },
  { valor: '0', etiqueta: '0 % (Exento)' },
];

const FORMULARIO_VACIO = {
  codigo: '',
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  unidad_id: '',
  costo: '',
  precio_final: '',
  tasa_itbis: '18',
  stock_minimo: 0,
  activo: true,
};

const POR_PAGINA = 8;
const MAX_TAMANO_IMAGEN_BYTES = 3 * 1024 * 1024; // 3 MB
const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function calcularDesglose(precioFinal, tasaItbis) {
  const precio = Number(precioFinal);
  const tasa = Number(tasaItbis);

  if (!Number.isFinite(precio) || precio < 0) {
    return { base: 0, itbis: 0 };
  }

  if (tasa === 0) {
    return { base: Number(precio.toFixed(2)), itbis: 0 };
  }

  const base = Number((precio / (1 + tasa / 100)).toFixed(2));
  const itbis = Number((precio - base).toFixed(2));

  return { base, itbis };
}

const ProductosPanel = forwardRef(function ProductosPanel(
  { tab, onCambiarTab, totales, onTotalChange },
  ref,
) {
  const { esAdministrador, esGerente } = useAuth();
  const puedeGestionar = esAdministrador || esGerente;
  const puedeVerCosto = esAdministrador || esGerente;

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [productoDetalle, setProductoDetalle] = useState(null);

  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState('');
  const [eliminarImagen, setEliminarImagen] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  const inputArchivoRef = useRef(null);

  const cargarCatalogosAuxiliares = useCallback(async () => {
    try {
      const [resCat, resUni] = await Promise.all([
        api.get('/categorias'),
        api.get('/unidades'),
      ]);

      if (resCat.ok) {
        setCategorias(resCat.datos?.categorias ?? []);
      }
      if (resUni.ok) {
        setUnidades(resUni.datos?.unidades ?? []);
      }
    } catch {
      // Si falla, el usuario aún puede ver la tabla
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const respuesta = await api.get('/productos');

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudieron cargar los productos.'),
        );
      }

      setProductos(respuesta.datos?.productos ?? []);
    } catch (error) {
      setErrorCarga(
        error.message || 'No se pudieron cargar los productos.',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarCatalogosAuxiliares();
  }, [cargarProductos, cargarCatalogosAuxiliares]);

  useEffect(() => {
    onTotalChange?.(productos.length);
  }, [productos, onTotalChange]);

  const abrirCrear = useCallback(() => {
    if (!puedeGestionar) return;

    setEditando(null);
    setForm(FORMULARIO_VACIO);
    setArchivoImagen(null);
    setPreviewImagen('');
    setEliminarImagen(false);
    setErrores({});
    setErrorForm('');
    setModalAbierto(true);
  }, [puedeGestionar]);

  const abrirEditar = (prod) => {
    if (!puedeGestionar) return;

    setEditando(prod);
    setForm({
      codigo: prod.codigo || '',
      codigo_barras: prod.codigo_barras || '',
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      categoria_id: String(prod.categoria_id || ''),
      unidad_id: String(prod.unidad_id || ''),
      costo: prod.costo !== null && prod.costo !== undefined ? String(prod.costo) : '',
      precio_final: String(prod.precio_final ?? ''),
      tasa_itbis: String(prod.tasa_itbis ?? '18'),
      stock_minimo: prod.stock_minimo ?? 0,
      activo: Boolean(prod.activo),
    });
    setArchivoImagen(null);
    setPreviewImagen(prod.imagen_url || '');
    setEliminarImagen(false);
    setErrores({});
    setErrorForm('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
    setForm(FORMULARIO_VACIO);
    setArchivoImagen(null);
    setPreviewImagen('');
    setEliminarImagen(false);
    setArrastrando(false);
    setErrores({});
    setErrorForm('');
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = '';
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      abrirCrear,
    }),
    [abrirCrear],
  );

  const procesarArchivoSeleccionado = (archivo) => {
    if (!archivo) return;

    const extension = archivo.name
      ? archivo.name.slice(archivo.name.lastIndexOf('.')).toLowerCase()
      : '';
    const extensionValida = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
    const tipoMime = (archivo.type || '').toLowerCase();
    const mimeValido =
      TIPOS_IMAGEN_PERMITIDOS.includes(tipoMime) ||
      tipoMime === 'image/jpg' ||
      tipoMime === 'image/pjpeg';

    if (!extensionValida && !mimeValido) {
      setErrores((ant) => ({
        ...ant,
        imagen: 'Solo se permiten imágenes JPEG, PNG o WEBP.',
      }));
      return;
    }

    if (archivo.size > MAX_TAMANO_IMAGEN_BYTES) {
      setErrores((ant) => ({
        ...ant,
        imagen: 'La imagen no puede superar los 3 MB.',
      }));
      return;
    }

    setErrores((ant) => {
      const nuevo = { ...ant };
      delete nuevo.imagen;
      return nuevo;
    });

    setArchivoImagen(archivo);
    setEliminarImagen(false);

    const lector = new FileReader();
    lector.onload = () => {
      setPreviewImagen(lector.result);
    };
    lector.readAsDataURL(archivo);
  };

  const quitarImagen = () => {
    setArchivoImagen(null);
    setPreviewImagen('');
    setEliminarImagen(Boolean(editando?.imagen_url));
    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = '';
    }
  };

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return productos.filter((prod) => {
      if (filtroEstado === 'activos' && !prod.activo) return false;
      if (filtroEstado === 'inactivos' && prod.activo) return false;

      if (filtroCategoria && String(prod.categoria_id) !== String(filtroCategoria)) {
        return false;
      }

      if (!termino) return true;

      const coincideNombre = prod.nombre?.toLowerCase().includes(termino);
      const coincideCodigo = prod.codigo?.toLowerCase().includes(termino);
      const coincideBarras = prod.codigo_barras?.toLowerCase().includes(termino);
      const coincideCat = prod.categoria_nombre?.toLowerCase().includes(termino);

      return coincideNombre || coincideCodigo || coincideBarras || coincideCat;
    });
  }, [productos, busqueda, filtroEstado, filtroCategoria]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(productosFiltrados.length / POR_PAGINA),
  );
  const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);

  const productosPaginados = useMemo(() => {
    const inicio = (paginaValida - 1) * POR_PAGINA;
    return productosFiltrados.slice(inicio, inicio + POR_PAGINA);
  }, [productosFiltrados, paginaValida]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.codigo.trim()) {
      nuevosErrores.codigo = 'El código es obligatorio.';
    } else if (form.codigo.trim().length > 30) {
      nuevosErrores.codigo = 'Máximo 30 caracteres.';
    }

    if (form.codigo_barras && form.codigo_barras.trim().length > 50) {
      nuevosErrores.codigo_barras = 'Máximo 50 caracteres.';
    }

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (form.nombre.trim().length > 120) {
      nuevosErrores.nombre = 'Máximo 120 caracteres.';
    }

    if (!form.categoria_id) {
      nuevosErrores.categoria_id = 'Selecciona una categoría.';
    }

    if (!form.unidad_id) {
      nuevosErrores.unidad_id = 'Selecciona una unidad de medida.';
    }

    const precioFinalNum = Number(form.precio_final);
    if (form.precio_final === '' || !Number.isFinite(precioFinalNum)) {
      nuevosErrores.precio_final = 'El precio es obligatorio y debe ser numérico.';
    } else if (precioFinalNum < 0) {
      nuevosErrores.precio_final = 'El precio no puede ser negativo.';
    }

    if (puedeVerCosto && form.costo !== '') {
      const costoNum = Number(form.costo);
      if (!Number.isFinite(costoNum)) {
        nuevosErrores.costo = 'El costo debe ser un valor numérico.';
      } else if (costoNum < 0) {
        nuevosErrores.costo = 'El costo no puede ser negativo.';
      }
    }

    if (form.descripcion && form.descripcion.trim().length > 500) {
      nuevosErrores.descripcion = 'Máximo 500 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setErrorForm('');

    if (!validarFormulario()) return;

    setGuardando(true);

    try {
      const datos = new FormData();
      datos.append('codigo', form.codigo.trim());
      if (form.codigo_barras?.trim()) {
        datos.append('codigo_barras', form.codigo_barras.trim());
      }
      datos.append('nombre', form.nombre.trim());
      if (form.descripcion?.trim()) {
        datos.append('descripcion', form.descripcion.trim());
      }
      datos.append('categoria_id', form.categoria_id);
      datos.append('unidad_id', form.unidad_id);
      datos.append('precio_final', form.precio_final);
      datos.append('tasa_itbis', form.tasa_itbis);
      datos.append('stock_minimo', String(form.stock_minimo ?? 0));
      datos.append('activo', String(form.activo));

      if (puedeVerCosto) {
        datos.append('costo', form.costo !== '' ? form.costo : '0');
      }

      if (archivoImagen) {
        datos.append('imagen', archivoImagen);
      } else if (eliminarImagen) {
        datos.append('eliminar_imagen', 'true');
      }

      const respuesta = editando
        ? await api.patch(`/productos/${editando.id}`, datos)
        : await api.post('/productos', datos);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            respuesta,
            editando
              ? 'No se pudo actualizar el producto.'
              : 'No se pudo crear el producto.',
          ),
        );
      }

      notify.success(
        editando
          ? 'Producto actualizado correctamente.'
          : 'Producto creado correctamente.',
      );

      cerrarModal();
      await cargarProductos();
    } catch (error) {
      setErrorForm(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (prod) => {
    if (!puedeGestionar) return;

    setProcesandoId(prod.id);
    const nuevoEstado = !prod.activo;

    try {
      const respuesta = await api.patch(`/productos/${prod.id}`, {
        activo: nuevoEstado,
      });

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo cambiar el estado del producto.'),
        );
      }

      notify.success(
        nuevoEstado
          ? 'Producto activado correctamente.'
          : 'Producto desactivado correctamente.',
      );

      await cargarProductos();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (prod) => {
    if (!puedeGestionar) return;

    const confirmado = await notify.confirm({
      titulo: 'Eliminar producto',
      texto: `¿Deseas eliminar "${prod.nombre}"? Esta acción no se puede deshacer si no tiene operaciones asociadas.`,
      confirmar: 'Sí, eliminar',
      cancelar: 'Cancelar',
      peligro: true,
    });

    if (!confirmado) return;

    setProcesandoId(prod.id);

    try {
      const respuesta = await api.delete(`/productos/${prod.id}`);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo eliminar el producto.'),
        );
      }

      notify.success('Producto eliminado correctamente.');
      await cargarProductos();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos' || filtroCategoria !== '';
  const desgloseForm = calcularDesglose(form.precio_final, form.tasa_itbis);

  const margenForm = useMemo(() => {
    if (!puedeVerCosto || form.costo === '') return null;
    const precio = Number(form.precio_final) || 0;
    const costo = Number(form.costo) || 0;
    const ganancia = precio - costo;
    const porcentaje = costo > 0 ? (ganancia / costo) * 100 : null;
    return { ganancia, porcentaje };
  }, [puedeVerCosto, form.precio_final, form.costo]);

  const opcionesCategorias = useMemo(() => {
    return [
      { valor: '', etiqueta: 'Todas las categorías' },
      ...categorias.map((c) => ({
        valor: String(c.id),
        etiqueta: c.nombre,
      })),
    ];
  }, [categorias]);

  return (
    <>
      {errorCarga ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorCarga}</span>
        </div>
      ) : null}

      <CatalogoBar
        tab={tab}
        onCambiarTab={onCambiarTab}
        totales={totales}
        busqueda={busqueda}
        onBuscar={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        filtroEstado={filtroEstado}
        onCambiarFiltro={(valor) => {
          setFiltroEstado(valor);
          setPagina(1);
        }}
        mostrarFiltro={true}
        controlExtra={
          categorias.length > 0 ? (
            <CustomSelect
              valor={filtroCategoria}
              onChange={(nuevo) => {
                setFiltroCategoria(nuevo);
                setPagina(1);
              }}
              placeholder="Todas las categorías"
              opciones={opcionesCategorias}
              aria-label="Filtrar por categoría"
            />
          ) : null
        }
        placeholderBusqueda="Buscar por nombre, código o categoría..."
        ariaLabelBusqueda="Buscar productos"
      />

      <div className="users-card">
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Precio (ITBIS inc.)</th>
                {puedeVerCosto ? <th>Costo</th> : null}
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={puedeVerCosto ? 7 : 6}>
                    <div className="loading-state">
                      <Loader size={18} className="spin" />
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={puedeVerCosto ? 7 : 6}>
                    <div className="empty-state">
                      <span className="empty-state-icon">
                        {hayFiltros ? (
                          <Search size={22} />
                        ) : (
                          <Package size={22} />
                        )}
                      </span>
                      <h3>
                        {hayFiltros
                          ? 'Sin coincidencias'
                          : 'Aún no hay productos en el catálogo'}
                      </h3>
                      <p>
                        {hayFiltros
                          ? 'Prueba modificando la búsqueda o los filtros aplicados.'
                          : puedeGestionar
                            ? 'Comienza registrando tu primer producto con su precio e imagen.'
                            : 'No se encontraron productos disponibles para este rol.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                productosPaginados.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div className="product-cell">
                        <img
                          src={prod.imagen_url || '/placeholder-producto.svg'}
                          alt={prod.nombre}
                          className="product-thumbnail"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-producto.svg';
                          }}
                        />
                        <div>
                          <div className="product-name">{prod.nombre}</div>
                          <div className="product-meta">
                            <span className="product-code-badge" title="Código interno">
                              <Tag size={12} />
                              {prod.codigo}
                            </span>
                            {prod.codigo_barras ? (
                              <span className="product-code-badge" title="Código de barras">
                                <Barcode size={12} />
                                {prod.codigo_barras}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="user-role-text">
                        {prod.categoria_nombre || 'Sin categoría'}
                      </span>
                    </td>
                    <td>
                      <span className="table-muted">
                        {prod.unidad_nombre} ({prod.unidad_abreviatura})
                      </span>
                    </td>
                    <td>
                      <div>
                        <div className="price-main">
                          {formatearMoneda(prod.precio_final)}
                        </div>
                        <div className="price-sub">
                          ITBIS: {prod.tasa_itbis}% ({formatearMoneda(prod.monto_itbis)})
                        </div>
                      </div>
                    </td>
                    {puedeVerCosto ? (
                      <td>
                        <div>
                          <div className="user-role-text">
                            {prod.costo !== null && prod.costo !== undefined
                              ? formatearMoneda(prod.costo)
                              : '-'}
                          </div>
                          {prod.margen_bruto !== null ? (
                            <div
                              className={`margin-tag${prod.margen_bruto < 0 ? ' margin-tag--negative' : ''}`}
                            >
                              Margen: {formatearMoneda(prod.margen_bruto)}
                              {prod.porcentaje_margen !== null
                                ? ` (${prod.porcentaje_margen}%)`
                                : ''}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                    <td>
                      <span
                        className={`user-status-text ${prod.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                      >
                        {prod.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setProductoDetalle(prod)}
                          aria-label={`Ver detalles de ${prod.nombre}`}
                          title="Ver detalles"
                        >
                          <Eye size={17} />
                        </button>

                        {puedeGestionar ? (
                          <>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => abrirEditar(prod)}
                              disabled={procesandoId === prod.id}
                              aria-label={`Editar ${prod.nombre}`}
                              title="Editar producto"
                            >
                              <Edit size={17} />
                            </button>

                            <button
                              type="button"
                              className={`icon-button${prod.activo ? ' icon-button--danger' : ''}`}
                              onClick={() => alternarActivo(prod)}
                              disabled={procesandoId === prod.id}
                              aria-label={
                                prod.activo
                                  ? `Desactivar ${prod.nombre}`
                                  : `Activar ${prod.nombre}`
                              }
                              title={
                                prod.activo
                                  ? 'Desactivar producto'
                                  : 'Activar producto'
                              }
                            >
                              {procesandoId === prod.id ? (
                                <Loader size={16} className="spin" />
                              ) : prod.activo ? (
                                <XCircle size={17} />
                              ) : (
                                <CheckCircle size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="icon-button icon-button--danger"
                              onClick={() => manejarEliminar(prod)}
                              disabled={procesandoId === prod.id}
                              aria-label={`Eliminar ${prod.nombre}`}
                              title="Eliminar producto"
                            >
                              <Trash size={16} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {productosFiltrados.length > 0 ? (
        <Paginacion
          pagina={paginaValida}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPagina}
        />
      ) : null}

      {/* Modal de Crear / Editar */}
      <Modal
        abierto={modalAbierto}
        onCerrar={cerrarModal}
        titulo={editando ? 'Editar producto' : 'Nuevo producto'}
        descripcion={
          editando
            ? 'Actualiza los datos, precios, categoría o imagen del producto.'
            : 'Registra un nuevo producto con su tasa de ITBIS y fotografía.'
        }
        footer={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-producto"
              className="button button--primary"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <Loader size={17} className="spin" />
                  Guardando...
                </>
              ) : editando ? (
                'Guardar cambios'
              ) : (
                'Crear producto'
              )}
            </button>
          </>
        }
      >
        <form
          id="form-producto"
          onSubmit={guardar}
          className="form-stack"
          noValidate
        >
          {errorForm ? (
            <div className="alert alert--error" role="alert">
              <AlertCircle size={16} />
              <span>{errorForm}</span>
            </div>
          ) : null}

          {/* Subida de Imagen */}
          <div className="field">
            <span className="field-label">Fotografía del producto</span>
            <div
              className={`image-uploader${arrastrando ? ' image-uploader--dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setArrastrando(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                const archivo = e.dataTransfer?.files?.[0];
                if (archivo) {
                  procesarArchivoSeleccionado(archivo);
                }
              }}
            >
              <button
                type="button"
                className="image-uploader-preview-btn"
                onClick={() => {
                  if (inputArchivoRef.current) {
                    inputArchivoRef.current.value = '';
                    inputArchivoRef.current.click();
                  }
                }}
                title={previewImagen ? 'Hacer clic para cambiar fotografía' : 'Hacer clic para seleccionar fotografía'}
                aria-label="Seleccionar o cambiar imagen del producto"
              >
                <img
                  src={previewImagen || '/placeholder-producto.svg'}
                  alt="Vista previa"
                  className="image-uploader-preview"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-producto.svg';
                  }}
                />
              </button>

              <div className="image-uploader-info">
                <div className="image-uploader-actions">
                  <input
                    ref={inputArchivoRef}
                    type="file"
                    id="input-foto-producto"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      if (archivo) {
                        procesarArchivoSeleccionado(archivo);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="button button--secondary button--sm"
                    onClick={() => {
                      if (inputArchivoRef.current) {
                        inputArchivoRef.current.value = '';
                        inputArchivoRef.current.click();
                      }
                    }}
                  >
                    <Upload size={14} />
                    {previewImagen ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </button>

                  {previewImagen ? (
                    <button
                      type="button"
                      className="button button--danger-soft button--sm"
                      onClick={quitarImagen}
                    >
                      <Trash size={14} />
                      Quitar
                    </button>
                  ) : null}
                </div>

                {archivoImagen ? (
                  <span className="field-hint" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
                    {archivoImagen.name} ({Math.round(archivoImagen.size / 1024)} KB)
                  </span>
                ) : previewImagen ? (
                  <span className="field-hint">
                    Fotografía asignada al producto.
                  </span>
                ) : (
                  <span className="field-hint">
                    Formatos permitidos: JPG, PNG o WEBP (máx. 3 MB). Arrastra una imagen o haz clic para subir.
                  </span>
                )}

                {errores.imagen ? (
                  <span className="field-error">{errores.imagen}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-codigo">Código interno *</label>
              <input
                id="prod-codigo"
                type="text"
                className={`input${errores.codigo ? ' input--error' : ''}`}
                value={form.codigo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, codigo: e.target.value }))
                }
                placeholder="Ej. PROD-001"
                maxLength={30}
                required
              />
              {errores.codigo ? (
                <span className="field-error">{errores.codigo}</span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="prod-codigo-barras">Código de barras</label>
              <input
                id="prod-codigo-barras"
                type="text"
                className={`input${errores.codigo_barras ? ' input--error' : ''}`}
                value={form.codigo_barras}
                onChange={(e) =>
                  setForm((f) => ({ ...f, codigo_barras: e.target.value }))
                }
                placeholder="Ej. 7461234567890"
                maxLength={50}
              />
              {errores.codigo_barras ? (
                <span className="field-error">{errores.codigo_barras}</span>
              ) : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="prod-nombre">Nombre del producto *</label>
            <input
              id="prod-nombre"
              type="text"
              className={`input${errores.nombre ? ' input--error' : ''}`}
              value={form.nombre}
              onChange={(e) =>
                setForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej. Arroz Premium 5 lbs"
              maxLength={120}
              required
            />
            {errores.nombre ? (
              <span className="field-error">{errores.nombre}</span>
            ) : null}
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-categoria">Categoría *</label>
              <CustomSelect
                id="prod-categoria"
                className="custom-select-wrap--form"
                valor={form.categoria_id}
                onChange={(val) => {
                  setForm((f) => ({ ...f, categoria_id: val }));
                  setErrores((e) => ({ ...e, categoria_id: '' }));
                  setErrorForm('');
                }}
                placeholder="Selecciona una categoría..."
                opciones={categorias.map((c) => ({
                  valor: String(c.id),
                  etiqueta: c.nombre,
                }))}
                error={Boolean(errores.categoria_id)}
                aria-label="Categoría del producto"
              />
              {errores.categoria_id ? (
                <span className="field-error">{errores.categoria_id}</span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="prod-unidad">Unidad de medida *</label>
              <CustomSelect
                id="prod-unidad"
                className="custom-select-wrap--form"
                valor={form.unidad_id}
                onChange={(val) => {
                  setForm((f) => ({ ...f, unidad_id: val }));
                  setErrores((e) => ({ ...e, unidad_id: '' }));
                  setErrorForm('');
                }}
                placeholder="Selecciona una unidad..."
                opciones={unidades.map((u) => ({
                  valor: String(u.id),
                  etiqueta: `${u.nombre} (${u.abreviatura})`,
                }))}
                error={Boolean(errores.unidad_id)}
                aria-label="Unidad de medida del producto"
              />
              {errores.unidad_id ? (
                <span className="field-error">{errores.unidad_id}</span>
              ) : null}
            </div>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-precio">Precio final (con ITBIS) *</label>
              <input
                id="prod-precio"
                type="number"
                step="0.01"
                min="0"
                className={`input${errores.precio_final ? ' input--error' : ''}`}
                value={form.precio_final}
                onChange={(e) =>
                  setForm((f) => ({ ...f, precio_final: e.target.value }))
                }
                placeholder="0.00"
                required
              />
              {errores.precio_final ? (
                <span className="field-error">{errores.precio_final}</span>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="prod-tasa-itbis">Tasa de ITBIS *</label>
              <CustomSelect
                id="prod-tasa-itbis"
                className="custom-select-wrap--form"
                valor={form.tasa_itbis}
                onChange={(val) =>
                  setForm((f) => ({ ...f, tasa_itbis: val }))
                }
                opciones={TASAS_ITBIS}
                aria-label="Tasa de ITBIS"
              />
            </div>
          </div>

          {/* Desglose de ITBIS en vivo */}
          <div className="tax-breakdown-box">
            <div className="tax-breakdown-item">
              <span className="tax-breakdown-label">Precio base</span>
              <span className="tax-breakdown-value">
                {formatearMoneda(desgloseForm.base)}
              </span>
            </div>
            <div className="tax-breakdown-item">
              <span className="tax-breakdown-label">ITBIS ({form.tasa_itbis}%)</span>
              <span className="tax-breakdown-value">
                {formatearMoneda(desgloseForm.itbis)}
              </span>
            </div>
            <div className="tax-breakdown-item">
              <span className="tax-breakdown-label">Total a cobrar</span>
              <span className="tax-breakdown-value">
                {formatearMoneda(form.precio_final || 0)}
              </span>
            </div>
          </div>

          {puedeVerCosto ? (
            <div className="field-grid">
              <div className="field">
                <label htmlFor="prod-costo">Costo de compra</label>
                <input
                  id="prod-costo"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`input${errores.costo ? ' input--error' : ''}`}
                  value={form.costo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costo: e.target.value }))
                  }
                  placeholder="0.00"
                />
                <span className="field-hint">
                  Visible solo para administración y gerencia.
                </span>
                {errores.costo ? (
                  <span className="field-error">{errores.costo}</span>
                ) : null}
              </div>

              <div className="field">
                <span className="field-label">Margen estimado</span>
                <div className="tax-breakdown-box" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="tax-breakdown-item">
                    <span className="tax-breakdown-label">Ganancia</span>
                    <span
                      className="tax-breakdown-value"
                      style={{
                        color: margenForm && margenForm.ganancia < 0 ? 'var(--color-error)' : '#16a34a',
                      }}
                    >
                      {margenForm ? formatearMoneda(margenForm.ganancia) : '-'}
                    </span>
                  </div>
                  <div className="tax-breakdown-item">
                    <span className="tax-breakdown-label">Rentabilidad</span>
                    <span
                      className="tax-breakdown-value"
                      style={{
                        color: margenForm && margenForm.ganancia < 0 ? 'var(--color-error)' : '#16a34a',
                      }}
                    >
                      {margenForm && margenForm.porcentaje !== null
                        ? `${margenForm.porcentaje.toFixed(1)}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="prod-stock-minimo">Stock mínimo de alerta</label>
              <input
                id="prod-stock-minimo"
                type="number"
                min="0"
                step="1"
                className="input"
                value={form.stock_minimo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stock_minimo: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
              />
              <span className="field-hint">
                Alerta cuando las existencias alcancen este nivel.
              </span>
            </div>

            <div className="field">
              <span className="field-label">Estado</span>
              <label className="checkbox-label" style={{ marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, activo: e.target.checked }))
                  }
                />
                <span>Producto activo y disponible para venta</span>
              </label>
            </div>
          </div>

          <div className="field">
            <label htmlFor="prod-descripcion">Descripción o notas</label>
            <textarea
              id="prod-descripcion"
              className="textarea"
              rows={3}
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Detalles sobre presentación, marca o empaque..."
              maxLength={500}
            />
            {errores.descripcion ? (
              <span className="field-error">{errores.descripcion}</span>
            ) : null}
          </div>
        </form>
      </Modal>

      {/* Modal de Detalle */}
      <Modal
        abierto={Boolean(productoDetalle)}
        onCerrar={() => setProductoDetalle(null)}
        titulo="Detalle del producto"
        descripcion="Información completa, imagen y parámetros fiscales del producto."
        footer={
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setProductoDetalle(null)}
          >
            Cerrar
          </button>
        }
      >
        {productoDetalle ? (
          <div>
            <div className="detail-image-box">
              <img
                src={productoDetalle.imagen_url || '/placeholder-producto.svg'}
                alt={productoDetalle.nombre}
                className="detail-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder-producto.svg';
                }}
              />
            </div>

            <div className="detail-grid">
              <div className="detail-item detail-item--full">
                <span className="detail-label">Nombre del producto</span>
                <span className="detail-value" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  {productoDetalle.nombre}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Código interno</span>
                <span className="detail-value">{productoDetalle.codigo}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Código de barras</span>
                <span className="detail-value">
                  {productoDetalle.codigo_barras || 'No registrado'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Categoría</span>
                <span className="detail-value">
                  {productoDetalle.categoria_nombre || 'Sin categoría'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Unidad de medida</span>
                <span className="detail-value">
                  {productoDetalle.unidad_nombre} ({productoDetalle.unidad_abreviatura})
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Precio final (con ITBIS)</span>
                <span className="detail-value" style={{ fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                  {formatearMoneda(productoDetalle.precio_final)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Tasa de ITBIS</span>
                <span className="detail-value">
                  {productoDetalle.tasa_itbis}% ({formatearMoneda(productoDetalle.monto_itbis)})
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Precio base</span>
                <span className="detail-value">
                  {formatearMoneda(productoDetalle.precio_base)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Estado</span>
                <span className="detail-value">
                  <span
                    className={`user-status-text ${productoDetalle.activo ? 'user-status-text--active' : 'user-status-text--inactive'}`}
                  >
                    {productoDetalle.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </span>
              </div>

              {/* Costo y márgenes: estrictamente visibles solo para Admin y Gerente */}
              {puedeVerCosto ? (
                <>
                  <div className="detail-item">
                    <span className="detail-label">Costo de compra</span>
                    <span className="detail-value">
                      {productoDetalle.costo !== null && productoDetalle.costo !== undefined
                        ? formatearMoneda(productoDetalle.costo)
                        : 'No registrado'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Margen de ganancia</span>
                    <span className="detail-value">
                      {productoDetalle.margen_bruto !== null ? (
                        <span
                          className={`margin-tag${productoDetalle.margen_bruto < 0 ? ' margin-tag--negative' : ''}`}
                        >
                          {formatearMoneda(productoDetalle.margen_bruto)}
                          {productoDetalle.porcentaje_margen !== null
                            ? ` (${productoDetalle.porcentaje_margen}%)`
                            : ''}
                        </span>
                      ) : (
                        'No disponible'
                      )}
                    </span>
                  </div>
                </>
              ) : null}

              <div className="detail-item">
                <span className="detail-label">Stock actual</span>
                <span className="detail-value">
                  {formatearNumero(productoDetalle.stock_actual)} {productoDetalle.unidad_abreviatura}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Stock mínimo</span>
                <span className="detail-value">
                  {formatearNumero(productoDetalle.stock_minimo)} {productoDetalle.unidad_abreviatura}
                </span>
              </div>

              <div className="detail-item detail-item--full">
                <span className="detail-label">Descripción</span>
                <div className="detail-value detail-value--box">
                  {productoDetalle.descripcion || 'Sin descripción adicional.'}
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Fecha de registro</span>
                <span className="detail-value">
                  {formatearFecha(productoDetalle.created_at)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
});

export default ProductosPanel;
