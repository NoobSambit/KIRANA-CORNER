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
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close account panel"
      />
      {/* Drawer */}
      <aside
        className={`relative w-full sm:w-[380px] h-screen shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundColor: '#FFFFFF',
          background: '#FFFFFF',
          opacity: 1,
          height: '100vh'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Account panel"
      >
        <div className="absolute inset-0 bg-white -z-10" style={{ backgroundColor: '#FFFFFF' }} />
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 z-10 transition-colors" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5 text-slate-700" />
        </button>
        <div className="p-6 border-b border-slate-200 bg-white" style={{ backgroundColor: '#FFFFFF' }}>
          <h2 className="text-xl font-bold text-slate-900">{isShopOwner ? 'Shop Owner' : 'Customer'}</h2>
          <p className="text-slate-600 text-sm mt-1">{isShopOwner ? 'Manage your store and settings' : 'Manage your account and orders'}</p>
        </div>

        <div className="p-4 space-y-3 bg-white flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: '#FFFFFF' }}>
          {isShopOwner ? (
            <>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-900 font-semibold text-lg">{shop?.name || 'Your Shop'}</div>
                    <div className="text-xs text-slate-600 mt-1">Status: <span className={`font-semibold ${shop?.status==='open' ? 'text-emerald-600' : 'text-red-600'}`}>{shop?.status || '—'}</span></div>
                  </div>
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
              </div>

              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group">
                <Package className="h-5 w-5 text-orange-500 group-hover:text-orange-600" />
                <span className="font-medium text-slate-800 group-hover:text-orange-700">Orders & Inventory</span>
              </button>
              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all group">
                <Settings className="h-5 w-5 text-slate-600 group-hover:text-slate-700" />
                <span className="font-medium text-slate-800 group-hover:text-slate-900">Store Settings</span>
              </button>
              <button onClick={() => go('/dashboard')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                <Calendar className="h-5 w-5 text-indigo-600 group-hover:text-indigo-700" />
                <span className="font-medium text-slate-800 group-hover:text-indigo-700">Analytics (soon)</span>
              </button>
              <button onClick={() => go('/account')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all group">
                <span className="font-medium text-slate-800 group-hover:text-slate-900">Customer Account</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go('/orders')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all group">
                <Package className="h-5 w-5 text-orange-500 group-hover:text-orange-600" />
                <span className="font-medium text-slate-800 group-hover:text-orange-700">My Orders</span>
              </button>
              <button onClick={() => go('/account')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all group">
                <Settings className="h-5 w-5 text-slate-600 group-hover:text-slate-700" />
                <span className="font-medium text-slate-800 group-hover:text-slate-900">Account Settings</span>
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
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-300 bg-white hover:bg-red-50 hover:border-red-400 transition-all group"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-5 w-5 text-red-600 group-hover:text-red-700" />
            <span className="font-medium text-red-600 group-hover:text-red-700">Log out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AccountDrawer;


