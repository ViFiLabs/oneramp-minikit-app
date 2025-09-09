"use client";

import MainTabsSwitch from "@/app/components/main-tabs-switch";
import { useUserSelectionStore } from "@/store/user-selection";
import { motion } from "framer-motion";

export function SwapBuyTabs() {
  const { country } = useUserSelectionStore();

  return (
    <motion.div
      initial={{ y: 0, opacity: 0.7 }}
      animate={{ 
        y: country ? -5 : 0,
        opacity: country ? 1 : 0.7
      }}
      transition={{ 
        duration: 0.8, 
        ease: "easeInOut",
        delay: country ? 0.2 : 0 // Slight delay when country is selected for smoother coordination
      }}
      className="flex flex-col items-center w-full max-w-full px-4 md:px-0"
    >
      <MainTabsSwitch />
    </motion.div>
  );
}