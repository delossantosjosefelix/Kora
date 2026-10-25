import { useState } from 'react';
import { AlertCircle, Loader, Lock, User } from 'reicon-react';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const actualizarCampo = (campo) => (evento) => {
    setForm((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErrores((anterior) => ({ ...anterior, [campo]: '' }));
    setErrorGeneral('');
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = {};
    if (!form.username.trim()) {
      nuevosErrores.username = 'Escribe tu nombre de usuario.';
    }
    if (!form.password) {
      nuevosErrores.password = 'Escribe tu contraseña.';
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      setEnviando(true);
      setErrorGeneral('');
      await iniciarSesion({
        username: form.username.trim(),
        password: form.password,
      });
    } catch (error) {
      setErrorGeneral(error.message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="auth-header">
        <h1>Acceso al sistema</h1>
        <p>Ingresa tus datos para continuar.</p>
      </div>

      {errorGeneral ? (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{errorGeneral}</span>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={manejarEnvio} noValidate>
        <div className="field">
          <label htmlFor="username">Nombre de usuario</label>
          <div className="input-wrap has-leading-icon">
            <span className="leading-icon" aria-hidden="true">
              <User size={18} />
            </span>
            <input
              id="username"
              className={`input${errores.username ? ' input--error' : ''}`}
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={actualizarCampo('username')}
              aria-invalid={Boolean(errores.username)}
              placeholder="tu.usuario"
            />
          </div>
          {errores.username ? (
            <span className="field-error">{errores.username}</span>
          ) : null}
        </div>

        <PasswordInput
          id="password"
          label="Contraseña"
          icon={Lock}
          autoComplete="current-password"
          value={form.password}
          onChange={actualizarCampo('password')}
          error={errores.password}
          placeholder="Escribe tu contraseña"
        />

        <button
          type="submit"
          className="button button--primary button--block"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <Loader size={18} className="spin" />
              Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </button>
      </form>

      <p className="auth-form-footer">
        ¿Olvidaste tu contraseña? Solicita al administrador que la restablezca.
      </p>

    </>
  );
}
