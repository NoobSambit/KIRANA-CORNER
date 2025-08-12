import React from 'react';
import { X, Store, Package, Settings, Calendar, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: JS module without types
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
// @ts-expect-error: JS module without types
import { getShopByOwnerId } from '../utils/shopService';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'shopowner' | null;
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({ isOpen, onClose, role }) => {
  const navigate = useNavigate();
  interface ShopInfo { name?: string; status?: string }
  const [shop, setShop] = React.useState<ShopInfo | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setShop(null); return; }
      const res = await getShopByOwnerId(user.uid);
      setShop(res.success ? (res.data as ShopInfo) : null);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const isShopOwner = role === 'shopowner';

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300`}>
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close account panel"
      />
      <aside
        className={`relative w-full sm:w-[380px] h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-100 dark:border-white/10 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Account panel"
      >
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>
        <div className="p-6 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isShopOwner ? 'Shop Owner' : 'Customer'}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{isShopOwner ? 'Manage your store and settings' : 'Manage your account and orders'}</p>
        </div>

        <div className="p-4 space-y-3">
          {isShopOwner ? (
            <>
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-900 dark:text-white font-semibold">{shop?.name || 'Your Shop'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Status: <span className={`${shop?.status==='open' ? 'text-emerald-600' : 'text-red-600'}`}>{shop?.status || '—'}</span></div>
                  </div>
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <Package className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Orders & Inventory</span>
              </button>
              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <Settings className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Store Settings</span>
              </button>
              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Analytics (soon)</span>
              </button>
              <button onClick={() => go('/account')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <span className="font-medium text-slate-800 dark:text-slate-200">Customer Account</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/orders')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <Package className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-slate-800 dark:text-slate-200">My Orders</span>
              </button>
              <button onClick={() => go('/account')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10">
                <Settings className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="font-medium text-slate-800 dark:text-slate-200">Account Settings</span>
              </button>
            </>
          )}
          <button
            onClick={async () => {
              try {
                await signOut(auth);
              } catch {
                // ignore signOut error and continue navigation
              }
              onClose();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5 text-red-600" />
            <span className="font-medium text-slate-800 dark:text-slate-200">Log out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AccountDrawer;


