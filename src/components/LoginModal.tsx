import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
// @ts-expect-error
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
// @ts-expect-error
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

  if (currentUser && !authLoading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with extreme blur and dark overlay */}
          <div
            className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
            onClick={resetAndClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl"
          >
            {/* Ambient Background Glow inside modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-orange-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 p-8 sm:p-10">
              <button
                onClick={resetAndClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors group"
              >
                <X className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-5">
                  <img 
                    src="/app%20logo.png" 
                    alt="Logo"
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.svg';
                    }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-white font-display tracking-tight mb-1">
                  Welcome Back
                </h2>
                <p className="text-slate-400 text-sm font-medium">Sign in to continue to KiranaConnect</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500/50 focus:bg-white/10 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm text-white placeholder-slate-500 outline-none"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pb-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-orange-500/50 focus:bg-white/10 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm text-white placeholder-slate-500 outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-red-400 text-xs font-medium leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || authLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-white/10 pt-6">
                <p className="text-slate-400 text-sm font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      resetAndClose();
                      navigate('/signup');
                    }}
                    className="text-white hover:text-orange-500 font-bold transition-colors underline decoration-white/30 underline-offset-4"
                  >
                    Sign up now
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
