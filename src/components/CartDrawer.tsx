import React, { useState } from 'react';
import { useCart } from './CartContext';
import {
  Minus, Plus, X, Clock, MapPin, Truck, Shield, FileText,
  ShoppingBag, ChevronRight, ArrowRight,
} from 'lucide-react';
import AddressSelector from './AddressSelector';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: JS module
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { decrementTopLevelProductStock } from '../utils/productService';

const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();

  const subtotal       = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const savings        = cart.reduce((s, i) => s + ((i.originalPrice ?? 0) > i.price ? (i.originalPrice! - i.price) * i.quantity : 0), 0);
  const deliveryCharge = subtotal > 0 ? 30 : 0;
  const handlingCharge = subtotal > 0 ? 4  : 0;
  const total          = subtotal + deliveryCharge + handlingCharge;
  const totalItems     = cart.reduce((s, i) => s + i.quantity, 0);

  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{ id: string; label: string; address: string } | null>(null);
  const [placing, setPlacing] = useState(false);

  const handleQtyChange = (id: string, qty: number) => {
    if (qty <= 0) removeFromCart(id);
    else updateQuantity(id, qty);
  };

  const placeOrderMockRazorpay = async () => {
    if (!cart.length) return;
    setPlacing(true);
    let userId: string | null = null;
    await new Promise<void>((res) => {
      const u = onAuthStateChanged(auth, (usr) => { userId = usr?.uid ?? null; u(); res(); });
    });
    const items = cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, shopId: i.shopId || i.shop }));
    try {
      await addDoc(collection(db, 'orders'), {
        customerId: userId || 'guest', customerName: 'Customer',
        shopId: cart[0]?.shopId || cart[0]?.shop, shopName: cart[0]?.shopName || cart[0]?.shop || 'Shop',
        items, totalAmount: total, address: selectedAddress || null,
        payment: { provider: 'razorpay', status: 'captured', mode: 'TEST' },
        orderStatus: 'Pending', orderTime: new Date().toISOString(),
      });
      for (const i of cart) {
        try { await decrementTopLevelProductStock(i.id, i.quantity); } catch { /* continue */ }
      }
      clearCart();
      alert('Payment successful! Order placed.');
    } catch (e) {
      console.error('Order failed', e);
      alert('Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[150] flex justify-end transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`relative w-full sm:w-[420px] max-w-full h-full flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-base)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>My Cart</h2>
            {totalItems > 0 && <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'var(--pastel-peach)' }}>
                <ShoppingBag className="h-10 w-10" style={{ color: 'var(--brand)' }} />
              </div>
              <h3 className="text-lg font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h3>
              <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-muted)' }}>Add products to get started</p>
              <button onClick={onClose} className="btn-primary">Continue Shopping</button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {/* Savings banner */}
              {savings > 0 && (
                <div className="px-4 py-2.5 flex items-center justify-between rounded-xl"
                  style={{ background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span className="font-bold text-[13px]" style={{ color: 'var(--success)' }}>You save on this order</span>
                  <span className="font-extrabold text-[14px]" style={{ color: 'var(--success)' }}>₹{savings}</span>
                </div>
              )}

              {/* Delivery promise */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--success-bg)' }}>
                  <Clock className="h-4 w-4" style={{ color: 'var(--success)' }} />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold" style={{ color: 'var(--text-primary)' }}>Delivery in 15–30 min</p>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{totalItems} item{totalItems !== 1 ? 's' : ''} from nearby store</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 px-3 py-3 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="h-16 w-16 rounded-lg flex items-center justify-center p-1 flex-shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.unit || '1 unit'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[14px] font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{item.price}</span>
                        {Number(item.originalPrice) > item.price && (
                          <span className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>
                            ₹{Number(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end self-end">
                      <div className="flex items-center rounded-lg overflow-hidden shadow-sm" style={{ background: 'var(--brand)' }}>
                        <button onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:opacity-80 transition-opacity" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-white font-extrabold text-[13px]">{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-white hover:opacity-80 transition-opacity" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill */}
              <div className="px-4 py-4 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-extrabold text-[14px] mb-3" style={{ color: 'var(--text-primary)' }}>Bill Details</h3>
                <div className="space-y-2.5">
                  <BillRow icon={<FileText className="h-3 w-3" />} label="Items total" value={`₹${subtotal}`}
                    badge={savings > 0 ? `Saved ₹${savings}` : undefined} strikethrough={savings > 0 ? `₹${subtotal + savings}` : undefined} />
                  <BillRow icon={<Truck className="h-3 w-3" />} label="Delivery charge" value={`₹${deliveryCharge}`} />
                  <BillRow icon={<Shield className="h-3 w-3" />} label="Handling charge" value={`₹${handlingCharge}`} />
                  <div className="flex justify-between items-center pt-2.5 mt-2.5"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="font-extrabold text-[15px]" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                    <span className="font-extrabold text-[17px]" style={{ color: 'var(--text-primary)' }}>₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--pastel-peach)' }}>
                  <MapPin className="h-4 w-4" style={{ color: 'var(--brand)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {selectedAddress ? selectedAddress.label : 'Delivering to Home'}
                  </p>
                  <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-muted)' }}>
                    {selectedAddress ? selectedAddress.address : 'Tap to select delivery address'}
                  </p>
                </div>
                <button onClick={() => setAddressSelectorOpen(true)}
                  className="flex items-center gap-0.5 font-bold text-[12px] flex-shrink-0 transition-colors"
                  style={{ color: 'var(--brand)' }}>
                  Change <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checkout CTA */}
        {cart.length > 0 && (
          <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <button
              onClick={placeOrderMockRazorpay}
              disabled={placing}
              className="w-full font-extrabold py-4 rounded-xl flex items-center justify-between px-5 text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}
            >
              <div className="text-left">
                <div className="text-[18px] font-extrabold leading-none">₹{total}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-90 font-semibold mt-0.5">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {placing ? <span className="text-[14px] font-bold">Placing…</span> : (
                  <><span className="text-[14px] font-bold">Place Order</span><ArrowRight className="h-4 w-4" /></>
                )}
              </div>
            </button>
          </div>
        )}

        <AddressSelector isOpen={addressSelectorOpen} onClose={() => setAddressSelectorOpen(false)}
          onSelect={(a) => { setSelectedAddress(a); setAddressSelectorOpen(false); }}
          selectedAddressId={selectedAddress?.id} />
      </div>
    </div>
  );
};

const BillRow: React.FC<{ icon: React.ReactNode; label: string; value: string; badge?: string; strikethrough?: string }> = ({ icon, label, value, badge, strikethrough }) => (
  <div className="flex items-center justify-between text-[13px]">
    <span className="flex items-center gap-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        {icon}
      </span>
      {label}
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          {badge}
        </span>
      )}
    </span>
    <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
      {strikethrough && <span className="line-through text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{strikethrough}</span>}
      {value}
    </span>
  </div>
);

export default CartDrawer;
