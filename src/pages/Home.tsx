import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import StatsCard from '../components/StatsCard';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Store, Users, Truck, Shield, Star, MapPin, 
  ArrowRight, CheckCircle, Heart, Mail, Phone, 
  Facebook, Twitter, Instagram, Linkedin, Youtube
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId } from '../utils/shopService';
import SignupModal from '../components/SignupModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hasShop, setHasShop] = React.useState<boolean>(false);
  const [isAuthed, setIsAuthed] = React.useState<boolean>(false);
  const [signupOpen, setSignupOpen] = React.useState<boolean>(false);
  
  // Parallax scroll effects
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, -100]);

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

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F5F5F5] overflow-x-hidden">
      {/* Hero Section - Mobile-First Responsive */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center overflow-hidden">
        {/* Mobile: Photo on top, full width | Desktop: Left side, half width */}
        <motion.div 
          style={{ y: heroParallax }}
          className="w-full lg:w-1/2 h-64 sm:h-80 md:h-96 lg:h-full relative"
        >
          <img
            src="https://res.cloudinary.com/dacgtjw7w/image/upload/v1754972970/hero-shopkeeper_icfsid.png"
            alt="Shopkeeper packing groceries"
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/80 via-[#0B0F17]/60 to-[#0B0F17]/80" />
        </motion.div>

        {/* Mobile: Content below, centered | Desktop: Right side */}
        <div className="relative z-10 w-full lg:w-1/2 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-0 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: 0, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto lg:mx-0"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#161B22]/80 backdrop-blur-sm border border-[#2A2F38] text-[#F5F5F5] text-xs sm:text-sm font-medium mb-6 sm:mb-8 shadow-lg"
            >
              <span>🚀</span>
              <span className="hidden sm:inline">Connecting Bharat's Local Shops</span>
              <span className="sm:hidden">Local Shops</span>
            </motion.div>

            {/* Bold Headline - Responsive Typography */}
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-4 sm:mb-6 text-[#F5F5F5]"
            >
              From Local{' '}
              <span className="bg-gradient-to-r from-green-400 to-orange-500 bg-clip-text text-transparent">Mudi Shops</span>{' '}
              to Your{' '}
              <span className="bg-gradient-to-r from-orange-500 to-green-400 bg-clip-text text-transparent">Doorstep</span>
            </motion.h1>
            
            {/* Subheadline - Responsive Typography */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl text-[#CCCCCC] mb-6 sm:mb-8 lg:mb-10 leading-relaxed max-w-lg lg:max-w-none mx-auto lg:mx-0"
            >
              Order directly from your trusted neighborhood stores. For shop owners, join and start receiving online orders today.
            </motion.p>

            {/* CTA Buttons - Mobile Stacked, Desktop Side by Side */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goSignup('customer')}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base"
              >
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                Start Shopping
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrimaryCTA}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 group text-sm sm:text-base"
              >
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                Open My Shop
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            {/* Trust indicators - Mobile Optimized */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-6 sm:mt-8 lg:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs sm:text-sm text-[#CCCCCC]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <span>10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                <span>Secure Payments</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Choose Your Path Section - Enhanced with floating iconography */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#0F1419] relative overflow-hidden">
        {/* Floating background elements - Mobile Optimized */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-20 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/20 to-orange-500/20 rounded-full opacity-20 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute top-40 right-20 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500/20 to-green-500/20 rounded-full opacity-20 blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute bottom-20 left-1/4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500/15 to-blue-500/15 rounded-full opacity-15 blur-xl"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-3 sm:mb-4">Choose Your Path</h2>
            <p className="text-base sm:text-lg md:text-xl text-[#CCCCCC] max-w-2xl mx-auto px-4">
              Whether you want to shop or sell, we've got you covered with our comprehensive platform
            </p>
          </motion.div>

          {/* Responsive Grid: Mobile 1-col, Tablet 2-col, Desktop 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* For Customers Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#2A2F38] overflow-hidden"
            >
              {/* Floating icon with glow - Mobile Optimized */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.3)",
                      "0 0 40px rgba(34, 197, 94, 0.5)",
                      "0 0 20px rgba(34, 197, 94, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5F5F5] mb-3 sm:mb-4 pr-20 sm:pr-24">For Customers</h3>
              <p className="text-sm sm:text-base md:text-lg text-[#CCCCCC] mb-4 sm:mb-6 leading-relaxed">
                Discover and shop from your trusted neighborhood stores with convenience and reliability.
              </p>
              
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  'Discover nearby shops and products',
                  'One cart across multiple stores',
                  'Track orders in real time',
                  'Fast doorstep delivery'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-[#CCCCCC]">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goSignup('customer')}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-green-500/25 text-sm sm:text-base"
              >
                Join as Customer
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            {/* For Shop Owners Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#2A2F38] overflow-hidden"
            >
              {/* Floating icon with glow - Mobile Optimized */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                <motion.div 
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(249, 115, 22, 0.3)",
                      "0 0 40px rgba(249, 115, 22, 0.5)",
                      "0 0 20px rgba(249, 115, 22, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Store className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#F5F5F5] mb-3 sm:mb-4 pr-20 sm:pr-24">For Shop Owners</h3>
              <p className="text-sm sm:text-base md:text-lg text-[#CCCCCC] mb-4 sm:mb-6 leading-relaxed">
                Transform your local shop into a digital storefront and reach more customers online.
              </p>
              
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  'List products and manage inventory',
                  'Receive orders instantly',
                  'Secure payments and analytics',
                  'Grow your business digitally'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-[#CCCCCC]">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goSignup('shopowner')}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-orange-500/25 text-sm sm:text-base"
              >
                Join as Shop Owner
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - 3-step horizontal card layout - Mobile Optimized */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-3 sm:mb-4">How KiranaConnect Works</h2>
            <p className="text-base sm:text-lg md:text-xl text-[#CCCCCC] max-w-2xl mx-auto px-4">
              Simple, fast, and reliable - connecting communities one order at a time
            </p>
          </motion.div>

          {/* Responsive Grid: Mobile 1-col, Tablet 2-col, Desktop 3-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                number: '01',
                icon: MapPin,
                title: 'Discover Local Shops',
                subtitle: 'Find trusted neighborhood stores near you with our smart location-based search',
                color: 'from-blue-500 to-indigo-600',
                delay: 0.1
              },
              {
                number: '02',
                icon: ShoppingBag,
                title: 'Shop & Order',
                subtitle: 'Browse products, add to cart, and place orders from multiple shops seamlessly',
                color: 'from-orange-500 to-red-600',
                delay: 0.2
              },
              {
                number: '03',
                icon: Truck,
                title: 'Fast Delivery',
                subtitle: 'Get your essentials delivered to your doorstep with real-time tracking',
                color: 'from-green-500 to-emerald-600',
                delay: 0.3
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: step.delay }}
                whileHover={{ scale: 1.02 }}
                className="group relative text-center"
              >
                {/* Dark card with hover effects - Mobile Optimized */}
                <div className="relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#2A2F38] shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:border-gradient-to-r group-hover:from-green-500 group-hover:to-orange-500">
                  {/* Step Number Badge - Mobile Optimized */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold shadow-lg">
                    {step.number}
                  </div>
                  
                  {/* Large gradient-filled icon - Mobile Optimized */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-300`}>
                    <step.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  
                  {/* Content - Mobile Optimized */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F5] mb-2 sm:mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base text-[#CCCCCC] leading-relaxed">{step.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by Thousands - Split layout with testimonial and stats - Mobile Optimized */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-[#0F1419]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left: Customer photo with testimonial - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, x: 0, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative">
                {/* Photo in framed card - Mobile Optimized */}
                <div className="relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#2A2F38]">
                  <img
                    src="https://res.cloudinary.com/dacgtjw7w/image/upload/v1754972969/hero-main_fltopq.png"
                    alt="Customer unboxing groceries"
                    className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-xl sm:rounded-2xl shadow-lg"
                  />
                  
                  {/* Testimonial overlay - Mobile Optimized */}
                  <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 bg-[#161B22]/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-[#2A2F38]">
                    <p className="text-sm sm:text-base text-[#F5F5F5] font-medium text-center">
                      "Lakhs of families trust KiranaConnect for their daily essentials."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Enhanced statistics - stacked vertically - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, x: 0, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 sm:space-y-6 order-1 lg:order-2"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4 sm:mb-6 lg:mb-8 text-center lg:text-left">Trusted by Thousands</h2>
              <p className="text-base sm:text-lg md:text-xl text-[#CCCCCC] mb-6 sm:mb-8 lg:mb-12 text-center lg:text-left">
                Join the growing community of customers and shop owners who trust KiranaConnect
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                <StatsCard icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />} value={10000} label="Happy Customers" />
                <StatsCard icon={<Store className="h-5 w-5 sm:h-6 sm:w-6" />} value={2500} label="Partner Stores" />
                <StatsCard icon={<Truck className="h-5 w-5 sm:h-6 sm:w-6" />} value={50000} label="Orders Delivered" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Mobile Optimized */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-r from-green-500 via-green-600 to-orange-600 relative overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to Join KiranaConnect?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Whether you're looking to shop or sell, we're here to connect you with your community. Start your journey today!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrimaryCTA}
                className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white text-green-600 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
              >
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                {hasShop ? 'Go to Dashboard' : 'Open My Shop — Free'}
              </motion.button>
            </div>
            
            <p className="text-green-200 mt-4 sm:mt-6 text-xs sm:text-sm">
              No setup fees • No monthly charges • Start earning today
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer - Mobile Optimized */}
      <footer className="bg-[#0B0F17] text-white py-8 sm:py-12 md:py-16 relative">
        {/* Top border gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-white to-orange-500" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand - Mobile Full Width */}
            <div className="col-span-1 md:col-span-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <div className="bg-gradient-to-r from-green-500 to-orange-500 p-2 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">KiranaConnect</h3>
              </div>
              <p className="text-sm sm:text-base text-[#CCCCCC] mb-4 sm:mb-6 max-w-md mx-auto md:mx-0">
                Connecting Bharat's local mudi shops with customers for a seamless shopping experience.
              </p>
              <div className="flex justify-center md:justify-start space-x-3 sm:space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-[#161B22] rounded-lg flex items-center justify-center hover:bg-green-500 transition-colors duration-300 border border-[#2A2F38]"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links - Mobile Centered */}
            <div className="text-center md:text-left">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#F5F5F5]">Quick Links</h4>
              <ul className="space-y-2">
                {['About Us', 'Blog', 'Careers', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm sm:text-base text-[#CCCCCC] hover:text-white transition-colors duration-300">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support - Mobile Centered */}
            <div className="text-center md:text-left">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#F5F5F5]">Support</h4>
              <ul className="space-y-2">
                {[
                  { icon: Mail, text: 'help@kiranaconnect.com' },
                  { icon: Phone, text: '+91 98765 43210' }
                ].map((item, index) => (
                  <li key={index} className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-[#CCCCCC]">
                    <item.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom section - Mobile Optimized */}
          <div className="border-t border-[#2A2F38] pt-6 sm:pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  <span className="text-xs sm:text-sm">4.8/5 Rating</span>
                </div>
                <div className="text-xs sm:text-sm text-[#CCCCCC]">
                  © 2024 KiranaConnect. Made with <Heart className="inline h-3 w-3 sm:h-4 sm:w-4 text-red-500" /> for Bharat
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select 
                  className="bg-[#161B22] text-[#CCCCCC] px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm border border-[#2A2F38] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  aria-label="Select language"
                  title="Select language"
                >
                  <option>English</option>
                  <option>हिंदी</option>
                  <option>বাংলা</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
};

export default Home;