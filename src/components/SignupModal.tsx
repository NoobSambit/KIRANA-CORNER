import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, ShoppingBag, Store, User } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
// @ts-expect-error: Importing from JS module without type declaration
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';

export interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetAndClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!role) {
      setError('Please select a role');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
      });
      // Successful signup - go to dashboard
      resetAndClose();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
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
              className="w-full max-w-lg md:max-w-xl bg-slate-900/90 text-slate-100 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl max-h-[90vh] overflow-y-auto mx-2"
            >
              <div className="p-6 sm:p-8 relative">
                <button
                  onClick={resetAndClose}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>

                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-neon-orange to-neon-green p-3 rounded-2xl w-16 h-16 mx-auto mb-4">
                    <ShoppingBag className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold">Create Account</h2>
                  <p className="text-slate-400 mt-2">Join our platform today</p>
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 focus:ring-2 focus:ring-neon-green focus:border-transparent text-slate-100 placeholder-slate-400"
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
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/80 border border-white/10 focus:ring-2 focus:ring-neon-green focus:border-transparent text-slate-100 placeholder-slate-400"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800/80 border border-white/10 focus:ring-2 focus:ring-neon-green focus:border-transparent text-slate-100 placeholder-slate-400"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Select Your Role
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole('customer')}
                        className={`group p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                          role === 'customer'
                            ? 'border-blue-400 bg-blue-950/40 shadow-lg scale-105'
                            : 'border-white/10 hover:border-blue-400 bg-white/5 hover:bg-blue-900/20 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-xl mx-auto mb-3 w-fit transition-all duration-300 ${
                            role === 'customer'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-blue-900/40 group-hover:bg-blue-800/60'
                          }`}
                        >
                          <User className={`h-8 w-8 ${role === 'customer' ? 'text-white' : 'text-blue-300'}`} />
                        </div>
                        <div className="text-lg font-semibold text-white mb-1">Customer</div>
                        <div className="text-sm text-slate-300 mb-2">Shop & Browse Products</div>
                        <div className="text-xs text-slate-400">
                          • Browse local stores
                          <br />• Order with delivery
                          <br />• Track your orders
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('shopowner')}
                        className={`group p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                          role === 'shopowner'
                            ? 'border-emerald-400 bg-emerald-950/40 shadow-lg scale-105'
                            : 'border-white/10 hover:border-emerald-400 bg-white/5 hover:bg-emerald-900/20 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-xl mx-auto mb-3 w-fit transition-all duration-300 ${
                            role === 'shopowner'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-emerald-900/40 group-hover:bg-emerald-800/60'
                          }`}
                        >
                          <Store className={`h-8 w-8 ${role === 'shopowner' ? 'text-white' : 'text-emerald-300'}`} />
                        </div>
                        <div className="text-lg font-semibold text-white mb-1">Shop Owner</div>
                        <div className="text-sm text-slate-300 mb-2">Manage Your Store</div>
                        <div className="text-xs text-slate-400">
                          • List your products
                          <br />• Receive online orders
                          <br />• Grow your business
                        </div>
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
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-neon-orange to-neon-green text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SignupModal;


