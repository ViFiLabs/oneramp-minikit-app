"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapPanel } from "@/app/components/SwapPanel";
import { BuyPanel } from "@/app/components/BuyPanel";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { countries } from "@/data/countries";
import { PayPanel } from "@/app/components/PayPanel";
import { useEffect, useState } from "react";

export function MainTabsSwitch() {
  const { updateSelection } = useUserSelectionStore();
  const { setAmount } = useAmountStore();
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const washTheseFields = (goingToBuy: boolean, onPayPanel: boolean) => {
    updateSelection({
      country: onPayPanel
        ? countries.find((c) => c.name === "Kenya")
        : undefined,
      asset: undefined,
      accountNumber: undefined,
      accountName: undefined,
      institution: undefined,
      pastedAddress: undefined,
      isPayout: onPayPanel ? true : false,
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
      <TabsList className="grid bg-neutral-700/80 w-full sm:max-w-xs sm:mx-auto grid-cols-3 p-1 rounded-t-full h-12">
        <TabsTrigger
          value="Pay"
          onClick={() => washTheseFields(false, true)}
          className="data-[state=active]:!bg-neutral-600 data-[state=active]:!text-white text-sm data-[state=active]:font-semibold text-neutral-300 rounded-full transition-all"
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
      <TabsContent value="Pay" className="w-full">
        <PayPanel />
      </TabsContent>
      <TabsContent value="Withdraw" className="w-full">
        <SwapPanel />
      </TabsContent>
      <TabsContent value="Deposit" className="w-full">
        <BuyPanel />
      </TabsContent>
    </Tabs>
  );
}

export default MainTabsSwitch;
