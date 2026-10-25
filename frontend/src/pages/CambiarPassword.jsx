import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader,
  Lock,
  Minus,
  ShieldAlert,
  ShieldCheck,
} from 'reicon-react';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { useAuth } from '../hooks/useAuth.js';

const FORMULARIO_INICIAL = { actual: '', nueva: '', confirmar: '' };

export default function CambiarPassword() {
  const { usuario, cambiarPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const obligatorio = Boolean(usuario?.debe_cambiar_password);

  const requisitos = [
    {
      texto: 'Al menos 8 caracteres',
      cumple: form.nueva.length >= 8,
    },
    {
      texto: 'Diferente a la contraseña actual',
      cumple: Boolean(form.nueva) && form.nueva !== form.actual,
    },
    {
      texto: 'Coincide con la confirmación',
      cumple: Boolean(form.confirmar) && form.nueva === form.confirmar,
    },
  ];

  const actualizarCampo = (campo) => (evento) => {
    setForm((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErrores((anterior) => ({ ...anterior, [campo]: '' }));
    setErrorGeneral('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = {};
    if (!form.actual) {
      nuevosErrores.actual = 'Escribe tu contraseña actual.';
    }
    if (form.nueva.length < 8) {
      nuevosErrores.nueva = 'La nueva contraseña debe tener al menos 8 caracteres.';
    } else if (form.nueva === form.actual) {
      nuevosErrores.nueva = 'La nueva contraseña debe ser diferente a la actual.';
    }
    if (!form.confirmar) {
      nuevosErrores.confirmar = 'Confirma tu nueva contraseña.';
    } else if (form.nueva !== form.confirmar) {
      nuevosErrores.confirmar = 'Las contraseñas no coinciden.';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      setEnviando(true);
      setErrorGeneral('');
      await cambiarPassword(form);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorGeneral(error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h2>{obligatorio ? 'Actualiza tu contraseña' : 'Cambiar contraseña'}</h2>
        <p>
          {obligatorio
            ? 'Por seguridad, debes crear una contraseña nueva antes de continuar.'
            : 'Elige una contraseña nueva y segura para tu cuenta.'}
        </p>
      </div>

      {obligatorio ? (
        <div className="alert alert--warning">
          <ShieldAlert size={18} />
          <span>
            Este paso es obligatorio. La contraseña que te entregaron es temporal.
          </span>
        </div>
      ) : null}

      {errorGeneral ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorGeneral}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={manejarEnvio} noValidate>
        <PasswordInput
          id="password-actual"
          label="Contraseña actual"
          icon={Lock}
          autoComplete="current-password"
          value={form.actual}
          onChange={actualizarCampo('actual')}
          error={errores.actual}
          placeholder="Tu contraseña actual"
        />

        <PasswordInput
          id="password-nueva"
          label="Nueva contraseña"
          icon={Lock}
          autoComplete="new-password"
          value={form.nueva}
          onChange={actualizarCampo('nueva')}
          error={errores.nueva}
          placeholder="Mínimo 8 caracteres"
        />

        <PasswordInput
          id="password-confirmar"
          label="Confirmar nueva contraseña"
          icon={ShieldCheck}
          autoComplete="new-password"
          value={form.confirmar}
          onChange={actualizarCampo('confirmar')}
          error={errores.confirmar}
          placeholder="Repite la nueva contraseña"
        />

        <ul className="auth-requirements" aria-label="Requisitos de la contraseña">
          {requisitos.map((requisito) => (
            <li
              key={requisito.texto}
              className={`auth-requirement${requisito.cumple ? ' auth-requirement--ok' : ''}`}
            >
              <span className="auth-requirement-icon">
                {requisito.cumple ? <Check size={10} /> : <Minus size={10} />}
              </span>
              {requisito.texto}
            </li>
          ))}
        </ul>

        <button
          type="submit"
          className="button button--primary button--block"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <Loader size={18} className="spin" />
              Actualizando...
            </>
          ) : (
            'Guardar nueva contraseña'
          )}
        </button>
      </form>

      {!obligatorio ? (
        <Link to="/dashboard" className="auth-back">
          <ArrowLeft size={16} />
          Volver al panel
        </Link>
      ) : null}
    </>
  );
}
