import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import { useCart } from './CartContext';

const Layout: React.FC = () => {
  const { cartDrawerOpen, closeCartDrawer } = useCart();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <Navbar />
      <CartDrawer isOpen={cartDrawerOpen} onClose={closeCartDrawer} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;