import { Component } from 'react';
import { AlertTriangle } from 'reicon-react';

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
        <div className="state-screen">
          <div className="state-card">
            <div className="state-card-icon">
              <AlertTriangle size={26} />
            </div>
            <h1>Algo salió mal</h1>
            <p>
              {this.state.error?.message ||
                'Ocurrió un error inesperado al mostrar la aplicación.'}
            </p>
            <button
              type="button"
              className="button button--primary"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
