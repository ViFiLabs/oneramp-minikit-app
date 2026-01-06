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
  const [addMiniAppAttempted, setAddMiniAppAttempted] = useState(false);
  const { setFrameReady, isFrameReady } = useMiniKit();

  const { showKYCModal, kycLink } = useKYCStore();

  useUserSelectionStore();

  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        setIsSDKLoaded(true);

        // Check if we're in a miniapp environment before prompting to add
        const isInMini = await sdk.isInMiniApp();

        if (isInMini && !addMiniAppAttempted) {
          try {
            await sdk.actions.addMiniApp();
            setAddMiniAppAttempted(true);
          } catch (error: any) {
            // Handle specific errors from addMiniApp
            if (error?.name === "RejectedByUser") {
              // User rejected the request - this is fine, don't show error
              console.log("User chose not to add the mini app");
              setAddMiniAppAttempted(true); // Don't prompt again
            } else if (error?.name === "InvalidDomainManifestJson") {
              // Domain doesn't match manifest - log for debugging
              console.warn(
                "Cannot add mini app: Domain mismatch or invalid manifest.",
                "Make sure you're using the production domain that matches your farcaster.json"
              );
              setAddMiniAppAttempted(true); // Don't keep trying
            } else {
              // Other errors - log but don't block the app
              console.warn("Error adding mini app:", error);
              setAddMiniAppAttempted(true); // Don't keep trying
            }
          }
        }
      } catch (error) {
        console.error("Error initializing SDK:", error);
        setIsSDKLoaded(true); // Still mark as loaded to prevent infinite retries
      }
    };

    if (sdk && !isSDKLoaded) {
      load();
    }
  }, [isSDKLoaded, addMiniAppAttempted]);

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
