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
      className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-full py-2 sm:py-3">
          <button
            className="group flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
            aria-label="KiranaConnect Home"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="bg-gradient-to-r from-orange-500 to-green-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg"
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <span className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white/95">
                Kirana<span className="text-green-400">Connect</span>
              </span>
              <motion.span
                className="hidden sm:flex items-center text-xs sm:text-sm text-slate-300/80 bg-white/10 px-2 sm:px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Namaste <span className="ml-1">👋</span>
              </motion.span>
            </div>
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
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
                onClick={() => navigate('/')}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 text-slate-200/90 hover:text-white ${location.pathname === '/' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'} group`}
                title="Back to home"
              >
                <span className="inline-block">Home</span>
                <span className="absolute left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && (
              <button
                onClick={() => navigate('/dashboard')}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 text-slate-200/90 hover:text-white ${location.pathname.startsWith('/dashboard') ? 'bg-white/10 border border-white/20' : 'hover:bg-white/10'} group`}
                title="Your dashboard"
              >
                <span className="inline-block">Dashboard</span>
                <span className="absolute left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && role !== 'shopowner' && (
              <button
                onClick={openCartDrawer}
                className={`relative flex items-center space-x-2 px-4 py-2 bg-green-500/90 hover:bg-green-500 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm ${cartItemsCount > 0 ? 'animate-pulse' : ''}`}
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
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
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border border-white/20 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center gap-2"
                      title={`Go to ${role === 'shopowner' ? 'Shop' : 'Customer'} Dashboard`}
                    >
                      {role === 'shopowner' ? (
                        <>
                          <Store className="h-4 w-4" />
                          <span className="hidden sm:inline">Shopkeeper</span>
                          <span className="sm:hidden">Shop</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          <span className="hidden sm:inline">Customer</span>
                          <span className="sm:hidden">Customer</span>
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
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border border-red-500/30 text-red-300 hover:text-red-100 bg-red-500/10 hover:bg-red-500/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center gap-2"
                      title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Logout</span>
                      <span className="sm:hidden">Out</span>
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
                      className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full border border-white/20 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl text-sm sm:text-base"
                      title="Sign in to your account"
                    >
                      <span className="hidden sm:inline">Login</span>
                      <span className="sm:hidden">Sign In</span>
                    </motion.button>
                    <motion.button
                      onClick={() => navigate('/signup', { state: { selectedRole: 'shopowner' } })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                      title="Join your neighborhood network"
                    >
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Join</span>
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
            {!isHome && (
              <button
                onClick={() => setAccountOpen(true)}
                className="ml-1 hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-slate-200 hover:text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                aria-label="Account"
                title="Account"
              >
                <User className="h-5 w-5" />
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