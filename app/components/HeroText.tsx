"use client";

import { useUserSelectionStore } from "@/store/user-selection";
import { AnimatePresence, motion } from "framer-motion";

export function HeroText() {
  const { country } = useUserSelectionStore();

  return (
    <AnimatePresence>
      {!country && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ 
            opacity: 0, 
            y: -100,
            transition: { 
              duration: 0.6, 
              ease: "easeIn",
              opacity: { duration: 0.4 }
            }
          }}    
          transition={{ 
            duration: 0.6, 
            ease: "easeOut"
          }}
          className="text-center mb-8 px-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          Buy and Sell Crypto Instantly
          </h1>
          <p className="text-lg md:text-2xl text-neutral-300 font-light italic">
          Anytime, Anywhere
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 