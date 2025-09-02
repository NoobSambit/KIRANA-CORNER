import React, { useState } from 'react';
import { useCart } from './CartContext';
import { Minus, Plus, X, Clock, MapPin, Truck, Shield, FileText, Info } from 'lucide-react';
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
  const [selectedAddress, setSelectedAddress] = useState<{ id: string; label: string; address: string } | null>(null);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleAddressSelect = (address: { id: string; label: string; address: string }) => {
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
        } catch {
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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close cart drawer"
      />
      {/* Dynamic Responsive Drawer */}
      <div
        className={`relative w-[280px] sm:w-[400px] md:w-[450px] lg:w-[500px] max-w-full h-full bg-[#0B0F17] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-l border-[#2A2F38]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Dynamic Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-[#2A2F38] bg-[#0B0F17]">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#F5F5F5]">My Cart</h2>
          <button
            className="p-1.5 sm:p-2 md:p-3 rounded-full hover:bg-[#161B22] transition-all text-[#CCCCCC] hover:text-[#F5F5F5]"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dynamic Savings Banner */}
          {savings > 0 && (
            <div className="mx-2 sm:mx-4 md:mx-6 mt-2 sm:mt-3 md:mt-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-green-500/30">
              <div className="flex justify-between items-center text-xs sm:text-sm md:text-base">
                <span className="text-green-400 font-medium">Total savings</span>
                <span className="text-green-400 font-bold">₹{savings}</span>
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16">
              <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-gradient-to-br from-[#161B22] to-[#2A2F38] rounded-full mb-3 sm:mb-4 md:mb-6 flex items-center justify-center border border-[#2A2F38] shadow-lg">
                <span className="text-2xl sm:text-3xl md:text-4xl">🛒</span>
              </div>
              <div className="text-[#CCCCCC] text-sm sm:text-base md:text-lg font-medium">Your cart is empty</div>
              <div className="text-[#999999] text-xs sm:text-sm mt-1">Add some products to get started</div>
            </div>
          ) : (
            <>
              {/* Dynamic Delivery Info */}
              <div className="mx-2 sm:mx-4 md:mx-6 mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-[#0F1419] rounded-lg sm:rounded-xl md:rounded-2xl border border-[#2A2F38]">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm md:text-base font-medium text-[#F5F5F5]">Delivery in 8 minutes</div>
                    <div className="text-xs sm:text-sm md:text-base text-[#CCCCCC]">Shipment of {totalItems} items</div>
                  </div>
                </div>
              </div>
              
              {/* Dynamic Cart Items */}
              <div className="mx-2 sm:mx-4 md:mx-6 mt-2 sm:mt-3 md:mt-4 space-y-1.5 sm:space-y-2 md:space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-[#161B22] rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 border border-[#2A2F38] shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                      <img src={item.image} alt={item.name} className="h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-md sm:rounded-lg md:rounded-xl object-cover border border-[#2A2F38]" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#F5F5F5] text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-2 leading-tight">{item.name}</div>
                        <div className="text-xs sm:text-sm md:text-base text-[#CCCCCC] mb-1 sm:mb-2">{item.unit || '1 unit'}</div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-green-400 to-orange-500 bg-clip-text text-transparent">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-xs sm:text-sm text-[#999999] line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-green-500 to-green-600 rounded-md sm:rounded-lg px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-2 shadow-lg">
                        <button 
                          className="text-white hover:bg-green-700/50 rounded p-0.5 sm:p-1 transition-all duration-200"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          title="Decrease quantity"
                        >
                          <Minus className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        </button>
                        <span className="text-white font-bold text-xs sm:text-sm md:text-base min-w-[16px] sm:min-w-[20px] md:min-w-[24px] text-center">{item.quantity}</span>
                        <button 
                          className="text-white hover:bg-green-700/50 rounded p-0.5 sm:p-1 transition-all duration-200"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          title="Increase quantity"
                        >
                          <Plus className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dynamic Bill Details */}
              <div className="mx-2 sm:mx-4 md:mx-6 mt-3 sm:mt-4 md:mt-6 p-3 sm:p-4 md:p-6 bg-[#0F1419] rounded-lg sm:rounded-xl md:rounded-2xl border border-[#2A2F38]">
                <h3 className="font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4 text-[#F5F5F5]">Bill details</h3>
                <div className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[#CCCCCC]">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                      </div>
                      <span>Items total</span>
                      {savings > 0 && <span className="text-green-400 text-xs sm:text-sm bg-green-500/20 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full">Saved ₹{savings}</span>}
                    </span>
                    <div className="text-right">
                      {savings > 0 && <span className="text-[#999999] line-through mr-1 sm:mr-2 text-xs sm:text-sm">₹{subtotal + savings}</span>}
                      <span className="font-bold text-[#F5F5F5] text-sm sm:text-base md:text-lg">₹{subtotal}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[#CCCCCC]">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <Truck className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                      </div>
                      <span>Delivery charge</span>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-[#2A2F38] rounded-full flex items-center justify-center">
                        <Info className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-[#999999]" />
                      </div>
                    </span>
                    <span className="text-[#F5F5F5] font-medium text-sm sm:text-base md:text-lg">₹{deliveryCharge}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-[#CCCCCC]">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                      </div>
                      <span>Handling charge</span>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-[#2A2F38] rounded-full flex items-center justify-center">
                        <Info className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 text-[#999999]" />
                      </div>
                    </span>
                    <span className="text-[#F5F5F5] font-medium text-sm sm:text-base md:text-lg">₹{handlingCharge}</span>
                  </div>
                  
                  <div className="border-t border-[#2A2F38] pt-1.5 sm:pt-2 md:pt-3 mt-1.5 sm:mt-2 md:mt-3">
                    <div className="flex justify-between items-center font-bold text-sm sm:text-base md:text-xl">
                      <span className="text-[#F5F5F5]">Grand total</span>
                      <span className="bg-gradient-to-r from-green-400 to-orange-500 bg-clip-text text-transparent">₹{total}</span>
                    </div>
                  </div>
                </div>
                
                {savings > 0 && (
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 mt-3 sm:mt-4 md:mt-6 border border-green-500/30">
                    <div className="text-green-300 text-xs sm:text-sm md:text-base text-center">Shop for ₹88 more to save ₹30 on delivery</div>
                  </div>
                )}
              </div>
              
              {/* Dynamic Address Section */}
              <div className="mx-2 sm:mx-4 md:mx-6 mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-[#161B22] rounded-lg sm:rounded-xl md:rounded-2xl border border-[#2A2F38] flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#F5F5F5] text-xs sm:text-sm md:text-base">
                    {selectedAddress ? selectedAddress.label : 'Delivering to Home'}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-[#CCCCCC]">
                    {selectedAddress ? selectedAddress.address : 'Select address for delivery'}
                  </div>
                </div>
                <button 
                  className="text-green-400 font-medium text-xs sm:text-sm md:text-base hover:text-green-300 transition-colors duration-200 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-2 rounded hover:bg-green-500/20" 
                  onClick={() => setAddressSelectorOpen(true)}
                >
                  Change
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Dynamic Bottom Bar */}
        {cart.length > 0 && (
          <div className="border-t border-[#2A2F38] bg-[#0B0F17] p-3 sm:p-4 md:p-6">
            <button
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 sm:py-4 md:py-5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.01]"
              onClick={placeOrderMockRazorpay}
            >
              <div className="text-left">
                <div className="text-lg sm:text-xl md:text-2xl font-bold">₹{total}</div>
                <div className="text-xs sm:text-sm opacity-90">TOTAL</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base md:text-lg">Pay (Test)</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm md:text-base">→</span>
                </div>
              </div>
            </button>
          </div>
        )}
        
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