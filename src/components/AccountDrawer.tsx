import React from 'react';
import { createPortal } from 'react-dom';
import { X, Store, Package, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: JS module
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
// @ts-expect-error: JS module
import { getShopByOwnerId } from '../utils/shopService';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'shopowner' | null;
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({ isOpen, onClose, role }) => {
  const navigate = useNavigate();
  const [shop, setShop] = React.useState<{ name?: string; status?: string } | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setShop(null); setUserEmail(null); return; }
      setUserEmail(user.email || null);
      const res = await getShopByOwnerId(user.uid);
      setShop(res.success ? res.data : null);
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

  const go = (path: string) => { onClose(); navigate(path); };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={onClose} />
      <aside
        className="relative w-full sm:w-[340px] max-h-full flex flex-col shadow-2xl animate-slide-in-right"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}
        role="dialog" aria-modal="true" aria-label="Account panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
              {role === 'shopowner' ? 'Shop Owner' : 'My Account'}
            </h2>
            {userEmail && <p className="text-[12px] font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>}
          </div>
          <button className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {role === 'shopowner' ? (
            <>
              {shop && (
                <div className="rounded-xl p-4 mb-3"
                  style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-extrabold" style={{ color: 'var(--text-primary)' }}>{shop.name || 'Your Shop'}</p>
                      <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Status:{' '}
                        <span className="font-bold" style={{ color: shop.status === 'open' ? 'var(--success)' : 'var(--error)' }}>
                          {shop.status || '—'}
                        </span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Store className="h-5 w-5" style={{ color: 'var(--success)' }} />
                    </div>
                  </div>
                </div>
              )}
              <DrawerItem icon={<Package />} label="Orders & Inventory" onClick={() => go('/dashboard')} />
              <DrawerItem icon={<Settings />} label="Store Settings"    onClick={() => go('/dashboard')} />
              <DrawerItem icon={<Settings />} label="Account Settings"  onClick={() => go('/account')} />
            </>
          ) : (
            <>
              <DrawerItem icon={<Package />}  label="My Orders"        onClick={() => go('/orders')}  />
              <DrawerItem icon={<Settings />} label="Account Settings" onClick={() => go('/account')} />
            </>
          )}

          <button
            onClick={async () => {
              try { await signOut(auth); } catch { /* ignore */ }
              onClose(); navigate('/');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
            style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <LogOut className="h-4 w-4" style={{ color: 'var(--error)' }} />
            </span>
            <span className="font-bold text-[13px]" style={{ color: 'var(--error)' }}>Log out</span>
          </button>
        </div>
      </aside>
    </div>,
    document.body,
  );
};

const DrawerItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all group"
    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    onMouseEnter={(e) => { (e.currentTarget).style.borderColor = 'var(--border-brand)'; (e.currentTarget).style.background = 'var(--pastel-peach)'; }}
    onMouseLeave={(e) => { (e.currentTarget).style.borderColor = 'var(--border)'; (e.currentTarget).style.background = 'var(--bg-elevated)'; }}
  >
    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
      style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
      {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
    </span>
    <span className="font-bold text-[13px] flex-1 text-left" style={{ color: 'var(--text-primary)' }}>{label}</span>
    <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
  </button>
);

export default AccountDrawer;
