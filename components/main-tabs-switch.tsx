"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapPanel } from "@/app/components/SwapPanel";
import { BuyPanel } from "@/app/components/BuyPanel";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { AnimatePresence, motion } from "framer-motion";

export function MainTabsSwitch() {
  const { updateSelection, country } = useUserSelectionStore();
  const { setAmount } = useAmountStore();

  const washTheseFields = (goingToBuy: boolean) => {
    updateSelection({
      country: undefined,
      asset: undefined,
      accountNumber: undefined,
      accountName: undefined,
      institution: undefined,
      pastedAddress: undefined,
    });

    if (goingToBuy) {
      setAmount("1");
    }
  };

  return (
    <Tabs defaultValue="Swap" className="w-full md:w-[500px]">
      <TabsList className="grid w-[250px] mx-auto grid-cols-2 p-1 bg-transparent rounded-full mb-2 h-12">
        <TabsTrigger
          value="Swap"
          onClick={() => washTheseFields(false)}
          className="data-[state=active]:!bg-neutral-800 text-sm data-[state=active]:!text-white data-[state=active]:font-bold text-neutral-400 rounded-full transition-all"
        >
          Swap
        </TabsTrigger>
        <TabsTrigger
          value="Buy"
          onClick={() => washTheseFields(true)}
          className="data-[state=active]:!bg-neutral-800 text-sm data-[state=active]:!text-white data-[state=active]:font-bold text-neutral-400 rounded-full transition-all"
        >
          Buy
        </TabsTrigger>
      </TabsList>
      <TabsContent value="Swap" className="w-full">
        <SwapPanel />
      </TabsContent>
      <TabsContent value="Buy" className="w-full">
        <BuyPanel />
      </TabsContent>
      
      {/* Descriptive text that animates out when country is selected */}
      <AnimatePresence>
        {!country && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              y: -20,
              transition: { 
                duration: 0.5, 
                ease: "easeOut"
              }
            }}    
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              delay: 0.2
            }}
            className="text-center mt-6 px-4"
          >
            <p className="text-sm md:text-base text-neutral-400 font-light">
              Pay with crypto. Buy and sell instantly <br className="hidden sm:block" />
              on Base and other supported chains.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Tabs>
  );
}

export default MainTabsSwitch;
