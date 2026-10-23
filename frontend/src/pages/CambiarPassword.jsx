import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import notify from '../utils/notify.js';
import '../styles/auth.css';

export default function CambiarPassword() {
  const { cambiarPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [enviando, setEnviando] = useState(false);

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!form.nueva || form.nueva.length < 8) {
      notify.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.nueva !== form.confirmar) {
      notify.error('Las contraseñas no coinciden.');
      return;
    }

    try {
      setEnviando(true);
      const ok = await cambiarPassword({
        actual: form.actual,
        nueva: form.nueva,
        confirmar: form.confirmar,
      });
      if (ok) {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      notify.error(error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="brand">
        <h2>Cambiar contraseña</h2>
        <p>Establezca su nueva contraseña de acceso.</p>
      </div>
      <form onSubmit={manejarEnvio} noValidate>
        <div className="auth-field">
          <label htmlFor="actual">Contraseña actual</label>
          <input
            id="actual"
            type="password"
            required
            autoComplete="current-password"
            value={form.actual}
            onChange={(e) => setForm({ ...form, actual: e.target.value })}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="nueva">Nueva contraseña</label>
          <input
            id="nueva"
            type="password"
            required
            autoComplete="new-password"
            value={form.nueva}
            onChange={(e) => setForm({ ...form, nueva: e.target.value })}
          />
        </div>
        <div className="auth-field">
          <label htmlFor="confirmar">Confirmar nueva contraseña</label>
          <input
            id="confirmar"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmar}
            onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
          />
        </div>
        <button type="submit" className="button button--primary button--block" disabled={enviando}>
          {enviando ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
      <div className="auth-footer">
        <a href="/dashboard">Volver al panel</a>
      </div>
    </div>
  );
}
