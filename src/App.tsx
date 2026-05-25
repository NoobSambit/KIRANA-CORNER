import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { CartProvider } from './components/CartContext';
import { SearchProvider } from './components/SearchContext';
import AppRoutes from './routes/index';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App render failed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
          <div className="mx-auto mt-20 max-w-2xl rounded-xl border border-red-500/40 bg-red-950/30 p-6">
            <h1 className="text-xl font-semibold text-red-200">App failed to render</h1>
            <pre className="mt-4 overflow-auto whitespace-pre-wrap text-sm text-red-100">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const safetyTimer = window.setTimeout(() => {
      console.warn('Firebase Auth did not respond quickly. Continuing without a signed-in user.');
      setUser(null);
      setLoading(false);
    }, 2000);

    if (!auth) {
      setUser(null);
      setLoading(false);
      window.clearTimeout(safetyTimer);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      window.clearTimeout(safetyTimer);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      window.clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <CartProvider>
        <SearchProvider>
          <Router>
            <AppRoutes isAuthenticated={!!user} />
          </Router>
        </SearchProvider>
      </CartProvider>
    </AppErrorBoundary>
  );
}

export default App;
