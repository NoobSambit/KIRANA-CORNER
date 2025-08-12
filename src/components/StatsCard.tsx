import React from 'react';
import { motion, useInView } from 'framer-motion';

interface StatsCardProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, value, suffix = '+', label }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 1200;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-lg text-center"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-tr from-neon-orange to-neon-green text-white flex items-center justify-center">
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
        {display.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-600 dark:text-slate-300">{label}</div>
    </motion.div>
  );
};

export default StatsCard;


