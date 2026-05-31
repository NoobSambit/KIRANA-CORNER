import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import { useCart } from './CartContext';

const Layout: React.FC = () => {
  const { cartDrawerOpen, closeCartDrawer } = useCart();
  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-orange-400/20 selection:text-orange-900"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Navbar />
      <CartDrawer isOpen={cartDrawerOpen} onClose={closeCartDrawer} />
      <main className="flex-1 overflow-x-hidden pt-16 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;