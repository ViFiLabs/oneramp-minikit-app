"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SwapPanel } from "@/app/components/SwapPanel";
import { BuyPanel } from "@/app/components/BuyPanel";
import { useUserSelectionStore } from "@/store/user-selection";

export function MainTabsSwitch() {
  const { updateSelection } = useUserSelectionStore();

  const washTheseFields = () => {
    updateSelection({
      country: undefined,
      asset: undefined,
      accountNumber: undefined,
      accountName: undefined,
      institution: undefined,
      pastedAddress: undefined,
    });
  };

  return (
    <Tabs defaultValue="Swap" className="w-full md:w-[500px]">
      <TabsList className="grid w-[250px] mx-auto grid-cols-2 p-1 bg-transparent rounded-full mb-2 h-12">
        <TabsTrigger
          value="Swap"
          onClick={washTheseFields}
          className="data-[state=active]:!bg-neutral-800 text-sm data-[state=active]:!text-white data-[state=active]:font-bold text-neutral-400 rounded-full transition-all"
        >
          Swap
        </TabsTrigger>
        <TabsTrigger
          value="Buy"
          onClick={washTheseFields}
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
    </Tabs>
  );
}

export default MainTabsSwitch;
