import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Simple Error Boundary to catch crashes and show a UI instead of white screen
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f5f3] text-coffee-900">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-coffee-100 text-center">
            <h1 className="text-2xl font-extrabold text-red-600 mb-4">Ops! Qualcosa non va.</h1>
            <p className="text-sm text-coffee-600 mb-6 font-medium">
              Si è verificato un errore imprevisto nell'applicazione.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40 border border-gray-200">
              <code className="text-xs text-red-800 break-all">
                {this.state.error?.message}
              </code>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full bg-coffee-800 text-white py-3 rounded-xl font-bold hover:bg-coffee-900 transition-colors shadow-lg shadow-coffee-900/20"
            >
              Reset Dati e Riprova
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);