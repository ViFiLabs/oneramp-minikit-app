"use client";

import { assets } from "@/data/currencies";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { ChainTypes, OrderStep } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import SuccessCard from "./success-card";

const OrderSuccessful = () => {
  const [exploreUrl, setExploreUrl] = useState<string>("");
  const { updateSelection, orderStep, resetToDefault } =
    useUserSelectionStore();
  const { quote } = useQuoteStore();
  const { width, height } = useWindowSize();
  const { resetQuote } = useQuoteStore();
  const { resetTransfer, transactionHash } = useTransferStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const { currentNetwork } = useNetworkStore();

  const router = useRouter();

  useEffect(() => {
    // Stop confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(confettiTimer);
  }, []);

  useEffect(() => {
    if (orderStep !== OrderStep.PaymentCompleted) {
      setTimeout(() => {
        updateSelection({ orderStep: OrderStep.PaymentCompleted });
      }, 5000);
    }
  }, [orderStep]);

  useEffect(() => {
    if (transactionHash) {
      if (currentNetwork?.type === ChainTypes.EVM) {
        setExploreUrl(
          currentNetwork?.blockExplorers?.default.url + "/tx/" + transactionHash
        );
      } 
    }
  }, [transactionHash, currentNetwork]);

  const handleBackClick = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();

    updateSelection({ asset: assets[0] });

    router.refresh();
  };

  const handleGetReceipt = () => {
    // TODO: Implement receipt generation
    console.log("Get receipt clicked");
  };

  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex-col md:flex-row flex py-20  justify-center bg-black gap-x-16">
      {orderStep === OrderStep.PaymentCompleted && showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <SuccessCard
        transactionHash={transactionHash || undefined}
        exploreUrl={exploreUrl}
        quote={quote}
        onNewPayment={handleBackClick}
        onGetReceipt={handleGetReceipt}
      />
    </div>
  );
};

export default OrderSuccessful;
