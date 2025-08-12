import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { CartProvider } from './components/CartContext';
import { SearchProvider } from './components/SearchContext';
import AppRoutes from './routes/index';

function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
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
    <CartProvider>
      <SearchProvider>
        <Router>
          <AppRoutes isAuthenticated={!!user} />
        </Router>
      </SearchProvider>
    </CartProvider>
  );
}

export default App;