import React from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId } from '../utils/shopService';
import ShopProfileEditor from '../components/ShopProfileEditor';

const ShopCreatePlaceholder: React.FC = () => {
  const [checking, setChecking] = React.useState(true);
  const [hasShop, setHasShop] = React.useState<boolean>(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }
      const res: { success?: boolean } = await getShopByOwnerId(user.uid);
      setHasShop(!!(res && res.success));
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasShop) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create your shop</h1>
          <p className="text-slate-300 mt-2">Fill in your shop details to get started.</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/10">
          <ShopProfileEditor startInEditMode />
        </div>
      </div>
    </div>
  );
};

export default ShopCreatePlaceholder;