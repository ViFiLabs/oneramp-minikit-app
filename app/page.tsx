"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { HeroText } from "./components/HeroText";
import { SwapBuyTabs } from "./components/SwapBuyTabs";
import StateContextProvider from "./providers/StateContextProvider";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    const load = async () => {
      await sdk.actions.ready();
      setIsSDKLoaded(true);
    };

    if (sdk && !isSDKLoaded) {
      load();
    }
  }, [isSDKLoaded]);

  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="min-h-screen w-full">
      <div className="h-full min-h-screen">
        {/* Main content - centered with top padding to account for fixed navbar */}
        <div className="flex flex-col items-center justify-start w-full pt-6 pb-2 md:pt-16">
          <StateContextProvider />
          <HeroText />
          <SwapBuyTabs />
        </div>
      </div>
      {/* Floating support button */}
      <a
        href="https://t.me/+Hnr5eySeSoMyOTM0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50"
        aria-label="Open Telegram Support"
      >
        <Button className="rounded-full w-16 h-16 p-0 !bg-[#229ED9] hover:bg-[#1d8fc5] text-white shadow-xl shadow-[#229ED9]/30 ring-2 ring-white/30">
          <HelpCircle className="w-9 h-9" />
        </Button>
      </a>
    </div>
  );
}
