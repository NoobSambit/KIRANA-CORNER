import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import StatsCard from '../components/StatsCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, Store, Users, Truck, Shield, Star, MapPin, 
  ArrowRight, CheckCircle, Heart, Mail, Phone, Search,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Building2, TrendingDown, Frown, ShoppingCart, LineChart, User, Package, ClipboardList, Bell
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId } from '../utils/shopService';
import SignupModal from '../components/SignupModal';
import LoginModal from '../components/LoginModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasShop, setHasShop] = React.useState<boolean>(false);
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);
  const [signupOpen, setSignupOpen] = React.useState<boolean>(false);
  const [loginOpen, setLoginOpen] = React.useState<boolean>(false);
  
  // Parallax scroll effects
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -80]);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsAuthed(!!user);
      if (user) {
        const res = await getShopByOwnerId(user.uid);
        setHasShop(!!res.success);
      } else {
        setHasShop(false);
      }
    });
    return () => unsub();
  }, []);

  // Check URL params for login modal
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('login') === 'true') {
      setLoginOpen(true);
      // Clean up URL without causing re-render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  // Listen for custom event to open login modal
  React.useEffect(() => {
    const handleOpenLoginModal = () => {
      setLoginOpen(true);
    };
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  const goSignup = (role: 'customer' | 'shopowner') => {
    if (isAuthed) {
      if (role === 'shopowner') {
        if (hasShop) navigate('/dashboard');
        else navigate('/shop/new');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    navigate('/signup', { state: { selectedRole: role } });
  };

  const handlePrimaryCTA = () => {
    if (hasShop) navigate('/dashboard');
    else navigate('/shop/new');
  };

  // Force light mode on the landing page — it has its own visual design.
  // Restore the user's saved theme preference when navigating away.
  React.useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      // Restore whatever the user had saved
      try {
        const saved = localStorage.getItem('kirana-theme');
        if (saved === 'dark' || wasDark) {
          root.classList.add('dark');
        }
      } catch { /* ignore */ }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111] text-white overflow-x-hidden font-sans">
      {/* 1. Hero Section */}
      <section className="relative h-screen min-h-screen flex flex-col justify-center overflow-hidden py-12 md:py-20">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero%20image%20kirana.png" 
            alt="Traditional Indian Shopkeeper Store" 
            className="w-full h-full object-cover object-center" 
          />
          {/* Dark overlay so white text is readable over the image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          {/* Bottom fade to blend into dark bg below */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#111]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-7xl mx-auto w-full">
            {/* Left Content (Text & Call-To-Action) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl xl:text-[4.5rem] font-extrabold leading-[1.1] text-white tracking-tight"
              >
                Your Neighborhood <br />
                Store. <span className="text-[#ff6a00]">Now Online.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/80 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
              >
                Empowering local kirana shops to compete in the age of quick commerce. Place orders with the neighborhood stores you trust.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goSignup('customer')}
                  className="px-8 py-3.5 bg-orange-500 text-white font-bold rounded-[14px] shadow-[0_4px_14px_rgba(255,106,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,106,0,0.4)] transition-all duration-300 flex items-center justify-center gap-2 text-base"
                >
                  Shop Nearby
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrimaryCTA}
                  className="px-8 py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-[14px] hover:bg-white/20 hover:border-white/50 backdrop-blur-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 text-base"
                >
                  Register Your Shop
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-10 flex flex-wrap justify-center lg:justify-start gap-8 lg:gap-12 text-sm sm:text-base text-white/90 font-semibold"
              >
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-white/20">
                    <Store className="w-7 h-7 text-orange-400" />
                  </div>
                  <span className="leading-tight group-hover:text-white transition-colors duration-300">Local Stores<br/>You Trust</span>
                </div>

                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-white/20">
                    <Truck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <span className="leading-tight group-hover:text-white transition-colors duration-300">Fast & Easy<br/>Delivery</span>
                </div>

                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-white/20">
                    <Shield className="w-7 h-7 text-cyan-400" />
                  </div>
                  <span className="leading-tight group-hover:text-white transition-colors duration-300">Secure & Safe<br/>Payments</span>
                </div>
              </motion.div>
            </div>

            {/* Right Content (Floating Smartphone Mockup) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="relative w-[300px] sm:w-[340px] aspect-[9/19.5] bg-[#E8E8E8] rounded-[50px] p-[8px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-[4px] border-[#333]"
              >
                <div className="absolute inset-0 rounded-[42px] border-[1px] border-black pointer-events-none z-30" />
                
                {/* Smartphone Screen Content */}
                <div className="w-full h-full bg-[#FAFAFA] rounded-[38px] overflow-hidden flex flex-col relative text-[10px] select-none font-sans text-slate-800 shadow-inner">
                  
                  {/* Smartphone Notch Area */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-[18px] z-20 flex items-center justify-center">
                    <div className="w-12 h-1.5 bg-[#222] rounded-full mb-0.5" />
                  </div>

                  {/* Status Bar */}
                  <div className="pt-8 px-5 pb-2 flex justify-between items-center text-[11px] text-black font-semibold">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex space-x-[2px] items-end h-2.5">
                        <div className="w-[3px] h-1.5 bg-black rounded-sm" />
                        <div className="w-[3px] h-2 bg-black rounded-sm" />
                        <div className="w-[3px] h-2.5 bg-black rounded-sm" />
                      </div>
                      <div className="w-4 h-2.5 rounded-sm border border-black p-[1px] relative">
                        <div className="w-full h-full bg-black rounded-[1px]" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Header & Cart */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between text-[11px] mb-2.5">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-[#ff6a00]" />
                        <span className="font-semibold tracking-tight">Koramangala, Bengaluru</span>
                        <span className="text-[8px] opacity-70">▼</span>
                      </div>
                      <div className="relative flex items-center justify-center text-slate-600 bg-white p-1.5 rounded-full shadow-sm border border-slate-100">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 bg-[#ff6a00] text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border-[1.5px] border-white">
                          0
                        </span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <div className="w-full bg-white border border-slate-200 text-slate-400 py-2.5 pl-9 pr-4 rounded-xl text-[10px] shadow-sm font-medium">
                        Search for products...
                      </div>
                    </div>
                  </div>
                  
                  {/* Miniature App Cards List (Scrollable) */}
                  <div className="flex-1 overflow-y-auto px-4 py-1 space-y-5 scrollbar-none pb-6">
                    {/* Hero Card Banner */}
                    <div className="relative bg-[#FFF0E6] rounded-2xl p-4 text-slate-800 overflow-hidden shadow-sm">
                      <div className="relative z-10 max-w-[65%] space-y-2">
                        <p className="font-bold text-[14px] leading-tight text-[#333]">Shop from trusted <br/>local stores <br/>near you</p>
                        <span className="inline-block bg-[#ff6a00] text-white font-bold px-3 py-1.5 rounded-lg text-[9px] shadow-sm">
                          Shop Now
                        </span>
                      </div>
                      <div className="absolute right-[-10px] bottom-0 w-24 h-24 pointer-events-none">
                        <img src="/hero%20image%20kirana.png" className="w-full h-full object-cover rounded-tl-full opacity-90 shadow-md" alt="shop illust" />
                      </div>
                    </div>
                    
                    {/* Top Categories */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-3 font-bold text-[#333]">
                        <span>Top Categories</span>
                        <span className="text-[#ff6a00] font-semibold text-[9px]">View All</span>
                      </div>
                      <div className="flex justify-between text-center font-semibold">
                        {[
                          { label: 'Grocery', emoji: '🛍️', bg: 'bg-[#E8F5E9]' },
                          { label: 'Dairy', emoji: '🥛', bg: 'bg-[#E3F2FD]' },
                          { label: 'Snacks', emoji: '🍿', bg: 'bg-[#FFF3E0]' },
                          { label: 'Beverages', emoji: '🥤', bg: 'bg-[#FCE4EC]' },
                          { label: 'Personal\nCare', emoji: '🧴', bg: 'bg-[#F3E5F5]' }
                        ].map((cat, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 w-[50px]">
                            <div className={`w-10 h-10 ${cat.bg} rounded-xl flex flex-col items-center justify-center shadow-sm`}>
                              <span className="text-lg">{cat.emoji}</span>
                            </div>
                            <span className="text-[7.5px] text-slate-600 leading-tight whitespace-pre-line">{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Nearby Stores Card */}
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-3 font-bold text-[#333]">
                        <span>Nearby Stores</span>
                        <span className="text-green-600 font-semibold text-[9px]">View Map</span>
                      </div>
                      
                      {/* Mini Map */}
                      <div className="w-full h-20 bg-[#F0F0F0] rounded-xl mb-3 relative overflow-hidden border border-slate-200">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#999_1px,transparent_1px)] [background-size:10px_10px]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <MapPin className="h-6 w-6 text-[#ff6a00] drop-shadow-md relative z-10" />
                          <div className="w-4 h-1 bg-black/20 blur-sm rounded-[100%] mt-[-4px]" />
                        </div>
                      </div>
                      
                      {/* Store Card Details */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0 relative">
                           <img src="/hero%20image%20kirana.png" className="w-full h-full object-cover object-left" alt="shop" />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-[#333] truncate text-[11px]">Sharma Provision Store</span>
                            <span className="bg-[#E8F5E9] text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">20% OFF</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-medium mb-1">
                            <span className="flex items-center gap-0.5 text-[#ff6a00]"><Star className="w-2.5 h-2.5 fill-current" /> 4.8</span>
                            <span>•</span>
                            <span>10 mins delivery</span>
                            <span>•</span>
                            <span>0.8 km</span>
                          </div>
                          <div className="text-slate-400 text-[9px] font-medium">₹249 min order</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Miniature Bottom Tab Bar */}
                  <div className="h-[60px] bg-white border-t border-slate-100 px-6 flex justify-between items-center text-slate-400 text-[9px] font-semibold pb-2">
                    {[
                      { label: 'Home', icon: <span className="text-[#ff6a00] text-lg">🏠</span>, active: true },
                      { label: 'Categories', icon: <span className="text-lg opacity-80 grayscale">🗂️</span> },
                      { label: 'Orders', icon: <span className="text-lg opacity-80 grayscale">📦</span> },
                      { label: 'Profile', icon: <span className="text-lg opacity-80 grayscale">👤</span> }
                    ].map((item, idx) => (
                      <div key={idx} className={`flex flex-col items-center gap-1 cursor-pointer ${item.active ? 'text-[#ff6a00]' : ''}`}>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. What's Happening to Our Local Stores? (VS Section) */}
      <section className="py-6 relative overflow-hidden bg-[#111]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex justify-center">
          <div className="flex flex-col lg:flex-row w-full rounded-[24px] overflow-hidden border border-white/10 bg-[#1a1a1f] shadow-xl items-stretch">
            {/* Left Column (Details) */}
            <div className="p-8 md:p-12 lg:w-[42%] flex flex-col justify-center space-y-10 shrink-0">
              <h2 className="text-[28px] md:text-[32px] font-extrabold leading-tight text-white tracking-tight">
                What's Happening to <br />
                Our Local Stores?
              </h2>
              <div className="space-y-8">
                {[
                  { icon: Building2, text: 'Quick commerce giants\nmonopolizing the market' },
                  { icon: TrendingDown, text: 'High commissions and\nunfair algorithms' },
                  { icon: Frown, text: 'Small stores struggling\nto survive' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-10 h-10 shrink-0 rounded-[12px] border border-white/10 flex items-center justify-center text-white/70 bg-white/5 shadow-sm">
                      <item.icon className="h-5 w-5 stroke-[2]" />
                    </div>
                    <p className="text-white/70 text-[14px] leading-tight whitespace-pre-line font-medium mt-1">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (VS Image) */}
            <div className="lg:w-[58%] relative shrink-0">
              <img 
                src="/vs%20image%20kirana.png" 
                alt="Big Warehouse VS Local Store split mockup" 
                className="w-full h-full object-cover object-center" 
              />
              
              {/* Overlaid Texts */}
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                <div className="grid grid-cols-2 gap-4 items-end h-full relative">
                  {/* Warehouse text */}
                  <div className="text-left mb-1 opacity-100">
                    <h4 className="text-white font-bold text-[13px] sm:text-sm leading-snug drop-shadow-md">
                      Big warehouses.<br/>
                      Big budgets.<br/>
                      Bigger control.
                    </h4>
                  </div>
                  
                  {/* Shopkeeper text */}
                  <div className="text-left mb-1 pl-6 opacity-100">
                    <h4 className="text-white font-bold text-[13px] sm:text-sm leading-snug drop-shadow-md">
                      Small stores.<br/>
                      Big hearts.<br/>
                      Limited reach.
                    </h4>
                  </div>
                </div>
              </div>

              {/* Floating VS Badge in the center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center shadow-lg">
                  <span className="text-gray-900 font-extrabold text-[13px] tracking-wider">VS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === UNIFIED PREMIUM MID SECTION === */}
      <section className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src="/mid_section.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
          {/* Top fade — blends from VS section's #111 */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#111] to-transparent z-[1]" />
          {/* Bottom fade — blends into footer */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#111] to-transparent z-[1]" />
        </div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center">
          
          {/* Mid Section Header */}
          <div className="text-center mb-16 mt-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white tracking-tight">
              Introducing Kirana<span className="text-orange-500">Connect</span>
            </h2>
          </div>

          {/* Premium Glassmorphism Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-20">
            {[
              {
                title: 'Map-based Discovery',
                desc: 'Find trusted kirana stores near you in one tap.',
                icon: MapPin,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10 border-orange-500/20'
              },
              {
                title: 'Real-time Inventory',
                desc: 'Live stock updates for smarter shopping.',
                icon: ShoppingBag,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10 border-emerald-500/20'
              },
              {
                title: 'Easy Ordering',
                desc: 'Add to cart and order in just a few taps.',
                icon: ShoppingCart,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10 border-orange-500/20'
              },
              {
                title: 'Shop Dashboard',
                desc: 'Manage your store, inventory & orders effortlessly.',
                icon: LineChart,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10 border-emerald-500/20'
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-white/5 rounded-[24px] p-8 border border-white/10 transition-all duration-300 flex flex-col items-center text-center hover:bg-white/10 hover:border-white/20"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${card.bg} ${card.color}`}>
                  <card.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{card.title}</h3>
                <p className="text-white/60 text-[15px] font-medium leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* How It Works */}
          <div className="w-full max-w-6xl mt-8">
            {/* Title with lines */}
            <div className="flex items-center justify-center gap-6 mb-16">
              <div className="h-[1px] w-24 sm:w-48 bg-gradient-to-r from-transparent to-white/20" />
              <h3 className="text-3xl font-extrabold text-white whitespace-nowrap tracking-tight">How It Works</h3>
              <div className="h-[1px] w-24 sm:w-48 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 relative">
              
              {/* For Customers */}
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-center gap-3 mb-12">
                  <User className="text-orange-500 w-7 h-7" />
                  <h4 className="text-2xl font-extrabold text-white">For Customers</h4>
                </div>
                
                <div className="relative flex justify-between items-start w-full px-4 sm:px-8">
                  {/* Dashed Connecting Line */}
                  <div className="absolute top-12 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-white/15 z-0" />
                  
                  {[
                    { step: '1', title: 'Discover', sub: 'nearby shops', icon: Store, color: 'text-orange-500', border: 'border-orange-500/30' },
                    { step: '2', title: 'Browse', sub: 'products', icon: Package, color: 'text-orange-500', border: 'border-orange-500/30' },
                    { step: '3', title: 'Place', sub: 'order', icon: ShoppingBag, color: 'text-orange-500', border: 'border-orange-500/30' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center z-10 w-28">
                      <div className={`w-24 h-24 rounded-full border bg-white/5 flex items-center justify-center shadow-sm mb-4 ${item.border} ${item.color}`}>
                        <item.icon className="w-10 h-10" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center -mt-8 mb-4 border-[3px] border-[#111] z-20">
                        {item.step}
                      </div>
                      <h5 className="font-bold text-white text-[15px] mb-1">{item.title}</h5>
                      <span className="text-white/50 font-medium text-[13px] text-center">{item.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Divider Line (Desktop only) */}
              <div className="hidden lg:block absolute left-1/2 top-[10%] bottom-[10%] w-[1px] bg-white/10 -translate-x-1/2" />

              {/* For Shop Owners */}
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-center gap-3 mb-12">
                  <Store className="text-emerald-500 w-7 h-7" />
                  <h4 className="text-2xl font-extrabold text-white">For Shop Owners</h4>
                </div>
                
                <div className="relative flex justify-between items-start w-full px-4 sm:px-8">
                  {/* Dashed Connecting Line */}
                  <div className="absolute top-12 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-white/15 z-0" />
                  
                  {[
                    { step: '1', title: 'Register', sub: 'your shop', icon: ClipboardList, color: 'text-emerald-500', border: 'border-emerald-500/30' },
                    { step: '2', title: 'Add', sub: 'inventory', icon: Package, color: 'text-emerald-500', border: 'border-emerald-500/30' },
                    { step: '3', title: 'Receive', sub: 'orders', icon: Bell, color: 'text-emerald-500', border: 'border-emerald-500/30' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center z-10 w-28">
                      <div className={`w-24 h-24 rounded-full border bg-white/5 flex items-center justify-center shadow-sm mb-4 ${item.border} ${item.color}`}>
                        <item.icon className="w-10 h-10" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center -mt-8 mb-4 border-[3px] border-[#111] z-20">
                        {item.step}
                      </div>
                      <h5 className="font-bold text-white text-[15px] mb-1">{item.title}</h5>
                      <span className="text-white/50 font-medium text-[13px] text-center">{item.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>



      {/* 9. Premium Footer */}
      <footer className="relative text-white pt-24 pb-12 overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/scenery%20kirana.png" 
            alt="Cityscape Sunset" 
            className="w-full h-full object-cover object-bottom" 
          />
          {/* Subtle overlay to let the scenery shine through while keeping text readable */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Top fade — blends from mid section */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#111] to-transparent z-[1]" />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand column */}
            <div className="space-y-6 text-center md:text-left lg:col-span-5">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <div>
                  <img 
                    src="/app%20logo.png" 
                    alt="KiranaConnect Logo"
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logo.svg';
                    }}
                  />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  <span>Kirana</span>
                  <span className="text-[#ff6a00]">Connect</span>
                </span>
              </div>
              <p className="text-sm md:text-base text-slate-300 max-w-sm mx-auto md:mx-0 leading-relaxed font-medium">
                Empowering local kirana stores and bringing neighborhood shops closer. Supporting micro-businesses for a self-reliant future in Bharat.
              </p>
              <div className="flex justify-center md:justify-start space-x-4 pt-2">
                {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#ff6a00] hover:text-white transition-all duration-300 border border-white/10 shadow-lg backdrop-blur-sm group"
                  >
                    <Icon className="h-4.5 w-4.5 text-slate-300 group-hover:text-white" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="text-center md:text-left lg:col-span-3 lg:col-start-7 space-y-6">
              <h4 className="text-lg font-bold text-white tracking-wide">Platform</h4>
              <ul className="space-y-3">
                {['Home', 'For Customers', 'For Shop Owners', 'About Us', 'Resources'].map((link) => (
                  <li key={link}>
                    <a href="#" className="inline-flex items-center text-sm text-slate-300 hover:text-[#ff6a00] transition-colors duration-300 font-medium group">
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div className="text-center md:text-left lg:col-span-3 space-y-6">
              <h4 className="text-lg font-bold text-white tracking-wide">Support</h4>
              <ul className="space-y-3">
                {['Help Center', 'Contact Us', 'Terms & Conditions', 'Privacy Policy'].map((link) => (
                  <li key={link}>
                    <a href="#" className="inline-flex items-center text-sm text-slate-300 hover:text-[#ff6a00] transition-colors duration-300 font-medium group">
                      <ArrowRight className="h-3 w-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-white/10 pt-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-sm text-slate-400 font-medium">
            <p className="flex items-center gap-1.5">
              © 2026 KiranaConnect. Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for Bharat.
            </p>
            
            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner">
                <Star className="h-4 w-4 text-[#ff6a00] fill-current" />
                <span className="text-slate-300 font-semibold text-xs tracking-wide">4.8/5 Customer Rating</span>
              </div>
              <select 
                className="bg-white/5 text-slate-300 px-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-[#ff6a00]/50 text-xs font-semibold backdrop-blur-sm cursor-pointer transition-all hover:bg-white/10"
                aria-label="Select language"
              >
                <option value="en" className="bg-[#0B0F17]">English (EN)</option>
                <option value="hi" className="bg-[#0B0F17]">हिंदी (HI)</option>
                <option value="bn" className="bg-[#0B0F17]">বাংলা (BN)</option>
              </select>
            </div>
          </div>
        </div>
      </footer>

      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default Home;