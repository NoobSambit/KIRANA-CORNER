import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
// @ts-expect-error
import { auth, db } from '../firebase';
// @ts-expect-error
import { getShopByOwnerId } from '../utils/shopService';
import { Mail, Lock, Eye, EyeOff, Store, User, ArrowRight, ArrowLeft, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Signup: React.FC = () => {
  const location = useLocation();
  const preSelectedRole = location.state?.selectedRole || '';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(preSelectedRole);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (!role) {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString()
      });

      if (role === 'shopowner') {
        const res: any = await getShopByOwnerId(user.uid);
        if (res && res.success) {
          navigate('/dashboard');
        } else {
          navigate('/shop/new');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Branding Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 z-0">
          <img 
            src="/mid_section.png" 
            alt="Background" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/scenery%20kirana.png'; 
            }}
          />
          {/* Very subtle gradient just to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/80" />
        </div>
        
        <div className="relative z-10 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <img 
              src="/app%20logo.png" 
              alt="Logo"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.svg';
              }}
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-display">
            Kirana<span className="text-orange-500">Connect</span>
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-white font-display leading-[1.1] mb-6"
          >
            Empowering <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Local Commerce.
            </span>
          </motion.h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">
            Join the hyper-local revolution. Connect directly with your neighborhood kirana stores, track live inventory, and get blazing fast deliveries.
          </p>
          
          <div className="space-y-5">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Order from stores right down your street." },
              { icon: ShieldCheck, title: "Secure Payments", desc: "100% safe and verified transactions." },
            ].map((feature, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                key={idx} 
                className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-fit"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{feature.title}</h4>
                  <p className="text-slate-400 text-xs">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Signup Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Back to Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-sm font-medium group backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="w-full max-w-[440px] relative z-10 pt-12 sm:pt-0">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <img 
                src="/app%20logo.png" 
                alt="Logo"
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.svg';
                }}
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-display">
              Kirana<span className="text-orange-500">Connect</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2 font-display">Create Account</h2>
            <p className="text-slate-400 text-sm font-medium">Enter your details to get started on the platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-300">I am joining as a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-300 ${
                    role === 'customer'
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(255,106,0,0.15)]'
                      : 'border-white/10 bg-[#111] hover:border-white/20 hover:bg-[#151515]'
                  }`}
                >
                  <User className={`w-6 h-6 mb-3 ${role === 'customer' ? 'text-orange-500' : 'text-slate-400'}`} />
                  <div className={`font-bold text-sm ${role === 'customer' ? 'text-white' : 'text-slate-300'}`}>Customer</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Shop and order</div>
                  {role === 'customer' && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#050505]" />
                    </div>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setRole('shopowner')}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-300 ${
                    role === 'shopowner'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'border-white/10 bg-[#111] hover:border-white/20 hover:bg-[#151515]'
                  }`}
                >
                  <Store className={`w-6 h-6 mb-3 ${role === 'shopowner' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div className={`font-bold text-sm ${role === 'shopowner' ? 'text-white' : 'text-slate-300'}`}>Shop Owner</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">Manage a store</div>
                  {role === 'shopowner' && (
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#050505]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#111] border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-[#151515] transition-all text-sm text-white placeholder-slate-600 font-medium outline-none"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[#111] border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-[#151515] transition-all text-sm text-white placeholder-slate-600 font-medium outline-none"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#111] border border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:bg-[#151515] transition-all text-sm text-white placeholder-slate-600 font-medium outline-none"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/?login=true" onClick={(e) => {
              e.preventDefault();
              navigate('/');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openLoginModal'));
              }, 100);
            }} className="text-white hover:text-orange-500 transition-colors font-bold underline decoration-white/30 underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;