"use client";

import { getTransferStatus } from "@/actions/transfer";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep, TransferStatusEnum, TransferType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BuyStatusCard from "@/app/components/cards/buy-status-card";

const BuyUnified = () => {
  const { resetToDefault, orderStep } = useUserSelectionStore();
  const { transfer, resetTransfer } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();

  const [currentState, setCurrentState] = useState<
    "processing" | "success" | "failed"
  >("processing");
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "transition" | "final"
  >("initial");

  // Poll transfer status for buy (no blockchain flow)
  const { data: transferStatus, isLoading } = useQuery({
    queryKey: ["transferStatus", transfer?.transferId],
    queryFn: () => {
      if (!transfer?.transferId) {
        throw new Error("Transfer ID is required");
      }
      return getTransferStatus(transfer.transferId);
    },
    enabled:
      !!transfer?.transferId &&
      (orderStep === OrderStep.ProcessingPayment ||
        orderStep === OrderStep.GotTransfer),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (
      transferStatus?.status === TransferStatusEnum.TransferComplete &&
      !isLoading
    ) {
      setAnimationPhase("transition");
      setTimeout(() => {
        setCurrentState("success");
        setAnimationPhase("final");
      }, 500);
    }

    if (
      transferStatus?.status === TransferStatusEnum.TransferFailed &&
      !isLoading
    ) {
      setAnimationPhase("transition");
      setTimeout(() => {
        setCurrentState("failed");
        setAnimationPhase("final");
      }, 500);
    }
  }, [transferStatus?.status, isLoading]);

  useEffect(() => {
    if (orderStep === OrderStep.PaymentFailed) {
      setAnimationPhase("transition");
      setTimeout(() => {
        setCurrentState("failed");
        setAnimationPhase("final");
      }, 500);
    }
  }, [orderStep]);

  const handleDone = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  const handleTryAgain = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  if (!quote || quote.transferType !== TransferType.TransferIn) {
    return null;
  }

  if (!quote.network) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p>Loading purchase details...</p>
        </div>
      </div>
    );
  }

  const isProcessing =
    currentState === "processing" || animationPhase === "transition";
  const isFailed = currentState === "failed" && animationPhase === "final";
  const isSuccess = currentState === "success" && animationPhase === "final";

  return (
    <BuyStatusCard
      quote={quote}
      transfer={transfer || undefined}
      isProcessing={isProcessing}
      isFailed={isFailed}
      isSuccess={isSuccess}
      onDone={isFailed ? handleTryAgain : handleDone}
      animationPhase={animationPhase}
    />
  );
};

export default BuyUnified;
