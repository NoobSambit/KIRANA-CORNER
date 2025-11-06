import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// @ts-expect-error: Importing from JS module without type declaration
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId } from '../utils/shopService';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setError('Firebase is not configured. Please set up your environment variables.');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // User is already logged in, close modal and redirect
        handleRedirect(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRedirect = async (user: any) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.exists() ? (userDoc.data() as any).role : null;
      
      if (role === 'shopowner') {
        const res: any = await getShopByOwnerId(user.uid);
        if (res && res.success) {
          resetAndClose();
          navigate('/dashboard');
        } else {
          resetAndClose();
          navigate('/shop/new');
        }
      } else {
        resetAndClose();
        navigate('/dashboard');
      }
    } catch (error) {
      resetAndClose();
      navigate('/dashboard');
    }
  };

  const resetAndClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Firebase is not configured. Please contact the administrator.');
      setLoading(false);
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;
      await handleRedirect(user);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Don't show modal if user is already logged in
  if (currentUser && !authLoading) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={resetAndClose}
          />

          {/* Panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md bg-slate-900/90 text-slate-100 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto mx-2"
            >
              <div className="p-6 sm:p-8 relative">
                <button
                  onClick={resetAndClose}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>

                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-neon-orange to-neon-green p-3 rounded-2xl w-16 h-16 mx-auto mb-4">
                    <ShoppingBag className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-neon-orange to-neon-green bg-clip-text text-transparent">
                    Welcome Back
                  </h2>
                  <p className="text-slate-400 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 focus:ring-2 focus:ring-neon-green focus:border-transparent text-slate-100 placeholder-slate-400 transition-all"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/80 border border-white/10 focus:ring-2 focus:ring-neon-green focus:border-transparent text-slate-100 placeholder-slate-400 transition-all"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-950/60 border border-red-400/40 rounded-xl p-3 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="w-full bg-gradient-to-r from-neon-orange to-neon-green text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetAndClose();
                        // Trigger signup modal - this will be handled by parent
                        navigate('/signup');
                      }}
                      className="text-neon-green hover:text-neon-orange font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;

