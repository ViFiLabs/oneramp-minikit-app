"use client";

import { ModalConnectButton } from "@/components/modal-connect-button";
import Image from "next/image";
import { Header } from "./components/Header";
import { SwapBuyTabs } from "./components/SwapBuyTabs";
import StateContextProvider from "./providers/StateContextProvider";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

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
        <div className="flex flex-col md:grid md:grid-cols-3 h-full min-h-screen">
          {/* Left section - Logo */}
          <div className="hidden md:flex p-4">
            <Header logoOnly />
          </div>

          {/* Mobile header - Only shown on mobile */}
          <div className="w-full flex justify-between items-center px-4 py-2 h-14 md:hidden">
            <Image
              src="/large.png"
              alt="OneRamp"
              width={80}
              height={32}
              priority
              className="rounded-full"
            />
            <div className="flex flex-1" />
            {/* <ConnectButton /> */}
            <ModalConnectButton />
          </div>

          {/* Center section - Main content */}
          <div className="flex flex-col items-center justify-start w-full pt-6 pb-2 md:pt-16">
            <StateContextProvider />
            <SwapBuyTabs />
          </div>

          {/* Right section */}
          <div className="hidden md:flex relative">
            <div className="w-full flex flex-row justify-between py-6 px-4">
              <div className="flex flex-1" />
              <div className="flex flex-1">
                <Header />
              </div>

              {/* <ActionButtonList /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
