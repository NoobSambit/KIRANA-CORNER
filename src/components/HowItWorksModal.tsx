import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  LineChart,
  MapPin,
  Package,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';

export interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerStart: () => void;
  onShopkeeperStart: () => void;
}

type SectionId = 'mission' | 'customer' | 'shopkeeper' | 'revenue' | 'advantage';
type Accent = 'orange' | 'emerald';

interface NavSection {
  id: SectionId;
  label: string;
  summary: string;
  icon: LucideIcon;
  accent: Accent;
}

interface IconText {
  icon: LucideIcon;
  title: string;
  body: string;
}

const sections: NavSection[] = [
  {
    id: 'mission',
    label: 'Motto',
    summary: 'Why the product exists',
    icon: Sparkles,
    accent: 'orange',
  },
  {
    id: 'customer',
    label: 'Customers',
    summary: 'Local buying flow',
    icon: ShoppingBag,
    accent: 'orange',
  },
  {
    id: 'shopkeeper',
    label: 'Shopkeepers',
    summary: 'Digital store operations',
    icon: Store,
    accent: 'emerald',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    summary: 'Fair monetization model',
    icon: IndianRupee,
    accent: 'orange',
  },
  {
    id: 'advantage',
    label: 'Why different',
    summary: 'How this beats dark stores',
    icon: ShieldCheck,
    accent: 'emerald',
  },
];

const customerSteps: IconText[] = [
  {
    icon: MapPin,
    title: 'Discover real nearby stores',
    body: 'Customers see actual kirana shops around them, not anonymous warehouse inventory.',
  },
  {
    icon: Search,
    title: 'Shop practical essentials',
    body: 'They browse daily grocery, dairy, snacks, personal care, and household items by local availability.',
  },
  {
    icon: ShoppingBag,
    title: 'Place a trusted order',
    body: 'The order goes to a known neighborhood shop for confirmation, packing, pickup, or delivery.',
  },
];

const shopkeeperSteps: IconText[] = [
  {
    icon: Store,
    title: 'Open a digital storefront',
    body: 'The shop adds profile, timings, location, and catalog so nearby customers can find it online.',
  },
  {
    icon: Package,
    title: 'Run live inventory',
    body: 'Prices, stock status, fast movers, and substitutions stay under the shopkeeper’s control.',
  },
  {
    icon: Bell,
    title: 'Fulfill local demand',
    body: 'Orders arrive in one workflow, ready for packing, delivery assignment, or customer pickup.',
  },
];

const revenueLevers: IconText[] = [
  {
    icon: IndianRupee,
    title: 'Protect grocery margin',
    body: 'The platform should not behave like a heavy commission marketplace. Shops keep the basket margin.',
  },
  {
    icon: Truck,
    title: 'Monetize delivery locally',
    body: 'If a shop has staff or a runner, delivery becomes a paid neighborhood service instead of outsourced margin loss.',
  },
  {
    icon: BadgePercent,
    title: 'Sell curated bundles',
    body: 'Monthly ration packs, festival baskets, and school-lunch combos can lift average order value.',
  },
  {
    icon: LineChart,
    title: 'Use demand intelligence',
    body: 'Order history shows repeat items, dead stock, peak hours, and smarter replenishment signals.',
  },
];

const advantagePoints: IconText[] = [
  {
    icon: ShieldCheck,
    title: 'Ownership stays local',
    body: 'Quick commerce centralizes the customer relationship. KiranaConnect keeps the shopkeeper visible.',
  },
  {
    icon: Clock3,
    title: 'Reliability over speed theatre',
    body: 'The value is nearby, accountable fulfillment with substitutions and human judgement when needed.',
  },
  {
    icon: Users,
    title: 'Density already exists',
    body: 'Kirana shops are already close to homes. The app turns that proximity into a digital advantage.',
  },
  {
    icon: WalletCards,
    title: 'Less margin pressure',
    body: 'No central warehouse model means less dependency on blanket discounts and high operating burn.',
  },
];

const revenueModel = [
  {
    title: 'Free core listing',
    detail: 'Let small shops come online without an entry barrier.',
  },
  {
    title: 'Paid growth tools',
    detail: 'Analytics, bulk catalog editing, offers, customer notes, and priority support.',
  },
  {
    title: 'Convenience fee',
    detail: 'A transparent customer-side fee for platform operations and order convenience.',
  },
  {
    title: 'Local promotions',
    detail: 'Clearly marked visibility slots for festivals, stock clearance, and launch offers.',
  },
];

const missionPrinciples = [
  'Existing neighborhood inventory becomes searchable.',
  'Shopkeepers own pricing, availability, and customer trust.',
  'Customers get convenience without losing local accountability.',
  'Platform revenue comes from useful tools and services.',
];

const loopSteps = [
  { label: 'Discover', detail: 'Map + shop profile', icon: MapPin },
  { label: 'Order', detail: 'Cart + confirmation', icon: ShoppingBag },
  { label: 'Fulfill', detail: 'Pickup or delivery', icon: Truck },
  { label: 'Repeat', detail: 'Trust + history', icon: LineChart },
];

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onCustomerStart,
  onShopkeeperStart,
}) => {
  const [activeSection, setActiveSection] = React.useState<SectionId>('mission');

  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) setActiveSection('mission');
  }, [isOpen]);

  const activeMeta = sections.find((section) => section.id === activeSection) ?? sections[0];

  const handleCustomerStart = () => {
    onClose();
    onCustomerStart();
  };

  const handleShopkeeperStart = () => {
    onClose();
    onShopkeeperStart();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center p-2 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#050505]/86 backdrop-blur-2xl"
            onClick={onClose}
            aria-label="Close how it works modal"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 22 }}
            transition={{ type: 'spring', stiffness: 270, damping: 30 }}
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0a09] text-white shadow-[0_32px_140px_rgba(0,0,0,0.72)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),transparent_24%,transparent_72%,rgba(16,185,129,0.08))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

            <header className="relative border-b border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8 lg:py-7">
                <div className="max-w-3xl pr-11 lg:pr-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">
                    <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                    KiranaConnect operating model
                  </div>
                  <h2
                    id="how-it-works-title"
                    className="max-w-2xl text-3xl font-extrabold leading-[1.05] text-white sm:text-4xl lg:text-5xl"
                  >
                    Local commerce, rebuilt for the phone.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/66 sm:text-base">
                    A product layer for neighborhood shops: discovery for customers, order operations for shopkeepers, and a revenue model that rewards local service instead of extracting margin.
                  </p>
                </div>

                <div className="hidden rounded-[20px] border border-white/10 bg-white/[0.04] p-4 lg:block">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/40">
                      Commerce loop
                    </p>
                    <span className="rounded-full bg-emerald-400/12 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                      Local-first
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {loopSteps.map((step) => (
                      <div key={step.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <step.icon className="mb-3 h-4 w-4 text-orange-300" />
                        <p className="text-sm font-extrabold text-white">{step.label}</p>
                        <p className="mt-1 text-[12px] font-semibold leading-4 text-white/45">{step.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            <div className="relative grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[282px_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-b border-white/10 bg-black/15 p-3 scrollbar-thin lg:border-b-0 lg:border-r lg:p-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-none lg:flex-col lg:overflow-visible">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`group flex min-w-[172px] shrink-0 items-center gap-3 rounded-[18px] border p-3 text-left transition-all lg:min-w-0 ${
                          isActive
                            ? 'border-white/18 bg-white text-black shadow-[0_18px_40px_rgba(255,255,255,0.09)]'
                            : 'border-white/10 bg-white/[0.035] text-white hover:bg-white/[0.075]'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            isActive
                              ? 'bg-black text-white'
                              : section.accent === 'orange'
                                ? 'bg-orange-500/12 text-orange-300'
                                : 'bg-emerald-500/12 text-emerald-300'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold leading-5">{section.label}</span>
                          <span
                            className={`mt-0.5 block truncate text-[12px] font-semibold ${
                              isActive ? 'text-black/55' : 'text-white/40 group-hover:text-white/55'
                            }`}
                          >
                            {section.summary}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 hidden rounded-[20px] border border-white/10 bg-white/[0.035] p-4 lg:block">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/35">
                    Product thesis
                  </p>
                  <p className="mt-3 text-lg font-extrabold leading-snug text-white">
                    Local trust plus digital reach beats anonymous speed.
                  </p>
                  <div className="mt-4 h-px bg-white/10" />
                  <p className="mt-4 text-sm font-medium leading-6 text-white/50">
                    The shop remains the brand. The platform becomes the operating system.
                  </p>
                </div>
              </aside>

              <main className="min-h-0 overflow-y-auto scrollbar-thin px-5 py-6 sm:px-7 lg:px-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeSection === 'mission' && <MissionSection />}

                    {activeSection === 'customer' && (
                      <JourneySection
                        eyebrow="Customer journey"
                        title="A familiar buying flow anchored in nearby trust."
                        body="Customers do not need a new habit. They need their usual kirana store to appear at the moment they search, compare, and reorder daily essentials."
                        items={customerSteps}
                        accent={activeMeta.accent}
                      />
                    )}

                    {activeSection === 'shopkeeper' && (
                      <JourneySection
                        eyebrow="Shopkeeper workflow"
                        title="A lightweight command center for the local counter."
                        body="The shopkeeper gets online reach without adopting a warehouse operating model. Inventory, pricing, fulfillment, and customer handling stay practical."
                        items={shopkeeperSteps}
                        accent={activeMeta.accent}
                      />
                    )}

                    {activeSection === 'revenue' && <RevenueSection />}

                    {activeSection === 'advantage' && (
                      <JourneySection
                        eyebrow="Against quick commerce"
                        title="The advantage is not louder discounts. It is proximity with accountability."
                        body="Blinkit and Zepto optimize for centralized speed. KiranaConnect uses a distributed network of real shops that already sit inside residential demand."
                        items={advantagePoints}
                        accent={activeMeta.accent}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            <footer className="relative flex flex-col gap-3 border-t border-white/10 bg-[#070707]/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                <p className="max-w-xl text-sm font-medium leading-6 text-white/60">
                  Fair commerce means the platform grows when the neighborhood network grows.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
                <button
                  type="button"
                  onClick={handleCustomerStart}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-black transition-transform hover:-translate-y-0.5"
                >
                  Shop nearby
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleShopkeeperStart}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.055] px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-white/[0.09]"
                >
                  Register shop
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MissionSection: React.FC = () => (
  <section className="space-y-6">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
          What is the point?
        </p>
        <h3 className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Bring kirana stores online without turning them into anonymous suppliers.
        </h3>
        <p className="mt-4 text-sm font-medium leading-7 text-white/64">
          Customers already trust local shops for substitutions, urgent purchases, credit, and practical judgement. KiranaConnect adds discovery, catalog, ordering, and dashboard tools on top of that relationship so the neighborhood store appears before the customer defaults to warehouse-backed apps.
        </p>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-[#10100f] p-5 sm:p-6">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
          Operating principles
        </p>
        <div className="mt-5 space-y-3">
          {missionPrinciples.map((item) => (
            <div key={item} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm font-semibold leading-6 text-white/76">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      {[
        { value: 'Customer', label: 'finds nearby shops, compares essentials, and reorders locally' },
        { value: 'Shopkeeper', label: 'controls catalog, price, availability, and fulfillment' },
        { value: 'Platform', label: 'powers discovery, payments, growth tools, and demand insights' },
      ].map((item) => (
        <div key={item.value} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xl font-extrabold text-white">{item.value}</p>
          <p className="mt-2 text-sm font-medium leading-6 text-white/52">{item.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const JourneySection: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  items: IconText[];
  accent: Accent;
}> = ({ eyebrow, title, body, items, accent }) => (
  <section className="space-y-6">
    <SectionIntro eyebrow={eyebrow} title={title} body={body} accent={accent} />

    <div className="grid gap-3 lg:grid-cols-3">
      {items.slice(0, 3).map((item, index) => (
        <StepPanel key={item.title} item={item} index={index} accent={accent} />
      ))}
    </div>

    {items.length > 3 && (
      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(3).map((item) => (
          <InsightPanel key={item.title} item={item} accent={accent} />
        ))}
      </div>
    )}
  </section>
);

const RevenueSection: React.FC = () => (
  <section className="space-y-6">
    <SectionIntro
      eyebrow="Monetization design"
      title="Revenue should grow because shops sell more, not because they lose control."
      body="The model is intentionally shopkeeper-friendly at the base, then paid where the value is clear: growth tools, promotions, convenience services, and demand intelligence."
      accent="orange"
    />

    <div className="grid gap-3 md:grid-cols-2">
      {revenueLevers.map((item) => (
        <InsightPanel key={item.title} item={item} accent="orange" />
      ))}
    </div>

    <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-lg font-extrabold text-white">Application revenue model</h4>
          <p className="text-sm font-medium text-white/50">Simple, transparent, and realistic for small stores.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {revenueModel.map((item, index) => (
          <div key={item.title} className="rounded-[18px] border border-white/10 bg-black/[0.24] p-4">
            <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-black">
              {index + 1}
            </div>
            <h5 className="text-sm font-extrabold text-white">{item.title}</h5>
            <p className="mt-2 text-sm font-medium leading-6 text-white/55">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SectionIntro: React.FC<{
  eyebrow: string;
  title: string;
  body: string;
  accent: Accent;
}> = ({ eyebrow, title, body, accent }) => (
  <div>
    <p
      className={`text-[12px] font-extrabold uppercase tracking-[0.18em] ${
        accent === 'orange' ? 'text-orange-300' : 'text-emerald-300'
      }`}
    >
      {eyebrow}
    </p>
    <h3 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl">
      {title}
    </h3>
    <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-white/64">{body}</p>
  </div>
);

const StepPanel: React.FC<{ item: IconText; index: number; accent: Accent }> = ({ item, index, accent }) => (
  <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
    <div className="absolute right-5 top-4 text-4xl font-black text-white/[0.055]">
      0{index + 1}
    </div>
    <div
      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
        accent === 'orange' ? 'bg-orange-500/12 text-orange-300' : 'bg-emerald-500/12 text-emerald-300'
      }`}
    >
      <item.icon className="h-6 w-6" />
    </div>
    <h4 className="max-w-[13rem] text-lg font-extrabold leading-snug text-white">{item.title}</h4>
    <p className="mt-3 text-sm font-medium leading-6 text-white/55">{item.body}</p>
  </div>
);

const InsightPanel: React.FC<{ item: IconText; accent: Accent }> = ({ item, accent }) => (
  <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
    <div
      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
        accent === 'orange' ? 'bg-orange-500/12 text-orange-300' : 'bg-emerald-500/12 text-emerald-300'
      }`}
    >
      <item.icon className="h-5 w-5" />
    </div>
    <h4 className="text-base font-extrabold text-white">{item.title}</h4>
    <p className="mt-2 text-sm font-medium leading-6 text-white/55">{item.body}</p>
  </div>
);

export default HowItWorksModal;
