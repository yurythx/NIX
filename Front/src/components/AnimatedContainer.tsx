'use client';

import { motion } from 'framer-motion';

export const AnimatedContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-4xl mx-auto"
    >
      {children}
    </motion.div>
  );
};
