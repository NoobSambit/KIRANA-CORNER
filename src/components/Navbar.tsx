import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, Search, User, Store, Home,
  Package, MapPin, ChevronDown, X, Sun, Moon,
} from 'lucide-react';
import { useCart } from './CartContext';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// @ts-expect-error: JS module
import { auth } from '../firebase';
// @ts-expect-error: JS module
import { getUserData } from '../utils/orderUtils';
import AccountDrawer from './AccountDrawer';
import { useSearch } from './SearchContext';
import { useTheme } from './ThemeContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, openCartDrawer } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = React.useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const { searchQuery, setSearchQuery } = useSearch();

  React.useEffect(() => {
    if (!auth) { setRole(null); setIsLoggedIn(false); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setRole(null); setIsLoggedIn(false); return; }
      setIsLoggedIn(true);
      try {
        const res = await getUserData(user.uid);
        if (res.success) setRole(res.data.role || null);
        else setRole(null);
      } catch { setRole(null); }
    });
    return () => unsub();
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isOrders = location.pathname === '/orders';
  const isCustomer = role === 'customer';
  const isShopOwner = role === 'shopowner';
  const showBottomNav = isLoggedIn && isCustomer;

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 w-full z-[100] h-16 ${isHome ? '' : 'nav-glass'}`}
        style={isHome ? { background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 h-full flex items-center justify-between gap-3">

          {/* Logo */}
          <button
            onClick={() => navigate(isLoggedIn && isCustomer ? '/dashboard' : '/')}
            className="flex items-center gap-2 flex-shrink-0 tap-transparent"
            aria-label="KiranaConnect Home"
          >
            <img
              src="/app%20logo.png"
              alt="KiranaConnect"
              className="h-7 w-7 object-contain"
              onError={(e) => { e.currentTarget.onerror = null; }}
            />
            <span className="text-[18px] font-extrabold tracking-tight whitespace-nowrap"
              style={{ color: isHome ? '#fff' : 'var(--text-primary)' }}>
              Kirana<span style={{ color: 'var(--brand)' }}>Connect</span>
            </span>
          </button>

          {/* Desktop search */}
          {isCustomer && !isHome && (
            <div className="hidden md:flex flex-1 max-w-lg items-center relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, shops…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.borderColor = 'var(--brand)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }} aria-label="Clear">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Location chip — desktop customer only */}
          {isCustomer && !isHome && (
            <button className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all flex-shrink-0 tap-transparent"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>
              <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} />
              <span>Nearby</span>
              <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Dark mode toggle — only on non-home pages */}
            {!isHome && (
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all tap-transparent"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark'
                  ? <Sun className="h-4 w-4 text-amber-400" />
                  : <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                }
              </button>
            )}

            {/* Mobile search toggle */}
            {isCustomer && !isHome && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all tap-transparent"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                aria-label="Toggle search"
              >
                {mobileSearchOpen
                  ? <X className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  : <Search className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                }
              </button>
            )}

            {/* Cart */}
            {isCustomer && !isHome && (
              <button
                onClick={openCartDrawer}
                className="relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all tap-transparent"
                style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}
                aria-label={`Open cart (${cartCount} items)`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm animate-bounce-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Shop owner dashboard */}
            {isShopOwner && (
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-[13px] transition-all"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">My Store</span>
              </button>
            )}

            {/* Account */}
            {isLoggedIn ? (
              <button
                onClick={() => setAccountOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all tap-transparent"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                aria-label="Account"
              >
                <User className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all"
                style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile search dropdown */}
        {mobileSearchOpen && isCustomer && (
          <div className="md:hidden px-4 pb-3 pt-2" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'var(--text-muted)' }} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, shops…"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-[14px] font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile Bottom Nav (customer only) ──────────────────── */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[90] pb-safe md:hidden nav-glass border-t"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Mobile navigation">
          <div className="grid grid-cols-4 h-14">
            <BottomNavItem icon={<Home className="h-5 w-5" />}    label="Home"    active={isDashboard} onClick={() => navigate('/dashboard')} id="bnav-home" />
            <BottomNavItem icon={<Search className="h-5 w-5" />}  label="Search"  active={false}       onClick={() => { navigate('/dashboard'); setMobileSearchOpen(true); }} id="bnav-search" />
            <BottomNavItem icon={<Package className="h-5 w-5" />} label="Orders"  active={isOrders}    onClick={() => navigate('/orders')} id="bnav-orders" />
            <BottomNavItem icon={<User className="h-5 w-5" />}    label="Account" active={accountOpen}  onClick={() => setAccountOpen(true)} id="bnav-account" />
          </div>
        </nav>
      )}

      <AccountDrawer
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        role={role as 'customer' | 'shopowner' | null}
      />
    </>
  );
};

const BottomNavItem: React.FC<{
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; id: string;
}> = ({ icon, label, active, onClick, id }) => (
  <button
    id={id}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-0.5 tap-transparent transition-colors"
    style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }}
    aria-label={label}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default Navbar;