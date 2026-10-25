import { useId, useState } from 'react';
import { Eye, EyeClosed } from 'reicon-react';

export default function PasswordInput({
  id,
  label,
  error,
  hint,
  autoComplete = 'current-password',
  icon: Icono,
  ...props
}) {
  const idGenerado = useId();
  const inputId = id || idGenerado;
  const [visible, setVisible] = useState(false);
  const etiquetaBoton = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';

  return (
    <div className="field">
      {label ? <label htmlFor={inputId}>{label}</label> : null}
      <div className={`password-field${Icono ? ' has-leading-icon' : ''}`}>
        {Icono ? (
          <span className="leading-icon" aria-hidden="true">
            <Icono size={18} />
          </span>
        ) : null}
        <input
          {...props}
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`input${error ? ' input--error' : ''}`}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((valor) => !valor)}
          aria-label={etiquetaBoton}
          title={etiquetaBoton}
          aria-pressed={visible}
        >
          {visible ? <Eye size={18} /> : <EyeClosed size={18} />}
        </button>
      </div>
      {error ? (
        <span className="field-error">{error}</span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}
