import { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'reicon-react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../services/api.js';
import notify from '../../utils/notify.js';
import { mensajeError } from '../../utils/apiError.js';

const FORMULARIO_VACIO = {
  nombre: '',
  rnc: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
};

export default function SuplidorModal({
  abierto,
  onCerrar,
  suplidorEditando = null,
  onGuardadoExitoso,
}) {
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      if (suplidorEditando) {
        setForm({
          nombre: suplidorEditando.nombre || '',
          rnc: suplidorEditando.rnc || '',
          contacto: suplidorEditando.contacto || '',
          telefono: suplidorEditando.telefono || '',
          email: suplidorEditando.email || '',
          direccion: suplidorEditando.direccion || '',
          activo: Boolean(suplidorEditando.activo),
        });
      } else {
        setForm(FORMULARIO_VACIO);
      }
      setErrores({});
      setErrorForm('');
    }
  }, [abierto, suplidorEditando]);

  const validar = () => {
    const nuevos = {};

    if (!form.nombre.trim()) {
      nuevos.nombre = 'El nombre del suplidor o razón social es obligatorio.';
    } else if (form.nombre.trim().length > 120) {
      nuevos.nombre = 'Máximo 120 caracteres.';
    }

    if (form.rnc && form.rnc.trim().length > 15) {
      nuevos.rnc = 'Máximo 15 caracteres.';
    }

    if (form.contacto && form.contacto.trim().length > 80) {
      nuevos.contacto = 'Máximo 80 caracteres.';
    }

    if (form.telefono && form.telefono.trim().length > 20) {
      nuevos.telefono = 'Máximo 20 caracteres.';
    }

    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        nuevos.email = 'Formato de correo electrónico inválido.';
      } else if (form.email.trim().length > 100) {
        nuevos.email = 'Máximo 100 caracteres.';
      }
    }

    if (form.direccion && form.direccion.trim().length > 200) {
      nuevos.direccion = 'Máximo 200 caracteres.';
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!validar()) return;

    setGuardando(true);

    try {
      const datos = {
        nombre: form.nombre.trim(),
        rnc: form.rnc.trim() || null,
        contacto: form.contacto.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
        activo: form.activo,
      };

      const respuesta = suplidorEditando
        ? await api.patch(`/suplidores/${suplidorEditando.id}`, datos)
        : await api.post('/suplidores', datos);

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            respuesta,
            suplidorEditando
              ? 'No se pudo actualizar el suplidor.'
              : 'No se pudo registrar el suplidor.',
          ),
        );
      }

      notify.success(
        suplidorEditando
          ? 'Suplidor actualizado exitosamente.'
          : 'Suplidor registrado exitosamente.',
      );

      onCerrar();
      await onGuardadoExitoso?.();
    } catch (error) {
      setErrorForm(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={suplidorEditando ? 'Editar suplidor' : 'Nuevo suplidor'}
      descripcion={
        suplidorEditando
          ? 'Actualiza los datos comerciales y de contacto del suplidor.'
          : 'Registra un proveedor de mercancías para compras e inventario.'
      }
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
            form="form-suplidor"
            className="button button--primary"
            disabled={guardando}
          >
            {guardando ? (
              <>
                <Loader size={17} className="spin" />
                Guardando...
              </>
            ) : suplidorEditando ? (
              'Guardar cambios'
            ) : (
              'Registrar suplidor'
            )}
          </button>
        </>
      }
    >
      <form
        id="form-suplidor"
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
          <label htmlFor="sup-nombre">Razón social o nombre comercial *</label>
          <input
            id="sup-nombre"
            type="text"
            className={`input${errores.nombre ? ' input--error' : ''}`}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Distribuidora Central Dominicana SRL"
            maxLength={120}
            required
          />
          {errores.nombre ? (
            <span className="field-error">{errores.nombre}</span>
          ) : null}
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="sup-rnc">RNC o cédula</label>
            <input
              id="sup-rnc"
              type="text"
              className={`input${errores.rnc ? ' input--error' : ''}`}
              value={form.rnc}
              onChange={(e) => setForm((f) => ({ ...f, rnc: e.target.value }))}
              placeholder="Ej. 101002345"
              maxLength={15}
            />
            {errores.rnc ? (
              <span className="field-error">{errores.rnc}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="sup-contacto">Persona de contacto</label>
            <input
              id="sup-contacto"
              type="text"
              className={`input${errores.contacto ? ' input--error' : ''}`}
              value={form.contacto}
              onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              placeholder="Ej. Lic. Carlos Méndez"
              maxLength={80}
            />
            {errores.contacto ? (
              <span className="field-error">{errores.contacto}</span>
            ) : null}
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="sup-telefono">Teléfono</label>
            <input
              id="sup-telefono"
              type="tel"
              className={`input${errores.telefono ? ' input--error' : ''}`}
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              placeholder="Ej. 809-555-0123"
              maxLength={20}
            />
            {errores.telefono ? (
              <span className="field-error">{errores.telefono}</span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="sup-email">Correo electrónico</label>
            <input
              id="sup-email"
              type="email"
              className={`input${errores.email ? ' input--error' : ''}`}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Ej. ventas@distribuidora.com"
              maxLength={100}
            />
            {errores.email ? (
              <span className="field-error">{errores.email}</span>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="sup-direccion">Dirección física</label>
          <input
            id="sup-direccion"
            type="text"
            className={`input${errores.direccion ? ' input--error' : ''}`}
            value={form.direccion}
            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
            placeholder="Ej. Av. Luperón #45, Zona Industrial Herrera, Santo Domingo"
            maxLength={200}
          />
          {errores.direccion ? (
            <span className="field-error">{errores.direccion}</span>
          ) : null}
        </div>

        <div className="field">
          <span className="field-label">Estado</span>
          <label className="checkbox-label" style={{ marginTop: '8px' }}>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
            />
            <span>Suplidor activo y habilitado para compras</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
