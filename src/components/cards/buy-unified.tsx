"use client";

import { getTransferStatus } from "@/src/actions/transfer";
import {
  useProcessingSession,
  clearProcessingSession,
} from "@/src/hooks/useProcessingSession";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { OrderStep, TransferStatusEnum, TransferType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BuyStatusCard from "@/src/components/cards/buy-status-card";

const BuyUnified = () => {
  const { resetToDefault, orderStep } = useUserSelectionStore();
  const { transfer, resetTransfer, setTransfer } = useTransferStore();
  const sessionStartTime = useProcessingSession(transfer?.transferId);
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

  const previousTransferIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (
      transfer?.transferId &&
      previousTransferIdRef.current !== transfer.transferId
    ) {
      previousTransferIdRef.current = transfer.transferId;
      setCurrentState("processing");
      setAnimationPhase("initial");
    }
  }, [transfer?.transferId]);

  useEffect(() => {
    // Prefer polled status; fall back to stored transfer status if polling unavailable
    const statusFromPoll = transferStatus?.status as string | undefined;
    const hasPolledStatus = typeof statusFromPoll === "string";
    const effectiveStatus =
      (hasPolledStatus ? statusFromPoll : undefined) ||
      (transfer?.transferStatus as string | undefined);

    if (!isLoading && effectiveStatus) {
      // Keep the latest polled transfer fields in store so UI has fresh details (when available)
      // Only update when we have complete userActionDetails to prevent flashing
      try {
        if (
          transferStatus &&
          transferStatus.userActionDetails?.accountName &&
          transferStatus.userActionDetails?.accountNumber
        ) {
          setTransfer({
            transferId: transfer?.transferId || "",
            transferStatus: transferStatus.status,
            transferAddress: transferStatus.transferAddress,
            userActionDetails: transferStatus.userActionDetails,
          });
        }
      } catch {}

      const isComplete =
        hasPolledStatus &&
        (statusFromPoll === TransferStatusEnum.TransferComplete ||
          statusFromPoll === "TransferCompleted" ||
          statusFromPoll === "TransferComplete");

      const isFailed =
        hasPolledStatus &&
        (statusFromPoll === TransferStatusEnum.TransferFailed ||
          statusFromPoll === "TransferFailed");

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
    transferStatus,
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
    clearProcessingSession(transfer?.transferId);
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  const handleTryAgain = () => {
    clearProcessingSession(transfer?.transferId);
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
      <>
        <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm" />
        <div className="fixed inset-0 z-[51] flex items-end justify-center">
          <div className="bg-gray-900 rounded-t-3xl max-w-md w-full max-h-[50vh] p-6 flex items-center justify-center">
            <p className="text-white text-center">Loading purchase details...</p>
          </div>
        </div>
      </>
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
      sessionStartTime={sessionStartTime}
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
