import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart, Search, LogOut, Store } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
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

  // Scroll-based navbar background and height
  const { scrollY } = useScroll();
  const navbarHeight = useTransform(scrollY, [0, 120], [80, 64]);
  const navbarBg = useTransform(scrollY, [0, 100], ['rgba(0,0,0,0)', 'rgba(15,23,42,0.95)']);
  const navbarShadow = useTransform(scrollY, [0, 100], ['none', '0 10px 25px -3px rgba(0, 0, 0, 0.1)']);

  // Simple page detection to tailor visible actions
  const isHome = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ 
        height: navbarHeight,
        backgroundColor: navbarBg,
        boxShadow: navbarShadow
      }}
      className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-full py-2 sm:py-3 gap-2 min-w-0">
          <button
            className="group flex items-center space-x-1 sm:space-x-2 md:space-x-3 cursor-pointer flex-shrink-0 min-w-0"
            onClick={() => navigate('/')}
            aria-label="KiranaConnect Home"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="bg-gradient-to-r from-orange-500 to-green-500 p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </motion.div>
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <span className="text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold tracking-tight text-white/95 whitespace-nowrap">
                <span>Kirana</span>
                <span className="text-green-400">Connect</span>
              </span>
              <motion.span
                className="hidden md:flex items-center text-xs sm:text-sm text-slate-300/80 bg-white/10 px-2 sm:px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Namaste <span className="ml-1">👋</span>
              </motion.span>
            </div>
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 flex-shrink-0 min-w-0">
            {role === 'customer' && (
              <div className="hidden md:flex items-center relative w-64 lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, shops, or categories..."
                  className="w-full pl-12 pr-4 py-2.5 sm:py-3 rounded-full bg-white/10 border border-white/20 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 shadow-lg backdrop-blur-sm transition-all duration-300 text-sm sm:text-base"
                />
              </div>
            )}
            {!isHome && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Prevent double navigation
                  if (isNavigating || location.pathname === '/') return;
                  
                  setIsNavigating(true);
                  navigate('/', { replace: true });
                  
                  // Reset navigation flag after a short delay
                  setTimeout(() => {
                    setIsNavigating(false);
                  }, 1000);
                }}
                className={`relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-slate-200/90 hover:text-white ${location.pathname === '/' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'} group`}
                title="Back to home"
                type="button"
                disabled={isNavigating}
              >
                <span className="text-xs sm:text-sm">Home</span>
                <span className="absolute left-2 sm:left-3 md:left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && (
              <button
                onClick={() => navigate('/dashboard')}
                className={`relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-300 text-slate-200/90 hover:text-white ${location.pathname.startsWith('/dashboard') ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'} group`}
                title="Your dashboard"
              >
                <span className="text-xs sm:text-sm">Dashboard</span>
                <span className="absolute left-2 sm:left-3 md:left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && role !== 'shopowner' && (
              <button
                onClick={openCartDrawer}
                className={`relative flex items-center justify-center sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-500/90 hover:bg-green-500 text-white rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${cartItemsCount > 0 ? 'animate-pulse' : ''}`}
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}
            {isHome ? (
              <>
                {isLoggedIn ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/dashboard')}
                      className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-full border border-white/20 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2"
                      title={`Go to ${role === 'shopowner' ? 'Shop' : 'Customer'} Dashboard`}
                    >
                      {role === 'shopowner' ? (
                        <>
                          <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Shopkeeper</span>
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Customer</span>
                        </>
                      )}
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
                      className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-full border border-red-500/30 text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2"
                      title="Sign out"
                    >
                      <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Logout</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (location.pathname === '/') {
                          // If already on home, trigger modal via custom event
                          window.dispatchEvent(new CustomEvent('openLoginModal'));
                        } else {
                          navigate('/?login=true');
                        }
                      }}
                      className="px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-full border border-white/20 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base"
                      title="Sign in to your account"
                    >
                      <span className="text-xs sm:text-sm">Login</span>
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/signup', { state: { selectedRole: 'shopowner' } })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-2 sm:px-3 md:px-4 lg:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm md:text-base"
                      title="Join your neighborhood network"
                    >
                      <span className="text-xs sm:text-sm">Get Started</span>
                      <span className="pointer-events-none absolute -inset-0.5 rounded-full shadow-[0_0_30px_0] shadow-green-400/0 animate-[pulse_3.5s_ease-in-out_infinite]" />
                    </motion.button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Hide login/get started on non-home pages if already authenticated; keep account/cart etc. */}
              </>
            )}
            {isLoggedIn && (
              <button
                onClick={() => setAccountOpen(true)}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 text-slate-200 hover:text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm flex-shrink-0 relative z-10 cursor-pointer"
                aria-label="Account"
                title="Account"
                type="button"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} role={role as 'customer' | 'shopowner' | null} />
    </motion.nav>
  );
};

export default Navbar; 