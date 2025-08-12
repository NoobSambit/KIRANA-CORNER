import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-lg hover:shadow-glow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-neon-orange to-neon-green text-white">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-sm">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;


