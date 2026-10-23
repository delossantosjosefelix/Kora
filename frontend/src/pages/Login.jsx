import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { useAuth } from '../hooks/useAuth.js';
import notify from '../utils/notify.js';
import '../styles/auth.css';

export default function Login() {
  const { iniciarSesion, cargando } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    try {
      setEnviando(true);
      const ok = await iniciarSesion({
        username: form.username,
        password: form.password,
      });
      if (!ok) {
        notify.error('Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      notify.error(error.message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="brand">
        <BrandLogo variante="color" className="brand-logo" alt="Kora" />
        <h2>Iniciar sesión</h2>
        <p>Acceda al punto de venta de Kora.</p>
      </div>
      <form onSubmit={manejarEnvio} noValidate>
        <div className="auth-field">
          <label htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            required
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="button button--primary button--block"
          disabled={enviando || cargando}
        >
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="auth-footer">
        Kora · Punto de venta académico
      </div>
    </div>
  );
}
