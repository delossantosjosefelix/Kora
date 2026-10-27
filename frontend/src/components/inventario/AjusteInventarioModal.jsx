import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader, Tag } from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import CustomSelect from '../ui/CustomSelect.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearEntero } from '../../utils/format.js';

const OPCIONES_TIPO = [
  { valor: 'AJUSTE', etiqueta: 'Ajuste Manual De Existencias' },
  { valor: 'MERMA', etiqueta: 'Merma (Daño, Rotura O Pérdida)' },
];

const OPCIONES_MODO = [
  { valor: 'VARIACION', etiqueta: 'Por Variación (+ / - Unidades)' },
  { valor: 'OBJETIVO', etiqueta: 'Por Conteo Físico Directo (Stock Final)' },
];

export default function AjusteInventarioModal({
  abierto,
  onCerrar,
  productoSeleccionado,
  productos = [],
  onAjusteExitoso,
}) {
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState('AJUSTE');
  const [modo, setModo] = useState('VARIACION');
  const [variacion, setVariacion] = useState('');
  const [stockObjetivo, setStockObjetivo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (abierto) {
      setProductoId(productoSeleccionado?.producto_id || productoSeleccionado?.id || '');
      setTipo('AJUSTE');
      setModo('VARIACION');
      setVariacion('');
      setStockObjetivo('');
      setMotivo('');
      setErrorForm('');
      setErrores({});
    }
  }, [abierto, productoSeleccionado]);

  const productoActual = useMemo(() => {
    if (
      productoSeleccionado &&
      String(productoSeleccionado.producto_id || productoSeleccionado.id) === String(productoId)
    ) {
      return productoSeleccionado;
    }
    if (!productoId) return null;
    return productos.find(
      (p) => String(p.producto_id || p.id) === String(productoId),
    );
  }, [productoId, productos, productoSeleccionado]);

  const stockActual = Math.round(Number(productoActual?.stock_actual ?? 0));

  const calculo = useMemo(() => {
    if (!productoActual) return { delta: 0, resultante: 0, valido: false };

    if (modo === 'OBJETIVO') {
      const valStr = String(stockObjetivo).trim();
      if (valStr === '' || !/^\d+$/.test(valStr)) {
        return { delta: 0, resultante: stockActual, valido: false };
      }
      const objetivoNum = parseInt(valStr, 10);
      const delta = objetivoNum - stockActual;
      return { delta, resultante: objetivoNum, valido: delta !== 0 };
    }

    // Modo VARIACION
    const valStr = String(variacion).trim();
    if (valStr === '' || !/^-?\d+$/.test(valStr)) {
      return { delta: 0, resultante: stockActual, valido: false };
    }
    const variacionNum = parseInt(valStr, 10);
    if (variacionNum === 0) {
      return { delta: 0, resultante: stockActual, valido: false };
    }

    const deltaAplicado = tipo === 'MERMA' ? -Math.abs(variacionNum) : variacionNum;
    const resultante = stockActual + deltaAplicado;
    return {
      delta: deltaAplicado,
      resultante,
      valido: resultante >= 0,
    };
  }, [productoActual, stockActual, modo, stockObjetivo, variacion, tipo]);

  const validar = () => {
    const nuevosErrores = {};

    if (!productoId) {
      nuevosErrores.productoId = 'Selecciona un producto.';
    }

    if (!motivo.trim()) {
      nuevosErrores.motivo = 'El motivo de la operación es obligatorio.';
    } else if (motivo.trim().length > 200) {
      nuevosErrores.motivo = 'Máximo 200 caracteres.';
    }

    if (modo === 'OBJETIVO') {
      const valStr = String(stockObjetivo).trim();
      if (!valStr) {
        nuevosErrores.stockObjetivo = 'Ingresa el stock físico resultante.';
      } else if (!/^\d+$/.test(valStr)) {
        nuevosErrores.stockObjetivo = 'Solo se permiten números enteros positivos o cero.';
      } else {
        const objetivoNum = parseInt(valStr, 10);
        if (objetivoNum === stockActual) {
          nuevosErrores.stockObjetivo = 'El stock objetivo es igual al actual; no hay variación.';
        }
      }
    } else {
      const valStr = String(variacion).trim();
      if (!valStr) {
        nuevosErrores.variacion = 'Ingresa una cantidad entera.';
      } else if (!/^-?\d+$/.test(valStr)) {
        nuevosErrores.variacion = 'Solo se permiten números enteros (sin decimales).';
      } else {
        const variacionNum = parseInt(valStr, 10);
        if (variacionNum === 0) {
          nuevosErrores.variacion = 'La cantidad no puede ser cero.';
        } else if (calculo.resultante < 0) {
          nuevosErrores.variacion = `Stock insuficiente. La reducción máxima es ${stockActual}.`;
        }
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!validar()) return;

    setGuardando(true);

    try {
      const cuerpo = {
        producto_id: productoId,
        tipo,
        motivo: motivo.trim(),
      };

      if (modo === 'OBJETIVO') {
        cuerpo.stock_resultante_objetivo = parseInt(stockObjetivo, 10);
      } else {
        cuerpo.cantidad = tipo === 'MERMA' ? Math.abs(parseInt(variacion, 10)) : parseInt(variacion, 10);
      }

      const respuesta = await api.post('/inventario/ajuste', cuerpo);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(respuesta, 'No se pudo registrar el ajuste de inventario.'),
        );
      }

      notify.success(
        tipo === 'MERMA'
          ? 'Merma registrada exitosamente.'
          : 'Ajuste de inventario registrado exitosamente.',
      );

      onCerrar();
      await onAjusteExitoso?.();
    } catch (error) {
      setErrorForm(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesProductos = useMemo(() => {
    return [
      { valor: '', etiqueta: 'Selecciona un producto...' },
      ...productos.map((p) => ({
        valor: String(p.producto_id || p.id),
        etiqueta: `${p.nombre} (${p.codigo}) - Actual: ${formatearEntero(p.stock_actual)} ${p.unidad_abreviatura || ''}`,
      })),
    ];
  }, [productos]);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tipo === 'MERMA' ? 'Registrar Merma o Pérdida' : 'Ajustar Existencias'}
      tamano="md"
      footer={
        <>
          <button
            type="button"
            className="button button--secondary"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-ajuste-inventario"
            className="button button--primary"
            disabled={guardando}
          >
            {guardando ? (
              <>
                <Loader size={17} className="spin" />
                Registrando...
              </>
            ) : tipo === 'MERMA' ? (
              'Confirmar Merma'
            ) : (
              'Guardar Ajuste'
            )}
          </button>
        </>
      }
    >
      <form
        id="form-ajuste-inventario"
        onSubmit={guardar}
        className="form-stack form-stack--compact"
        noValidate
      >
        {errorForm ? (
          <div className="alert alert--error" role="alert">
            <AlertCircle size={16} />
            <span>{errorForm}</span>
          </div>
        ) : null}

        {/* Muestra el producto de manera simple y clara */}
        {productoSeleccionado && productoActual ? (
          <div className="product-summary-card">
            <img
              src={productoActual.imagen_url || '/placeholder-producto.svg'}
              alt={productoActual.nombre}
              className="product-thumbnail"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-producto.svg';
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="product-name" style={{ fontSize: '0.94rem' }}>
                {productoActual.nombre}
              </div>
              <div className="product-meta">
                <span className="product-code-badge" title="Código interno">
                  <Tag size={12} />
                  {productoActual.codigo}
                </span>
                {productoActual.categoria_nombre ? (
                  <span>{productoActual.categoria_nombre}</span>
                ) : null}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span className="field-hint" style={{ display: 'block' }}>Stock actual</span>
              <span style={{ fontWeight: 750, fontSize: '1.05rem', color: 'var(--color-ink)' }}>
                {formatearEntero(stockActual)} {productoActual.unidad_abreviatura || ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ajuste-producto">Producto A Ajustar *</label>
            <CustomSelect
              id="ajuste-producto"
              className="custom-select-wrap--form"
              valor={productoId}
              onChange={(val) => {
                setProductoId(val);
                setErrores((e) => ({ ...e, productoId: '' }));
              }}
              placeholder="Seleccionar Producto..."
              opciones={opcionesProductos}
              error={Boolean(errores.productoId)}
              aria-label="Producto a ajustar"
            />
            {errores.productoId ? (
              <span className="field-error">{errores.productoId}</span>
            ) : null}

            {productoActual ? (
              <div className="product-summary-card" style={{ marginTop: '8px' }}>
                <img
                  src={productoActual.imagen_url || '/placeholder-producto.svg'}
                  alt={productoActual.nombre}
                  className="product-thumbnail"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-producto.svg';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="product-name" style={{ fontSize: '0.94rem' }}>
                    {productoActual.nombre}
                  </div>
                  <div className="product-meta">
                    <span className="product-code-badge" title="Código interno">
                      <Tag size={12} />
                      {productoActual.codigo}
                    </span>
                    {productoActual.categoria_nombre ? (
                      <span>{productoActual.categoria_nombre}</span>
                    ) : null}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="field-hint" style={{ display: 'block' }}>Stock Actual</span>
                  <span style={{ fontWeight: 750, color: 'var(--color-ink)' }}>
                    {formatearEntero(stockActual)} {productoActual.unidad_abreviatura || ''}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="field-grid">
          <div className="field">
            <label htmlFor="ajuste-tipo">Tipo De Operación *</label>
            <CustomSelect
              id="ajuste-tipo"
              className="custom-select-wrap--form"
              valor={tipo}
              onChange={(val) => {
                setTipo(val);
                if (val === 'MERMA') {
                  setModo('VARIACION');
                }
              }}
              opciones={OPCIONES_TIPO}
              aria-label="Tipo de operación de inventario"
            />
          </div>

          <div className="field">
            <label htmlFor="ajuste-modo">Método De Cálculo *</label>
            <CustomSelect
              id="ajuste-modo"
              className="custom-select-wrap--form"
              valor={modo}
              onChange={(val) => setModo(val)}
              opciones={
                tipo === 'MERMA'
                  ? [{ valor: 'VARIACION', etiqueta: 'Cantidad Perdida O Dañada' }]
                  : OPCIONES_MODO
              }
              aria-label="Método de cálculo"
            />
          </div>
        </div>

        {modo === 'OBJETIVO' ? (
          <div className="field">
            <label htmlFor="ajuste-stock-objetivo">
              Conteo físico final (unidades contadas en almacén) *
            </label>
            <input
              id="ajuste-stock-objetivo"
              type="number"
              step="1"
              min="0"
              className={`input${errores.stockObjetivo ? ' input--error' : ''}`}
              value={stockObjetivo}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('.') || val.includes(',')) return;
                setStockObjetivo(val);
                setErrores((prev) => ({ ...prev, stockObjetivo: '' }));
              }}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              placeholder="Ej. 50"
              required
            />
            {errores.stockObjetivo ? (
              <span className="field-error">{errores.stockObjetivo}</span>
            ) : null}
          </div>
        ) : (
          <div className="field">
            <label htmlFor="ajuste-variacion">
              {tipo === 'MERMA'
                ? 'Cantidad mermada / dañada *'
                : 'Cantidad a sumar (+) o restar (-) *'}
            </label>
            <input
              id="ajuste-variacion"
              type="number"
              step="1"
              min={tipo === 'MERMA' ? '1' : undefined}
              className={`input${errores.variacion ? ' input--error' : ''}`}
              value={variacion}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('.') || val.includes(',')) return;
                setVariacion(val);
                setErrores((prev) => ({ ...prev, variacion: '' }));
              }}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              placeholder={tipo === 'MERMA' ? 'Ej. 3' : 'Ej. +10 o -5'}
              required
            />
            {errores.variacion ? (
              <span className="field-error">{errores.variacion}</span>
            ) : null}
          </div>
        )}

        {/* Resumen visual de la variación calculada */}
        <div className="tax-breakdown-box">
          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">Stock actual</span>
            <span className="tax-breakdown-value">
              {formatearEntero(stockActual)} {productoActual?.unidad_abreviatura || ''}
            </span>
          </div>

          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">Variación</span>
            <span
              className="tax-breakdown-value"
              style={{
                color:
                  calculo.delta > 0
                    ? '#16a34a'
                    : calculo.delta < 0
                      ? 'var(--color-error)'
                      : 'inherit',
              }}
            >
              {calculo.delta > 0 ? `+${formatearEntero(calculo.delta)}` : formatearEntero(calculo.delta)}{' '}
              {productoActual?.unidad_abreviatura || ''}
            </span>
          </div>

          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">Stock resultante</span>
            <span
              className="tax-breakdown-value"
              style={{
                fontWeight: 600,
                color:
                  calculo.resultante <= 0
                    ? 'var(--color-error)'
                    : 'var(--color-ink)',
              }}
            >
              {formatearEntero(calculo.resultante)} {productoActual?.unidad_abreviatura || ''}
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ajuste-motivo">Motivo o justificación de la operación *</label>
          <textarea
            id="ajuste-motivo"
            className={`textarea${errores.motivo ? ' textarea--error' : ''}`}
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Conteo físico fin de mes, rotura de empaque en estantería..."
            maxLength={200}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            {errores.motivo ? (
              <span className="field-error">{errores.motivo}</span>
            ) : <span />}
            <span className="field-hint">{motivo.length} / 200</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
