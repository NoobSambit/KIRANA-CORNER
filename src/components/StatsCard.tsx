import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label }) => {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart);

        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#2A2F38] overflow-hidden"
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl" />
      
      {/* Content container */}
      <div className="relative bg-[#161B22] rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icon container - Mobile Optimized */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <div className="text-white">
              {icon}
            </div>
          </div>
          
          {/* Stats content - Mobile Optimized */}
          <div className="flex-1 min-w-0">
            {/* Number with gradient text - Mobile Optimized */}
            <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1">
              <span className="bg-gradient-to-r from-green-400 to-orange-500 bg-clip-text text-transparent">
                {count.toLocaleString()}
              </span>
              {label.includes('+') && <span className="text-[#F5F5F5]">+</span>}
            </div>
            
            {/* Label - Mobile Optimized */}
            <p className="text-xs sm:text-sm md:text-base text-[#CCCCCC] font-medium">
              {label}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative elements - Mobile Optimized */}
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500/10 to-orange-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500/10 to-green-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
    </motion.div>
  );
};

export default StatsCard;


