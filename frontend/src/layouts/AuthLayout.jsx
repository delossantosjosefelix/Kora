export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <main className="auth-card">{children}</main>
    </div>
  );
}
