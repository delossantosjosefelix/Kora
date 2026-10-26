import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader } from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import CustomSelect from '../ui/CustomSelect.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';
import { formatearNumero } from '../../utils/format.js';

const OPCIONES_TIPO = [
  { valor: 'AJUSTE', etiqueta: 'Ajuste manual de existencias' },
  { valor: 'MERMA', etiqueta: 'Merma (daño, rotura o pérdida)' },
];

const OPCIONES_MODO = [
  { valor: 'VARIACION', etiqueta: 'Por variación (+ / - unidades)' },
  { valor: 'OBJETIVO', etiqueta: 'Por conteo físico directo (stock final)' },
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
    if (!productoId) return null;
    return productos.find(
      (p) => String(p.producto_id || p.id) === String(productoId),
    );
  }, [productoId, productos]);

  const stockActual = Number(productoActual?.stock_actual ?? 0);

  const calculo = useMemo(() => {
    if (!productoActual) return { delta: 0, resultante: 0, valido: false };

    if (modo === 'OBJETIVO') {
      const objetivoNum = Number(stockObjetivo);
      if (stockObjetivo === '' || !Number.isFinite(objetivoNum) || objetivoNum < 0) {
        return { delta: 0, resultante: stockActual, valido: false };
      }
      const delta = Number((objetivoNum - stockActual).toFixed(3));
      return { delta, resultante: objetivoNum, valido: delta !== 0 };
    }

    // Modo VARIACION
    const variacionNum = Number(variacion);
    if (variacion === '' || !Number.isFinite(variacionNum) || variacionNum === 0) {
      return { delta: 0, resultante: stockActual, valido: false };
    }

    const deltaAplicado = tipo === 'MERMA' ? -Math.abs(variacionNum) : variacionNum;
    const resultante = Number((stockActual + deltaAplicado).toFixed(3));
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
      const objetivoNum = Number(stockObjetivo);
      if (stockObjetivo === '' || !Number.isFinite(objetivoNum)) {
        nuevosErrores.stockObjetivo = 'Ingresa el stock físico resultante.';
      } else if (objetivoNum < 0) {
        nuevosErrores.stockObjetivo = 'El stock no puede ser negativo.';
      } else if (objetivoNum === stockActual) {
        nuevosErrores.stockObjetivo = 'El stock objetivo es igual al actual; no hay variación.';
      }
    } else {
      const variacionNum = Number(variacion);
      if (variacion === '' || !Number.isFinite(variacionNum)) {
        nuevosErrores.variacion = 'Ingresa una cantidad numérica.';
      } else if (variacionNum === 0) {
        nuevosErrores.variacion = 'La cantidad no puede ser cero.';
      } else if (calculo.resultante < 0) {
        nuevosErrores.variacion = `Stock insuficiente. La reducción máxima es ${stockActual}.`;
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
        cuerpo.stock_resultante_objetivo = Number(stockObjetivo);
      } else {
        cuerpo.cantidad = tipo === 'MERMA' ? Math.abs(Number(variacion)) : Number(variacion);
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
        etiqueta: `${p.nombre} (${p.codigo}) - Actual: ${formatearNumero(p.stock_actual)} ${p.unidad_abreviatura || ''}`,
      })),
    ];
  }, [productos]);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tipo === 'MERMA' ? 'Registrar merma o pérdida' : 'Ajustar existencias'}
      descripcion="Ajusta el inventario por conteo físico o registra mermas justificadas."
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
              'Confirmar merma'
            ) : (
              'Guardar ajuste'
            )}
          </button>
        </>
      }
    >
      <form
        id="form-ajuste-inventario"
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

        <div className="field">
          <label htmlFor="ajuste-producto">Producto a ajustar *</label>
          <CustomSelect
            id="ajuste-producto"
            className="custom-select-wrap--form"
            valor={productoId}
            onChange={(val) => {
              setProductoId(val);
              setErrores((e) => ({ ...e, productoId: '' }));
            }}
            placeholder="Selecciona un producto..."
            opciones={opcionesProductos}
            error={Boolean(errores.productoId)}
            aria-label="Producto a ajustar"
          />
          {errores.productoId ? (
            <span className="field-error">{errores.productoId}</span>
          ) : null}
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="ajuste-tipo">Tipo de operación *</label>
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
            <label htmlFor="ajuste-modo">Método de cálculo *</label>
            <CustomSelect
              id="ajuste-modo"
              className="custom-select-wrap--form"
              valor={modo}
              onChange={(val) => setModo(val)}
              opciones={
                tipo === 'MERMA'
                  ? [{ valor: 'VARIACION', etiqueta: 'Cantidad perdida o dañada' }]
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
              step="0.001"
              min="0"
              className={`input${errores.stockObjetivo ? ' input--error' : ''}`}
              value={stockObjetivo}
              onChange={(e) => setStockObjetivo(e.target.value)}
              placeholder="Ej. 50"
              required
            />
            {errores.stockObjetivo ? (
              <span className="field-error">{errores.stockObjetivo}</span>
            ) : (
              <span className="field-hint">
                Indica la cantidad real contada. El sistema calculará la diferencia exacta.
              </span>
            )}
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
              step="0.001"
              className={`input${errores.variacion ? ' input--error' : ''}`}
              value={variacion}
              onChange={(e) => setVariacion(e.target.value)}
              placeholder={tipo === 'MERMA' ? 'Ej. 3' : 'Ej. +10 o -5'}
              required
            />
            {errores.variacion ? (
              <span className="field-error">{errores.variacion}</span>
            ) : (
              <span className="field-hint">
                {tipo === 'MERMA'
                  ? 'Cantidad física que se descontará por pérdida o daño.'
                  : 'Ingresa un número positivo para aumentar o negativo para reducir.'}
              </span>
            )}
          </div>
        )}

        {/* Resumen visual de la variación calculada */}
        <div className="tax-breakdown-box">
          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">Stock actual</span>
            <span className="tax-breakdown-value">
              {formatearNumero(stockActual)} {productoActual?.unidad_abreviatura || ''}
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
              {calculo.delta > 0 ? `+${formatearNumero(calculo.delta)}` : formatearNumero(calculo.delta)}{' '}
              {productoActual?.unidad_abreviatura || ''}
            </span>
          </div>

          <div className="tax-breakdown-item">
            <span className="tax-breakdown-label">Stock resultante</span>
            <span
              className="tax-breakdown-value"
              style={{
                fontWeight: 700,
                color:
                  calculo.resultante <= 0
                    ? 'var(--color-error)'
                    : 'var(--color-ink)',
              }}
            >
              {formatearNumero(calculo.resultante)} {productoActual?.unidad_abreviatura || ''}
            </span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="ajuste-motivo">Motivo o justificación de la operación *</label>
          <textarea
            id="ajuste-motivo"
            className={`textarea${errores.motivo ? ' textarea--error' : ''}`}
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Conteo físico fin de mes, rotura de empaque en estantería..."
            maxLength={200}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {errores.motivo ? (
              <span className="field-error">{errores.motivo}</span>
            ) : (
              <span className="field-hint">
                Obligatorio para auditoría y control contable.
              </span>
            )}
            <span className="field-hint">{motivo.length} / 200</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
