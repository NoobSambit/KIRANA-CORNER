import React, { useState } from 'react';
import { useCart } from './CartContext';
import { Minus, Plus, X, Clock } from 'lucide-react';
import AddressSelector from './AddressSelector';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: JS module
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { decrementTopLevelProductStock } from '../utils/productService';

const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = subtotal > 0 ? 30 : 0;
  const handlingCharge = subtotal > 0 ? 4 : 0;
  const total = subtotal + deliveryCharge + handlingCharge;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const savings = cart.reduce((sum, item) => sum + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0), 0);

  // Address selection state
  const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleAddressSelect = (address: any) => {
    setSelectedAddress(address);
    setAddressSelectorOpen(false);
  };

  const placeOrderMockRazorpay = async () => {
    if (cart.length === 0) return;
    // For now, we simulate successful payment and create Firestore order
    let userId: string | null = null;
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        userId = u?.uid || null;
        unsub();
        resolve();
      });
    });
    const items = cart.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      shopId: i.shopId || i.shop,
    }));
    const firstShopId = cart[0]?.shopId || cart[0]?.shop; // alignment fallback
    const orderPayload = {
      customerId: userId || 'guest',
      customerName: 'Customer',
      shopId: firstShopId,
      shopName: cart[0]?.shopName || cart[0]?.shop || 'Shop',
      items,
      totalAmount: total,
      address: selectedAddress || null,
      payment: {
        provider: 'razorpay',
        status: 'captured',
        mode: 'TEST',
      },
      orderStatus: 'Pending',
      orderTime: new Date().toISOString(),
    };
    try {
      await addDoc(collection(db, 'orders'), orderPayload);
      // Update stock per item
      for (const item of cart) {
        try {
          await decrementTopLevelProductStock(item.id, item.quantity);
        } catch (e) {
          // continue
        }
      }
      // Clear cart and close
      clearCart();
      alert('Payment successful! Order placed.');
    } catch (e) {
      console.error('Failed to create order', e);
      alert('Failed to place order');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close cart drawer"
      />
      {/* Drawer */}
      <div
        className={`relative w-full sm:w-[400px] max-w-full h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-all z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-6 w-6 text-slate-500" />
        </button>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xl font-bold">My Cart</h2>
            {savings > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mt-3 flex justify-between items-center">
                <span className="text-blue-700 font-medium">Your total savings</span>
                <span className="text-blue-700 font-bold">₹{savings}</span>
              </div>
            )}
          </div>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-32 w-32 bg-slate-100 rounded-full mb-4 flex items-center justify-center">
                <span className="text-4xl text-slate-400">🛒</span>
              </div>
              <div className="text-slate-500 text-lg">Your cart is empty</div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Delivery in 8 minutes</span>
                </div>
                <div className="text-sm text-gray-500">Shipment of {totalItems} items</div>
              </div>
              <div className="p-4 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm mb-1">{item.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{item.unit || '1 unit'}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-600 rounded-lg px-2 py-1">
                      <button 
                        className="text-white hover:bg-green-700 rounded p-1 transition-all"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        title="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-bold text-lg min-w-[24px] text-center">{item.quantity}</span>
                      <button 
                        className="text-white hover:bg-green-700 rounded p-1 transition-all"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        title="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100">
                <h3 className="font-bold text-lg mb-3">Bill details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span>📋</span>
                      <span>Items total</span>
                      {savings > 0 && <span className="text-blue-600 text-xs">Saved ₹{savings}</span>}
                    </span>
                    <div className="text-right">
                      <span className="text-gray-400 line-through mr-2">₹{subtotal + savings}</span>
                      <span className="font-bold">₹{subtotal}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span>🚚</span>
                      <span>Delivery charge</span>
                      <span className="text-gray-400">ⓘ</span>
                    </span>
                    <span>₹{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <span>🔒</span>
                      <span>Handling charge</span>
                      <span className="text-gray-400">ⓘ</span>
                    </span>
                    <span>₹{handlingCharge}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Grand total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>
                {savings > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-blue-700 font-medium">Your total savings</span>
                      <span className="text-blue-700 font-bold">₹{savings}</span>
                    </div>
                    <div className="text-blue-600 text-xs">Shop for ₹88 more to save ₹30 on delivery charge</div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <div className="font-medium">
                      {selectedAddress ? selectedAddress.label : 'Delivering to Home'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedAddress ? selectedAddress.address : 'Select address for delivery'}
                    </div>
                  </div>
                  <button className="text-green-600 font-medium text-sm" onClick={() => setAddressSelectorOpen(true)}>Change</button>
                </div>
                <button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-between px-6 shadow-lg transition-all"
                  onClick={placeOrderMockRazorpay}
                >
                  <div className="text-left">
                    <div className="text-lg">₹{total}</div>
                    <div className="text-sm opacity-90">TOTAL</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Pay (Test)</span>
                    <span>→</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
        <AddressSelector
          isOpen={addressSelectorOpen}
          onClose={() => setAddressSelectorOpen(false)}
          onSelect={handleAddressSelect}
          selectedAddressId={selectedAddress?.id}
        />
      </div>
    </div>
  );
};

export default CartDrawer; 