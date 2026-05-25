import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart, Search, LogOut, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from './CartContext';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getUserData } from '../utils/orderUtils';
import AccountDrawer from './AccountDrawer';
import { useSearch } from './SearchContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, openCartDrawer } = useCart();
  const [role, setRole] = React.useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const { searchQuery, setSearchQuery } = useSearch();

  React.useEffect(() => {
    if (!auth) {
      setRole(null);
      setIsLoggedIn(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);
      try {
        const res = await getUserData(user.uid);
        if (res.success) setRole(res.data.role || null);
        else setRole(null);
      } catch {
        setRole(null);
      }
    });
    return () => unsub();
  }, []);
  
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Simple page detection to tailor visible actions
  const isHome = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 w-full z-[100] h-20 bg-black/40 backdrop-blur-xl border-b border-white/10 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full py-2 gap-4">
          {/* Logo (Left) */}
          <button
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/')}
            aria-label="KiranaConnect Home"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="flex-shrink-0"
            >
              <img 
                src="/app%20logo.png" 
                alt="KiranaConnect Logo"
                className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.svg';
                }}
              />
            </motion.div>
            <div className="flex items-center">
              <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white whitespace-nowrap">
                <span>Kirana</span>
                <span className="text-[#ff6a00]">Connect</span>
              </span>
            </div>
          </button>

          {/* Nav Links (Center) */}
          {isHome && (
            <div className="hidden lg:flex items-center justify-center space-x-8 flex-1 pl-12">
              <a href="#" className="text-[#ff6a00] font-medium text-[13px] hover:text-[#ff6a00] transition-colors relative tracking-wide">
                Home
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#ff6a00] rounded-full" />
              </a>
              <a href="#" className="text-slate-300 font-medium text-[13px] hover:text-white transition-colors tracking-wide">For Customers</a>
              <a href="#" className="text-slate-300 font-medium text-[13px] hover:text-white transition-colors tracking-wide">For Shop Owners</a>
              <a href="#" className="text-slate-300 font-medium text-[13px] hover:text-white transition-colors tracking-wide">About Us</a>
              <a href="#" className="text-slate-300 font-medium text-[13px] hover:text-white transition-colors tracking-wide">Resources</a>
            </div>
          )}

          {/* Actions (Right) */}
          <div className="flex items-center justify-end space-x-3 lg:space-x-4 flex-shrink-0 w-auto">
            {role === 'customer' && (
              <div className="hidden md:flex items-center relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-11 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ff6a00] shadow-md backdrop-blur-sm transition-all duration-300 text-sm"
                />
              </div>
            )}
            
            {!isHome && role !== 'shopowner' && (
              <button
                onClick={openCartDrawer}
                className={`relative flex items-center justify-center sm:space-x-2 px-3 md:px-4 py-2 bg-[#ff6a00]/90 hover:bg-[#ff6a00] text-white rounded-full transition-all duration-300 shadow-md ${cartItemsCount > 0 ? 'animate-pulse' : ''}`}
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border border-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}

            {isLoggedIn ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-full border border-white/20 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm text-sm flex items-center gap-2"
                >
                  {role === 'shopowner' ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="hidden sm:inline text-sm">Dashboard</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    try {
                      await signOut(auth);
                      navigate('/');
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="px-4 py-2 rounded-full border border-red-500/30 text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 backdrop-blur-sm text-sm flex items-center gap-2"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
                <button
                  onClick={() => setAccountOpen(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 text-slate-200 hover:text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                  title="Account"
                >
                  <User className="h-4 w-4" />
                </button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (location.pathname === '/') {
                    window.dispatchEvent(new CustomEvent('openLoginModal'));
                  } else {
                    navigate('/?login=true');
                  }
                }}
                className="px-5 py-2 rounded-full border border-white/60 text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm text-sm font-medium"
              >
                Login / Sign Up
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} role={role as 'customer' | 'shopowner' | null} />
    </motion.nav>
  );
};

export default Navbar; 