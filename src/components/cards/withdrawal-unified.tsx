"use client";

import {
  submitTransactionHash,
  getTransferStatus,
} from "@/src/actions/transfer";
import {
  useProcessingSession,
  clearProcessingSession,
} from "@/src/hooks/useProcessingSession";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import {
  OrderStep,
  TransferStatusEnum,
  TransferType,
  SubmitTransactionHashRequest,
} from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import WithdrawalStatusCard from "./withdrawal-status-card";

const WithdrawalUnified = () => {
  const { resetToDefault, updateSelection, orderStep } =
    useUserSelectionStore();
  const { transfer, resetTransfer, transactionHash, setTransfer } =
    useTransferStore();
  const sessionStartTime = useProcessingSession(transfer?.transferId);
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();
  const hashSubmittedRef = useRef(false);
  const transactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local state for managing animation states
  const [currentState, setCurrentState] = useState<
    "processing" | "success" | "failed"
  >("processing");
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "transition" | "final"
  >("initial");

  // Debug logs
  useEffect(() => {
    console.log("WithdrawalUnified - Current state:", {
      orderStep,
      hasTransactionHash: !!transactionHash,
      hasTransfer: !!transfer,
      transferId: transfer?.transferId,
      currentState,
      animationPhase,
      isEVMTransactionFailed: orderStep === OrderStep.PaymentFailed,
    });
  }, [orderStep, transactionHash, transfer, currentState, animationPhase]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
    };
  }, []);

  // Reset submitted flag when transaction hash changes
  useEffect(() => {
    if (transactionHash) {
      hashSubmittedRef.current = false;
      // Clear any existing timeout when transaction hash is received
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
    }
  }, [transactionHash]);

  // Add timeout for transaction signing - if user doesn't sign within 2 minutes, show failure
  useEffect(() => {
    if (
      orderStep === OrderStep.ProcessingPayment &&
      !transactionHash &&
      transfer?.transferId
    ) {
      console.log("Starting transaction timeout timer...");

      // Set timeout for 2 minutes (120 seconds)
      transactionTimeoutRef.current = setTimeout(() => {
        console.log(
          "Transaction timeout - user likely didn't sign the transaction",
        );
        // Animate to failed state
        setAnimationPhase("transition");
        setTimeout(() => {
          setCurrentState("failed");
          setAnimationPhase("final");
        }, 500);
      }, 120000); // 2 minutes

      return () => {
        if (transactionTimeoutRef.current) {
          clearTimeout(transactionTimeoutRef.current);
          transactionTimeoutRef.current = null;
        }
      };
    }
  }, [orderStep, transactionHash, transfer?.transferId]);

  // Submit transaction hash mutation
  const submitTxHashMutation = useMutation({
    mutationKey: ["submit-tx-hash-withdrawal"],
    mutationFn: (payload: SubmitTransactionHashRequest) =>
      submitTransactionHash(payload),
    onSuccess: () => {
      console.log("Withdrawal transaction hash submitted successfully");
      hashSubmittedRef.current = true;
      // Transition to regular transfer status polling
      updateSelection({ orderStep: OrderStep.GotTransfer });
    },
    onError: (error) => {
      console.error("Error submitting withdrawal transaction hash:", error);
      // Animate to failed state
      setAnimationPhase("transition");
      setTimeout(() => {
        setCurrentState("failed");
        setAnimationPhase("final");
      }, 500);
    },
  });

  // Submit hash on component mount - only for ProcessingPayment step
  useEffect(() => {
    if (
      orderStep === OrderStep.ProcessingPayment &&
      transfer?.transferId &&
      transactionHash &&
      !submitTxHashMutation.isPending &&
      !hashSubmittedRef.current
    ) {
      console.log("Submitting withdrawal transaction hash:", {
        transferId: transfer.transferId,
        txHash: transactionHash,
      });

      // Wait 2 seconds before submitting
      const timer = setTimeout(() => {
        if (
          !hashSubmittedRef.current &&
          transfer?.transferId &&
          transactionHash
        ) {
          submitTxHashMutation.mutate({
            transferId: transfer.transferId,
            txHash: transactionHash,
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    orderStep,
    transfer?.transferId,
    transactionHash,
    submitTxHashMutation.isPending,
  ]);

  // Monitor transfer status - only start polling after hash submission OR if we're already in GotTransfer step
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
      (submitTxHashMutation.isSuccess || orderStep === OrderStep.GotTransfer),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Handle transfer status changes with animations (with fallback to store status and string variants)
  useEffect(() => {
    const statusFromPoll = transferStatus?.status as string | undefined;
    const effectiveStatus =
      statusFromPoll || (transfer?.transferStatus as string | undefined);

    if (!isLoading && effectiveStatus) {
      // Sync latest polled fields into store when available
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
    setTransfer,
    transfer?.transferId,
  ]);

  // Handle EVM transaction failures by monitoring orderStep changes
  useEffect(() => {
    if (orderStep === OrderStep.PaymentFailed) {
      console.log("EVM transaction failed - transitioning to failed state");
      // Clear any existing timeout since the transaction definitively failed
      if (transactionTimeoutRef.current) {
        clearTimeout(transactionTimeoutRef.current);
        transactionTimeoutRef.current = null;
      }
      // Animate to failed state
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

  // Only render this component for withdrawal (TransferOut) transactions
  if (!quote || quote.transferType !== TransferType.TransferOut) {
    return null;
  }

  // Handle case where we're in ProcessingPayment but don't have transaction hash yet
  if (orderStep === OrderStep.ProcessingPayment && !transactionHash) {
    console.log("Waiting for transaction hash...");
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p>Waiting for blockchain transaction...</p>
        </div>
      </div>
    );
  }

  // Handle case where quote data is invalid (but not for PaymentFailed state)
  if (!quote.network && orderStep !== OrderStep.PaymentFailed) {
    console.error("Invalid quote structure for withdrawal:", { quote });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p>Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  // Determine the current state for the UI
  const isProcessing =
    currentState === "processing" || animationPhase === "transition";
  const isFailed = currentState === "failed" && animationPhase === "final";
  const isSuccess = currentState === "success" && animationPhase === "final";

  return (
    <WithdrawalStatusCard
      quote={quote}
      transfer={transfer || undefined}
      isProcessing={isProcessing}
      isFailed={isFailed}
      isSuccess={isSuccess}
      onDone={isFailed ? handleTryAgain : handleDone}
      animationPhase={animationPhase}
      sessionStartTime={sessionStartTime}
    />
  );
};

export default WithdrawalUnified;
