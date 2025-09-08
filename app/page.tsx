"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { HeroText } from "./components/HeroText";
import { SwapBuyTabs } from "./components/SwapBuyTabs";
import StateContextProvider from "./providers/StateContextProvider";

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
    </div>
  );
}
