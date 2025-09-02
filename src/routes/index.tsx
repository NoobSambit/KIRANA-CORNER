import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const Dashboard = lazy(() => import('../components/Dashboard'));
const MyOrders = lazy(() => import('../pages/MyOrders'));
const ShopDetails = lazy(() => import('../pages/ShopDetails'));
const ShopProducts = lazy(() => import('../pages/ShopProducts'));
const AccountPage = lazy(() => import('../pages/AccountPage'));
const NotFound = lazy(() => import('../pages/NotFound'));
const ShopCreatePlaceholder = lazy(() => import('../pages/ShopCreatePlaceholder'));

export interface AppRoutesProps {
  isAuthenticated: boolean;
}

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-slate-600 mt-4 text-center">Loading...</p>
    </div>
  </div>
);

const AppRoutes: React.FC<AppRoutesProps> = ({ isAuthenticated }) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Allow access to login/signup pages even if authenticated, for better UX */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/account" element={<AccountPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Shop creation is intended for authenticated shop owners, but we allow the page to self-guard */}
          <Route path="/shop/new" element={<ShopCreatePlaceholder />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route path="/shop/:shopId" element={<ShopDetails />} />
          <Route path="/shop/:shopId/products" element={<ShopProducts />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


