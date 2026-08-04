import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, Store, Truck, Shield, Star, MapPin,
  ArrowRight, Heart,
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
import HeroPhoneMockup from '../components/HeroPhoneMockup';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasShop, setHasShop] = React.useState<boolean>(false);
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);
  const [signupOpen, setSignupOpen] = React.useState<boolean>(false);
  const [loginOpen, setLoginOpen] = React.useState<boolean>(false);
  
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
      <section id="home" className="hero-section relative flex flex-col justify-center overflow-hidden py-10 sm:py-12 lg:py-8">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero%20image%20kirana.png" 
            alt="Kirana shopkeeper standing in a neighborhood grocery store"
            className="h-full w-full object-cover object-center"
          />
          {/* Keep the original visual treatment so the shopkeeper and warm orange sweep remain visible. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          {/* Bottom fade to blend into dark bg below */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-[#111]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-10 xl:gap-16">
            {/* Left Content (Text & Call-To-Action) */}
            <div className="max-w-[760px] space-y-6 text-center lg:-translate-y-16 lg:text-left">

              <motion.h1
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="max-w-[21ch] text-[clamp(2.55rem,4.25vw,4.65rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-white [text-wrap:balance] drop-shadow-[0_3px_18px_rgba(0,0,0,0.24)]"
              >
                Your Neighborhood Store. <span className="text-[#ff6a00]">Now Online.</span>
              </motion.h1>

              <motion.p
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto max-w-[610px] text-[clamp(1rem,1.45vw,1.2rem)] font-medium leading-[1.65] text-[#f2e9df]/90 lg:mx-0"
              >
                Empowering local kirana shops to compete in the age of quick commerce. Order from neighborhood stores you already trust.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col justify-center gap-3 pt-1 sm:flex-row lg:justify-start"
              >
                <button
                  onClick={() => goSignup('customer')}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[14px] bg-[#f46a16] px-7 text-base font-extrabold text-white shadow-[0_10px_28px_rgba(244,106,22,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#ff7b2f] hover:shadow-[0_14px_32px_rgba(244,106,22,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1009] active:translate-y-0"
                >
                  Shop Nearby
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={handlePrimaryCTA}
                  className="inline-flex min-h-14 items-center justify-center rounded-[14px] border border-white/45 bg-black/25 px-7 text-base font-extrabold text-white shadow-[0_8px_22px_rgba(0,0,0,0.14)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/75 hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1009] active:translate-y-0"
                >
                  List Your Store
                </button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-3 gap-3 pt-5 text-left text-[11px] font-bold text-white/90 sm:gap-5 sm:text-sm lg:max-w-[700px] lg:gap-7"
              >
                <div className="group flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-orange-300/35 bg-orange-300/10 text-orange-300 transition duration-200 group-hover:bg-orange-300/20 sm:h-12 sm:w-12">
                    <Store className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <span className="leading-[1.25]">Trusted local stores</span>
                </div>

                <div className="group flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-emerald-300/35 bg-emerald-300/10 text-emerald-300 transition duration-200 group-hover:bg-emerald-300/20 sm:h-12 sm:w-12">
                    <Truck className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <span className="leading-[1.25]">Fast doorstep delivery</span>
                </div>

                <div className="group flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-sky-300/35 bg-sky-300/10 text-sky-300 transition duration-200 group-hover:bg-sky-300/20 sm:h-12 sm:w-12">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                  </div>
                  <span className="leading-[1.25]">Secure payments</span>
                </div>
              </motion.div>
            </div>

            {/* Right Content (Floating Smartphone Mockup) */}
            <div className="relative flex justify-center lg:justify-end lg:translate-y-5">
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              >
                <HeroPhoneMockup />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. What's Happening to Our Local Stores? (VS Section) */}
      <section id="about-us" className="py-6 relative overflow-hidden bg-[#111]">
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
      <section id="resources" className="relative min-h-screen flex flex-col justify-center py-20 overflow-hidden">
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
              <div id="for-customers" className="flex flex-col w-full scroll-mt-20">
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
              <div id="for-shop-owners" className="flex flex-col w-full scroll-mt-20">
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
