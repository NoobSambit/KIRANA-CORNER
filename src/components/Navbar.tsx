import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, ShoppingCart, Search } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useCart } from './CartContext';
import { onAuthStateChanged } from 'firebase/auth';
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
  const [accountOpen, setAccountOpen] = React.useState(false);
  const { searchQuery, setSearchQuery } = useSearch();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        return;
      }
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

  // Scroll-based navbar shrink and opacity
  const { scrollY } = useScroll();
  const navbarHeight = useTransform(scrollY, [0, 120], [72, 60]);

  // Simple page detection to tailor visible actions
  const isHome = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ height: navbarHeight }}
      className="sticky top-0 z-50 shadow-xl bg-transparent"
    >
      <div className="absolute inset-0 -z-10 bg-black" />
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center h-full py-3">
          <button
            className="group flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
            aria-label="KiranaConnect Home"
          >
            <motion.div
              initial={{ scale: 0.9, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="bg-gradient-to-r from-neon-orange to-neon-green p-2 rounded-xl shadow-md shadow-black/10"
            >
              <ShoppingBag className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold tracking-tight text-white/95">
                Kirana<span className="text-neon-green">Connect</span>
              </span>
              <motion.span
                className="hidden sm:flex items-center text-sm text-slate-300/80 bg-white/5 px-2 py-0.5 rounded-full border border-white/10"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Namaste <span className="ml-1">👋</span>
              </motion.span>
            </div>
          </button>

          <div className="flex items-center space-x-4">
            {role === 'customer' && (
              <div className="hidden md:flex items-center relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, shops, or categories..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/10 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-green/50"
                />
              </div>
            )}
            {!isHome && (
              <button
                onClick={() => navigate('/')}
                className={`relative px-4 py-2 rounded-xl font-medium transition-colors duration-200 text-slate-200/90 hover:text-white ${location.pathname === '/' ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'} group`}
                title="Back to home"
              >
                <span className="inline-block">Home</span>
                <span className="absolute left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-neon-orange to-neon-green transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && (
              <button
                onClick={() => navigate('/dashboard')}
                className={`relative px-4 py-2 rounded-xl font-medium transition-colors duration-200 text-slate-200/90 hover:text-white ${location.pathname.startsWith('/dashboard') ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'} group`}
                title="Your dashboard"
              >
                <span className="inline-block">Dashboard</span>
                <span className="absolute left-4 -bottom-0.5 h-0.5 w-0 bg-gradient-to-r from-neon-orange to-neon-green transition-all duration-300 group-hover:w-2/3" />
              </button>
            )}
            {!isHome && role !== 'shopowner' && (
              <button
                onClick={openCartDrawer}
                className={`relative flex items-center space-x-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg backdrop-blur-sm ${cartItemsCount > 0 ? 'animate-pulse' : ''}`}
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
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl border border-white/15 text-slate-200/90 hover:text-white bg-white/5 hover:bg-white/10 transition-all duration-300"
                  title="Sign in to your account"
                >
                  <span className="bg-gradient-to-r from-neon-orange to-neon-green bg-clip-text text-transparent">Login</span>
                </button>
                <motion.button
                  onClick={() => navigate('/signup', { state: { selectedRole: 'shopowner' } })}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-5 py-2 rounded-full bg-gradient-to-r from-neon-orange to-neon-green text-white font-semibold shadow-lg shadow-emerald-500/10"
                  title="Join your neighborhood network"
                >
                  <span>Get Started</span>
                  <span className="pointer-events-none absolute -inset-0.5 rounded-full shadow-[0_0_30px_0] shadow-emerald-400/0 animate-[pulse_3.5s_ease-in-out_infinite]" />
                </motion.button>
              </>
            ) : (
              <>
                {/* Hide login/get started on non-home pages if already authenticated; keep account/cart etc. */}
              </>
            )}
            {!isHome && (
              <button
                onClick={() => setAccountOpen(true)}
                className="ml-1 hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
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