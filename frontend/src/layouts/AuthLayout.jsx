import BrandLogo from '../components/BrandLogo.jsx';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-card">
          <aside className="auth-brand">
            <BrandLogo variante="color" alt="" className="auth-brand-logo" />
            <p className="auth-brand-title">Kora</p>
          </aside>

          <section className="auth-panel">
            <div className="auth-mobile-brand">
              <BrandLogo variante="negro" alt="Kora" />
              <strong>Kora</strong>
            </div>
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
