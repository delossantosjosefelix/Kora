import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#DC2626',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <h2 style={{ margin: '0 0 12px' }}>Error inesperado</h2>
          <p style={{ margin: '0 0 16px' }}>
            {this.state.error?.message || 'Ocurrió un error al renderizar la aplicación.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              background: '#0F766E',
              color: '#FFFFFF',
              border: '0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
