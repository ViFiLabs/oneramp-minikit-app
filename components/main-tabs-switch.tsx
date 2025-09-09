"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapPanel } from "@/app/components/SwapPanel";
import { BuyPanel } from "@/app/components/BuyPanel";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { AnimatePresence, motion } from "framer-motion";
// import { countries } from "@/data/countries";
import { PayPanel } from "@/app/components/PayPanel";
import { useEffect, useState } from "react";

export function MainTabsSwitch() {
  const { updateSelection, country } = useUserSelectionStore();
  const { setAmount } = useAmountStore();
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const washTheseFields = (goingToBuy: boolean, onPayPanel: boolean) => {
    console.log("====================================");
    console.log("SWITCHED");
    console.log("====================================");
    updateSelection({
      // country: onPayPanel
      //   ? countries.find((c) => c.name === "Kenya")
      //   : undefined,
      country: undefined,
      asset: undefined,
      accountNumber: undefined,
      accountName: undefined,
      institution: undefined,
      pastedAddress: undefined,
      isPayout: onPayPanel ? true : false,
      countryPanelOnTop: onPayPanel ? true : false,
    });

    if (goingToBuy) {
      setAmount("1");
    }
  };

  // Show loading state during hydration
  if (!hasMounted) {
    return (
      <div className="w-full">
        <div className="grid bg-neutral-700/80 w-full sm:max-w-xs sm:mx-auto grid-cols-3 p-1 rounded-t-full h-12 animate-pulse" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="Pay" className="w-full ">
      <div className="w-full max-w-md mx-auto">
        <TabsList className="inline-flex bg-black w-fit p-1 h-12 gap-4">
          <TabsTrigger
            value="Pay"
          onClick={() => washTheseFields(false, true)}
          className="data-[state=active]:!bg-neutral-600 data-[state=active]:!text-white text-sm data-[state=active]:font-semibold text-neutral-300 rounded-2xl transition-all"
        >
          Pay
        </TabsTrigger>
        <TabsTrigger
          value="Withdraw"
          onClick={() => washTheseFields(false, false)}
          className="data-[state=active]:!bg-neutral-600 data-[state=active]:!text-white text-sm data-[state=active]:font-semibold text-neutral-300 rounded-full transition-all"
        >
          Withdraw
        </TabsTrigger>
        <TabsTrigger
          value="Deposit"
          onClick={() => washTheseFields(true, false)}
          className="data-[state=active]:!bg-neutral-600 data-[state=active]:!text-white text-sm data-[state=active]:font-semibold text-neutral-300 rounded-full transition-all"
        >
          Deposit
        </TabsTrigger>
      </TabsList>
      </div>
      <TabsContent value="Pay" className="w-full">
        <PayPanel />
      </TabsContent>
      <TabsContent value="Withdraw" className="w-full">
        <SwapPanel />
      </TabsContent>
      <TabsContent value="Deposit" className="w-full">
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
                ease: "easeOut",
              },
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: 0.2,
            }}
            className="w-full max-w-md mx-auto text-center mt-6 px-4 py-4 bg-black rounded-lg"
          >
            <p className="text-base md:text-lg text-white font-light">
              Pay with crypto. Buy and sell instantly{" "}
              <br className="hidden sm:block" />
              on Base and other supported chains.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Tabs>
  );
}

export default MainTabsSwitch;
