import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import CustomerDashboard from '../pages/CustomerDashboard';
import ShopOwnerDashboard from '../pages/ShopOwnerDashboard';
import { getShopByOwnerId } from '../utils/shopService';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'shopowner') {
    // If shop owner does not have a shop yet, force them to creation flow
    // We cannot run async here; instead, leverage a synchronous gate by using a derived flag
    // For simplicity, render a small wrapper that checks and redirects
    return <ShopOwnerGate />;
  } else if (userRole === 'customer') {
    return <CustomerDashboard />;
  }

  return <Navigate to="/login" replace />;
};

export default Dashboard;

// Small internal component to gate shop owners without a shop
const ShopOwnerGate: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [hasShop, setHasShop] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setHasShop(null);
        setChecking(false);
        return;
      }
      const res: any = await getShopByOwnerId(currentUser.uid);
      setHasShop(!!(res && res.success));
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasShop === false) {
    return <Navigate to="/shop/new" replace />;
  }

  return <ShopOwnerDashboard />;
};