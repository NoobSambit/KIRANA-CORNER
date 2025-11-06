import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
// @ts-expect-error: Importing from JS module without type declaration
import { db } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId } from '../utils/shopService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!currentUser || authLoading) return;

    const determineRedirect = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const role = userDoc.exists() ? (userDoc.data() as any).role : null;
        
        if (role === 'shopowner') {
          const res: any = await getShopByOwnerId(currentUser.uid);
          if (res && res.success) {
            navigate('/dashboard');
          } else {
            navigate('/shop/new');
          }
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        // Default to dashboard on error
        navigate('/dashboard');
      }
    };
    determineRedirect();
  }, [currentUser, authLoading, navigate]);

  // Redirect to home with login modal
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/?login=true', { replace: true });
    }
  }, [authLoading, currentUser, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-600 mt-4 text-center">Redirecting...</p>
      </div>
    </div>
  );
};

export default Login;