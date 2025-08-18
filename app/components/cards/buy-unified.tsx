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
  const { transfer, resetTransfer, setTransfer } = useTransferStore();
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
        orderStep === OrderStep.GotTransfer ||
        orderStep === OrderStep.WaitingForPayment),
    refetchInterval: 3000,
  });

  useEffect(() => {
    // Prefer polled status; fall back to stored transfer status if polling unavailable
    const statusFromPoll = transferStatus?.status as string | undefined;
    const effectiveStatus =
      statusFromPoll || (transfer?.transferStatus as string | undefined);

    if (!isLoading && effectiveStatus) {
      // Keep the latest polled transfer fields in store so UI has fresh details (when available)
      try {
        if (transferStatus) {
          setTransfer({
            transferId: transfer?.transferId || "",
            transferStatus: transferStatus.status,
            transferAddress: transferStatus.transferAddress,
            userActionDetails: transferStatus.userActionDetails,
          });
        }
      } catch {}

      const isComplete =
        effectiveStatus === TransferStatusEnum.TransferComplete ||
        effectiveStatus === "TransferCompleted" ||
        effectiveStatus === "TransferComplete";

      const isFailed =
        effectiveStatus === TransferStatusEnum.TransferFailed ||
        effectiveStatus === "TransferFailed";

      if (isComplete) {
        setAnimationPhase("transition");
        setTimeout(() => {
          setCurrentState("success");
          setAnimationPhase("final");
        }, 500);
      }

      if (isFailed) {
        setAnimationPhase("transition");
        setTimeout(() => {
          setCurrentState("failed");
          setAnimationPhase("final");
        }, 500);
      }
    }
  }, [
    transferStatus?.status,
    transferStatus?.transferAddress,
    transferStatus?.userActionDetails,
    transfer?.transferStatus,
    isLoading,
    quote?.country,
    setTransfer,
    transfer?.transferId,
  ]);

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
      onConfirmPaid={() => {
        // For Nigeria manual bank payment, let user declare they've paid
        // Advance to WaitingForPayment so polling continues while UI updates
        useUserSelectionStore.getState().updateSelection({
          orderStep: OrderStep.WaitingForPayment,
        });
        // Keep the modal open: do not reset quote/transfer here
      }}
    />
  );
};

export default BuyUnified;
