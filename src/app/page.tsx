"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { HeroText } from "@/src/components/HeroText";
import { PanelTabs } from "@/src/app/PanelTabs";
import StateContextProvider from "./providers/StateContextProvider";
import { Button } from "@/src/components/ui/button";
import { HelpCircle } from "lucide-react";
import { KYCVerificationModal } from "../components/modals/KYCVerificationModal";
import { useKYCStore } from "../store/kyc-store";
import { useUserSelectionStore } from "../store/user-selection";

export default function Home() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const { setFrameReady, isFrameReady } = useMiniKit();

  const { showKYCModal, kycLink } = useKYCStore();

  useUserSelectionStore();

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
      <StateContextProvider />

      <KYCVerificationModal open={showKYCModal} kycLink={kycLink} />
      <div className="h-full min-h-screen">
        {/* Main content - centered with top padding to account for fixed navbar */}
        <div className="flex flex-col items-center justify-start w-full pt-6 pb-2 md:pt-16">
          <HeroText />
          <PanelTabs />
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
