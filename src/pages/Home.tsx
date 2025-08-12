import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from '../components/StatsCard';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Users, Truck, Shield, Clock, Star, MapPin } from 'lucide-react';
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
  const publicUrl = (path: string) => `/${path.replace(/^\//, '')}`;
  // Background assets
  const heroMain = publicUrl('landing/hero-main.png');
  const heroCustomer = publicUrl('landing/hero-customer.png');
  const heroShopkeeper = publicUrl('landing/hero-shopkeeper.png');

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-x-hidden snap-y snap-mandatory">
      {/* Navbar is provided by Layout; header removed for Home */}

      {/* Hero Section (full-screen, filled) */}
      <section className="min-h-screen px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center snap-start">
        {/* Static hero background image */}
        <div className="absolute inset-0">
          <motion.img
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            src={heroMain}
            alt="KiranaConnect: from local mudi shops in Kolkata to your doorstep"
            className="absolute inset-0 w-full h-full object-cover z-0 will-change-transform"
            loading={'eager'}
          />
          {/* Color grade + dark overlay for text readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950/80" />
          <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top_right,rgba(34,229,139,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(255,122,24,0.18),transparent_50%)]" />
        </div>
        <div className="relative z-30 max-w-7xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm text-slate-200 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            aria-label="Our motto"
          >
            <span className="text-neon-green">Our Motto:</span>
            <span className="text-slate-200">From local mudi shops to your doorstep</span>
          </motion.div>

          <motion.h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Connecting Bharat's Local{' '}
            <span className="bg-gradient-to-r from-neon-orange to-neon-green bg-clip-text text-transparent">
              Mudi Shops
            </span>{' '}
            with You
          </motion.h1>
          
          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Order directly from your trusted neighborhood stores. For Shop Owners, join and start receiving online orders today.
          </p>

          {/* No card in hero */}

          <div className="max-w-3xl mx-auto mb-2">
            <p className="text-center text-slate-300">One platform connecting Kolkata shops with nearby customers</p>
          </div>
          {/* end hero */}
        </div>
      </section>

      {/* Customer Feature Section (full-screen, scroll-snap) */}
      <section className="relative overflow-hidden min-h-screen flex items-center snap-start">
        <motion.img
          src={heroCustomer}
          alt="Customer experience"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          initial={{ opacity: 0, scale: 1.08 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-4">For Customers</h2>
            <p className="text-slate-200 mb-6">Shop from trusted neighborhood stores and get fast doorstep delivery.</p>
            <ul className="space-y-3 text-slate-200 mb-8 list-disc pl-5">
              <li>Discover nearby shops and products</li>
              <li>One cart across multiple stores</li>
              <li>Track orders in real time</li>
            </ul>
            <button onClick={() => goSignup('customer')} className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100">Join as Customer</button>
          </motion.div>
        </div>
      </section>

      {/* Shopkeeper Feature Section (full-screen, scroll-snap) */}
      <section className="relative overflow-hidden min-h-screen flex items-center snap-start">
        <motion.img
          src={heroShopkeeper}
          alt="Shopkeeper packing order"
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          initial={{ opacity: 0, scale: 1.08 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="ml-auto max-w-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-4">For Shop Owners</h2>
            <p className="text-slate-200 mb-6">Open your digital storefront and start receiving online orders.</p>
            <ul className="space-y-3 text-slate-200 mb-8 list-disc pl-5">
              <li>List products and manage inventory</li>
              <li>Receive orders instantly</li>
              <li>Secure payments and analytics</li>
            </ul>
            <button onClick={() => goSignup('shopowner')} className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100">Join as Shop Owner</button>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white/5 backdrop-blur-sm">
          <div id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How KiranaConnect Works</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Simple, fast, and reliable - connecting communities one order at a time
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Customers */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Users className="h-8 w-8 text-neon-green mr-3" />
                For Customers
              </h3>
              
              <div className="space-y-6">
                {[
                  { icon: MapPin, title: "Find Local Stores", desc: "Discover trusted neighborhood shops near you" },
                  { icon: ShoppingBag, title: "Browse & Order", desc: "Shop from multiple stores in one cart" },
                  { icon: Truck, title: "Fast Delivery", desc: "Get your essentials delivered to your doorstep" }
                ].map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{step.title}</h4>
                      <p className="text-slate-300">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Shop Owners */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Store className="h-8 w-8 text-neon-orange mr-3" />
                For Shop Owners
              </h3>
              
              <div className="space-y-6">
                {[
                  { icon: Store, title: "List Your Store", desc: "Create your digital storefront in minutes" },
                  { icon: Clock, title: "Receive Orders", desc: "Get notified instantly when customers order" },
                  { icon: Shield, title: "Secure Payments", desc: "Get paid directly with secure transactions" }
                ].map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{step.title}</h4>
                      <p className="text-slate-300">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatsCard icon={<Users className="h-6 w-6" />} value={10000} label="Happy Customers" />
            <StatsCard icon={<Store className="h-6 w-6" />} value={2500} label="Partner Stores" />
            <StatsCard icon={<Truck className="h-6 w-6" />} value={50000} label="Orders Delivered" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
       <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join KiranaConnect?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Whether you're looking to shop or sell, we're here to connect you with your community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePrimaryCTA}
              className="px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-lg hover:shadow-xl"
              aria-label="Open my shop"
            >
              {hasShop ? 'Go to Dashboard' : 'Open My Shop — Free'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">KiranaConnect</h3>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm">4.8/5 Rating</span>
              </div>
              <div className="text-sm text-slate-400">
                © 2024 KiranaConnect. Made with ❤️ for Bharat
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