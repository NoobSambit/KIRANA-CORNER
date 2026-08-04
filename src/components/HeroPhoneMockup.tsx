import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  Home,
  MapPin,
  Package,
  Percent,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Truck,
  User,
} from 'lucide-react';

type ScreenId = 'home' | 'store' | 'orders';

const categories = [
  { label: 'Grocery', icon: Store, className: 'bg-[#e8f5eb] text-[#228047]' },
  { label: 'Dairy', icon: Package, className: 'bg-[#e8f1fb] text-[#3a72a8]' },
  { label: 'Snacks', icon: ShoppingBag, className: 'bg-[#fff2dd] text-[#b86a18]' },
  { label: 'Personal Care', icon: Tags, className: 'bg-[#f5eafa] text-[#8a4ca5]' },
];

const screenLabels: Record<ScreenId, string> = {
  home: 'Home',
  store: 'Store catalogue',
  orders: 'Order tracking',
};

const bottomNavItems: Array<{ label: string; icon: React.ElementType; screen: ScreenId | null }> = [
  { label: 'Home', icon: Home, screen: 'home' },
  { label: 'Categories', icon: Tags, screen: 'store' },
  { label: 'Orders', icon: Package, screen: 'orders' },
  { label: 'Profile', icon: User, screen: null },
];

const ProductRow: React.FC<{ name: string; detail: string; price: string; color: string }> = ({ name, detail, price, color }) => (
  <div className="flex items-center gap-2.5 rounded-[14px] border border-[#eee6df] bg-white p-2.5 shadow-[0_4px_12px_rgba(75,48,26,0.05)]">
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${color}`}>
      <Package className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-extrabold text-[#302721]">{name}</p>
      <p className="mt-0.5 text-[8.5px] font-semibold text-[#9a8d81]">{detail}</p>
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-[10px] font-extrabold text-[#302721]">{price}</span>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fff0e6] text-[13px] font-bold text-[#f46a16]">+</span>
    </div>
  </div>
);

const HomeScreen: React.FC = () => (
  <div className="space-y-3">
    <div className="relative min-h-[112px] overflow-hidden rounded-[18px] bg-[#fff0e6] px-3.5 py-3.5 shadow-[0_6px_16px_rgba(177,76,21,0.1)]">
      <div className="relative z-10 max-w-[61%]">
        <p className="text-[14px] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#302721]">Groceries from nearby shops</p>
        <p className="mt-1.5 text-[9px] font-semibold leading-[1.3] text-[#846e5d]">Delivered in 15–30 minutes</p>
        <span className="mt-2.5 inline-flex items-center gap-1 rounded-[9px] bg-[#f46a16] px-2.5 py-1.5 text-[9px] font-extrabold text-white shadow-[0_4px_10px_rgba(244,106,22,0.25)]">
          Shop now <span aria-hidden="true">→</span>
        </span>
      </div>
      <div className="absolute inset-y-0 right-0 w-[43%] overflow-hidden">
        <img src="/hero%20image%20kirana.png" alt="" className="h-full w-full object-cover object-[30%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff0e6] via-[#fff0e6]/10 to-transparent" />
      </div>
    </div>

    <section aria-label="Nearby stores">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-extrabold tracking-[-0.01em] text-[#302721]">Nearby stores</h2>
        <span className="text-[9px] font-extrabold text-[#228047]">View all</span>
      </div>
      <div className="mt-2.5 rounded-[16px] border border-[#eee6df] bg-white p-2.5 shadow-[0_5px_16px_rgba(75,48,26,0.07)]">
        <div className="flex items-start gap-2.5">
          <div className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[13px] bg-[#f5eadf]">
            <img src="/hero%20image%20kirana.png" alt="" className="h-full w-full object-cover object-[18%_center]" />
            <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 py-0.5 text-[7px] font-bold text-white">OPEN</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1.5">
              <h3 className="truncate text-[11px] font-extrabold leading-tight text-[#302721]">Sharma Provision Store</h3>
              <span className="shrink-0 rounded-md bg-[#e7f6ea] px-1.5 py-1 text-[7px] font-extrabold text-[#228047]">20% OFF</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] font-semibold text-[#75675c]">
              <span className="flex items-center gap-0.5 text-[#e47519]"><Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />4.8</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-0.5"><Clock3 className="h-2.5 w-2.5" aria-hidden="true" />10–15 min</span>
              <span aria-hidden="true">·</span>
              <span>0.8 km</span>
            </div>
            <p className="mt-1 text-[9px] font-bold text-[#9a8d81]">₹249 minimum order</p>
          </div>
        </div>
      </div>
    </section>

    <section aria-label="Popular categories">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-extrabold tracking-[-0.01em] text-[#302721]">Popular categories</h2>
        <span className="text-[9px] font-extrabold text-[#f46a16]">Browse all</span>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-2">
        {categories.map(({ label, icon: Icon, className }) => (
          <div key={label} className="flex min-w-0 flex-col items-center gap-1.5 rounded-[12px] bg-[#fffdfb] px-1 py-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${className}`}>
              <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
            </div>
            <span className="text-center text-[8.5px] font-extrabold leading-[1.1] text-[#695c51]">{label}</span>
          </div>
        ))}
      </div>
    </section>

    <section aria-label="Quick picks">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-extrabold text-[#302721]">Quick picks</h2>
        <span className="text-[9px] font-extrabold text-[#f46a16]">Popular nearby</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-[13px] border border-[#eee6df] bg-white p-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#fff2dd] text-[#b86a18]"><ShoppingBag className="h-4 w-4" aria-hidden="true" /></div>
          <p className="mt-2 truncate text-[9px] font-extrabold text-[#302721]">Aashirvaad Atta</p>
          <p className="mt-0.5 text-[9px] font-bold text-[#f46a16]">₹62 · 1 kg</p>
        </div>
        <div className="rounded-[13px] border border-[#eee6df] bg-white p-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#e8f1fb] text-[#3a72a8]"><Heart className="h-4 w-4" aria-hidden="true" /></div>
          <p className="mt-2 truncate text-[9px] font-extrabold text-[#302721]">Amul Taaza Milk</p>
          <p className="mt-0.5 text-[9px] font-bold text-[#f46a16]">₹30 · 1 L</p>
        </div>
      </div>
    </section>
  </div>
);

const StoreScreen: React.FC = () => (
  <div className="space-y-3">
    <div className="rounded-[18px] bg-[#21160f] p-3.5 text-white shadow-[0_7px_18px_rgba(49,24,10,0.2)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f46a16] text-white"><Store className="h-4 w-4" aria-hidden="true" /></div>
          <div>
            <p className="text-[11px] font-extrabold">Sharma Provision Store</p>
            <p className="mt-0.5 text-[8px] font-semibold text-[#d6bda9]">Open now · 0.8 km away</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-[#ffb15f]"><Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />4.8</span>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-[11px] bg-white/10 px-2.5 py-2 text-[8.5px] font-bold text-[#f5e8dc]">
        <span>Free delivery over ₹499</span>
        <span className="flex items-center gap-1 text-[#ff9a4b]"><Percent className="h-3 w-3" aria-hidden="true" />20% off</span>
      </div>
    </div>

    <section aria-label="Store categories">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-extrabold text-[#302721]">Bestsellers</h2>
        <span className="text-[9px] font-extrabold text-[#f46a16]">Sort · Popular</span>
      </div>
      <div className="mt-2.5 space-y-2">
        <ProductRow name="Toor Dal Premium" detail="1 kg · Pantry staples" price="₹148" color="bg-[#fff2dd] text-[#b86a18]" />
        <ProductRow name="Fortune Sunflower Oil" detail="1 L · Cooking essentials" price="₹136" color="bg-[#e8f5eb] text-[#228047]" />
        <ProductRow name="Britannia Bread" detail="400 g · Fresh today" price="₹45" color="bg-[#e8f1fb] text-[#3a72a8]" />
      </div>
    </section>

    <div className="flex items-center justify-between rounded-[15px] border border-[#f7d3bd] bg-[#fff5ed] px-3 py-2.5">
      <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-[#f46a16]" aria-hidden="true" /><span className="text-[10px] font-extrabold text-[#5e4534]">2 items in your cart</span></div>
      <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-[#f46a16]">View cart <ChevronRight className="h-3 w-3" aria-hidden="true" /></span>
    </div>
  </div>
);

const OrdersScreen: React.FC = () => (
  <div className="space-y-3">
    <div className="rounded-[18px] bg-[#171b1a] p-3.5 text-white shadow-[0_7px_18px_rgba(14,30,25,0.18)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#94c7b2]">Order #KC2481</p>
          <h2 className="mt-1 text-[15px] font-extrabold leading-tight text-white">On the way to you</h2>
          <p className="mt-1 text-[9px] font-semibold text-[#b5c9c0]">Arriving in 12–18 minutes</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f46a16] text-white shadow-[0_4px_12px_rgba(244,106,22,0.3)]"><Truck className="h-5 w-5" aria-hidden="true" /></div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {[{ label: 'Confirmed', active: true }, { label: 'Packing', active: true }, { label: 'Rider picked up', active: true }, { label: 'Delivered', active: false }].map((step, index) => (
          <React.Fragment key={step.label}>
            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${step.active ? 'bg-[#3dd391] text-[#10271d]' : 'border border-white/30 text-transparent'}`}>
              {step.active && <CheckCircle className="h-3 w-3" aria-hidden="true" />}
            </div>
            {index < 3 && <div className={`h-0.5 flex-1 rounded-full ${index < 2 ? 'bg-[#3dd391]' : 'bg-white/20'}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[7px] font-semibold text-[#a9beb4]"><span>Confirmed</span><span>Delivered</span></div>
    </div>

    <section aria-label="Order details">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-extrabold text-[#302721]">Your order</h2>
        <span className="rounded-md bg-[#e7f6ea] px-1.5 py-1 text-[8px] font-extrabold text-[#228047]">Paid securely</span>
      </div>
      <div className="mt-2.5 rounded-[16px] border border-[#eee6df] bg-white p-3 shadow-[0_5px_16px_rgba(75,48,26,0.07)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#fff0e6] text-[#f46a16]"><ShoppingBag className="h-5 w-5" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-extrabold text-[#302721]">Sharma Provision Store</p><p className="mt-0.5 text-[8.5px] font-semibold text-[#9a8d81]">4 items · Bengaluru</p></div>
          <span className="text-[11px] font-extrabold text-[#302721]">₹486</span>
        </div>
        <div className="my-2.5 h-px bg-[#f0e8e1]" />
        <div className="flex items-center justify-between text-[9px] font-bold text-[#75675c]"><span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#f46a16]" aria-hidden="true" />12th Main, Koramangala</span><ChevronRight className="h-3 w-3" aria-hidden="true" /></div>
      </div>
    </section>

    <div className="flex items-center gap-2 rounded-[14px] bg-[#f5f8ff] px-3 py-2.5 text-[9px] font-bold text-[#4c6382]"><CreditCard className="h-4 w-4 text-[#567fc3]" aria-hidden="true" /> Secured with UPI · Need help?</div>
  </div>
);

const screenContent: Record<ScreenId, React.ReactNode> = {
  home: <HomeScreen />,
  store: <StoreScreen />,
  orders: <OrdersScreen />,
};

const HeroPhoneMockup: React.FC = () => {
  const [activeScreen, setActiveScreen] = React.useState<ScreenId>('home');
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const timer = window.setInterval(() => {
      setActiveScreen((current) => current === 'home' ? 'store' : current === 'store' ? 'orders' : 'home');
    }, 4400);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <div
      className="hero-phone-shell"
      role="img"
      aria-label="Animated preview of the KiranaConnect app showing shopping, a local store catalogue, and order tracking"
    >
      <div className="hero-phone-screen">
        <div className="hero-phone-notch" aria-hidden="true"><span /></div>

        <div className="flex items-center justify-between px-5 pb-1 pt-7 text-[10px] font-extrabold text-[#1f1b18]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="flex h-3 items-end gap-[2px]"><i className="h-1.5 w-[3px] rounded-sm bg-[#1f1b18]" /><i className="h-2 w-[3px] rounded-sm bg-[#1f1b18]" /><i className="h-3 w-[3px] rounded-sm bg-[#1f1b18]" /></span>
            <span className="h-2.5 w-4 rounded-[3px] border border-[#1f1b18] p-[1px]"><span className="block h-full rounded-[1px] bg-[#1f1b18]" /></span>
          </div>
        </div>

        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="mb-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-[#9a8d81]">Delivering to</p>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#2d2722]"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#f46a16]" aria-hidden="true" /><span className="truncate">Koramangala, Bengaluru</span><ChevronDown className="h-3 w-3 shrink-0 text-[#887a6d]" aria-hidden="true" /></div>
            </div>
            <div className="relative rounded-full border border-[#e9e1da] bg-white p-2 shadow-[0_3px_10px_rgba(75,48,26,0.07)]"><ShoppingBag className="h-4 w-4 text-[#3e342c]" aria-hidden="true" /><span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[#f46a16] text-[7px] font-extrabold text-white">2</span></div>
          </div>
          <div className="mt-3 flex min-h-[42px] items-center gap-2 rounded-[14px] border border-[#e6ddd5] bg-white px-3 shadow-[0_4px_14px_rgba(75,48,26,0.06)]"><Search className="h-4 w-4 shrink-0 text-[#9b8e83]" aria-hidden="true" /><span className="text-[10px] font-semibold text-[#96897d]">Search products or stores</span></div>
        </div>

        <div className="hero-phone-scroll flex-1 px-4 pb-2">
          <motion.div
            key={activeScreen}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: 'easeOut' }}
            aria-hidden="true"
          >
            {screenContent[activeScreen]}
          </motion.div>
          <div className="flex items-center justify-center gap-1.5 pb-1 pt-2" aria-hidden="true">
            {(['home', 'store', 'orders'] as ScreenId[]).map((screen) => <span key={screen} className={`h-1.5 rounded-full transition-all ${screen === activeScreen ? 'w-4 bg-[#f46a16]' : 'w-1.5 bg-[#d9cec4]'}`} />)}
          </div>
        </div>

        <div className="grid h-[61px] flex-none grid-cols-4 border-t border-[#eee7e0] bg-white px-3 pb-1 pt-2">
          {bottomNavItems.map(({ label, icon: Icon, screen }) => {
            const active = screen === activeScreen;
            return <div key={label} className={`flex flex-col items-center justify-center gap-1 text-[8px] font-extrabold ${active ? 'text-[#f46a16]' : 'text-[#978c82]'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-[10px] ${active ? 'bg-[#fff0e6]' : ''}`}><Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.5 : 2} aria-hidden="true" /></span><span>{label}</span></div>;
          })}
        </div>

        <span className="sr-only">Current app screen: {screenLabels[activeScreen]}</span>
      </div>
    </div>
  );
};

export default HeroPhoneMockup;
