import { useEffect, useState } from 'react';
import { AlertCircle, Loader, LockOpen } from 'reicon-react';
import CustomSelect from '../ui/CustomSelect.jsx';

const EFECTIVO_INICIAL_MAXIMO = 9999999.99;

function validarFormulario({ cajaId, efectivoInicial, observacion }) {
  const errores = {};

  if (!cajaId) {
    errores.caja = 'Selecciona una caja disponible.';
  }

  const montoTexto = String(efectivoInicial).trim();

  if (!montoTexto) {
    errores.efectivo = 'Indica el efectivo inicial.';
  } else {
    const monto = Number(montoTexto);

    if (!Number.isFinite(monto)) {
      errores.efectivo = 'El efectivo inicial debe ser un número válido.';
    } else if (monto < 0) {
      errores.efectivo = 'El efectivo inicial no puede ser negativo.';
    } else if (monto > EFECTIVO_INICIAL_MAXIMO) {
      errores.efectivo = 'El efectivo inicial supera el máximo permitido.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(montoTexto)) {
      errores.efectivo = 'Usa como máximo dos decimales.';
    }
  }

  if (observacion.trim().length > 255) {
    errores.observacion = 'La observación no puede superar los 255 caracteres.';
  }

  return errores;
}

export default function AbrirCajaForm({
  cajasDisponibles,
  onAbrir,
  enviando = false,
  errorServidor = '',
}) {
  const [cajaId, setCajaId] = useState('');
  const [efectivoInicial, setEfectivoInicial] = useState('');
  const [observacion, setObservacion] = useState('');
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (cajasDisponibles.length === 1) {
      setCajaId(String(cajasDisponibles[0].id));
      return;
    }

    const seleccionSigueDisponible = cajasDisponibles.some(
      (caja) => String(caja.id) === cajaId,
    );

    if (!seleccionSigueDisponible) {
      setCajaId('');
    }
  }, [cajasDisponibles, cajaId]);

  const opcionesCaja = cajasDisponibles.map((caja) => ({
    valor: String(caja.id),
    etiqueta: caja.nombre,
  }));

  const enviarFormulario = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = validarFormulario({
      cajaId,
      efectivoInicial,
      observacion,
    });

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    await onAbrir({
      cajaId: Number(cajaId),
      efectivoInicial: Number(efectivoInicial),
      observacion: observacion.trim(),
    });
  };

  return (
    <section className="caja-card">
      <div className="caja-card-header">
        <div>
          <h2 className="caja-card-title">Abrir caja</h2>
          <p className="caja-card-subtitle">
            Registra el efectivo inicial para comenzar tu turno.
          </p>
        </div>
      </div>

      {errorServidor ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorServidor}</span>
        </div>
      ) : null}

      <form className="caja-form" onSubmit={enviarFormulario} noValidate>
        <div className="field">
          <label className="field-label" htmlFor="caja-select">
            Caja
          </label>
          <CustomSelect
            id="caja-select"
            valor={cajaId}
            onChange={(valor) => {
              setCajaId(valor);
              setErrores((actuales) => ({ ...actuales, caja: '' }));
            }}
            opciones={opcionesCaja}
            placeholder="Selecciona una caja disponible"
            error={Boolean(errores.caja)}
            disabled={enviando}
            aria-label="Caja disponible"
          />
          {errores.caja ? (
            <p className="field-error" id="caja-select-error" role="alert">
              {errores.caja}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="caja-efectivo">
            Efectivo inicial (RD$)
          </label>
          <input
            id="caja-efectivo"
            type="number"
            className={`input${errores.efectivo ? ' input--error' : ''}`}
            value={efectivoInicial}
            onChange={(evento) => {
              setEfectivoInicial(evento.target.value);
              setErrores((actuales) => ({ ...actuales, efectivo: '' }));
            }}
            placeholder="0.00"
            min="0"
            max={EFECTIVO_INICIAL_MAXIMO}
            step="0.01"
            inputMode="decimal"
            disabled={enviando}
            aria-invalid={Boolean(errores.efectivo)}
            aria-describedby={errores.efectivo ? 'caja-efectivo-error' : 'caja-efectivo-hint'}
          />
          <p className="field-hint" id="caja-efectivo-hint">
            Monto contado al momento de abrir la caja.
          </p>
          {errores.efectivo ? (
            <p className="field-error" id="caja-efectivo-error" role="alert">
              {errores.efectivo}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="caja-observacion">
            Observación (opcional)
          </label>
          <textarea
            id="caja-observacion"
            className={`textarea${errores.observacion ? ' input--error' : ''}`}
            value={observacion}
            onChange={(evento) => {
              setObservacion(evento.target.value);
              setErrores((actuales) => ({ ...actuales, observacion: '' }));
            }}
            placeholder="Detalles sobre la apertura del turno"
            rows={3}
            maxLength={255}
            disabled={enviando}
            aria-invalid={Boolean(errores.observacion)}
            aria-describedby={errores.observacion ? 'caja-observacion-error' : undefined}
          />
          {errores.observacion ? (
            <p className="field-error" id="caja-observacion-error" role="alert">
              {errores.observacion}
            </p>
          ) : null}
        </div>

        <div className="caja-form-actions">
          <button type="submit" className="button button--primary" disabled={enviando}>
            {enviando ? (
              <Loader size={16} className="spin" />
            ) : (
              <LockOpen size={16} />
            )}
            {enviando ? 'Abriendo caja...' : 'Abrir caja'}
          </button>
        </div>
      </form>
    </section>
  );
}
