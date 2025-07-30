"use client";

import { submitTransactionHash, getTransferStatus } from "@/actions/transfer";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep, TransferStatusEnum, TransferType } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import WithdrawalStatusCard from "./withdrawal-status-card";

const WithdrawalOrderProcessing = () => {
  const { resetToDefault, updateSelection, orderStep } = useUserSelectionStore();
  const { transfer, resetTransfer, transactionHash } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();
  const hashSubmittedRef = useRef(false);

  // Debug logs
  useEffect(() => {
    console.log("WithdrawalOrderProcessing - Current state:", {
      orderStep,
      hasTransactionHash: !!transactionHash,
      hasTransfer: !!transfer,
      transferId: transfer?.transferId,
    });
  }, [orderStep, transactionHash, transfer]);

  // Reset submitted flag when transaction hash changes
  useEffect(() => {
    if (transactionHash) {
      hashSubmittedRef.current = false;
    }
  }, [transactionHash]);

  // Submit transaction hash mutation
  const submitTxHashMutation = useMutation({
    mutationKey: ["submit-tx-hash-withdrawal"],
    mutationFn: submitTransactionHash,
    onSuccess: () => {
      console.log("Withdrawal transaction hash submitted successfully");
      hashSubmittedRef.current = true;
      // Transition to regular transfer status polling
      updateSelection({ orderStep: OrderStep.GotTransfer });
    },
    onError: (error) => {
      console.error("Error submitting withdrawal transaction hash:", error);
      updateSelection({ orderStep: OrderStep.PaymentFailed });
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
        if (!hashSubmittedRef.current && transfer?.transferId && transactionHash) {
          submitTxHashMutation.mutate({
            transferId: transfer.transferId,
            txHash: transactionHash,
          });
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [orderStep, transfer?.transferId, transactionHash, submitTxHashMutation.isPending]);

  // Monitor transfer status - only start polling after hash submission OR if we're already in GotTransfer step
  const { data: transferStatus, isLoading } = useQuery({
    queryKey: ["transferStatus", transfer?.transferId],
    queryFn: () => {
      if (!transfer?.transferId) {
        throw new Error("Transfer ID is required");
      }
      return getTransferStatus(transfer.transferId);
    },
    enabled: !!transfer?.transferId && (submitTxHashMutation.isSuccess || orderStep === OrderStep.GotTransfer),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (
      transferStatus?.status === TransferStatusEnum.TransferComplete &&
      !isLoading
    ) {
      updateSelection({ orderStep: OrderStep.PaymentCompleted });
    }

    if (
      transferStatus?.status === TransferStatusEnum.TransferFailed &&
      !isLoading
    ) {
      updateSelection({ orderStep: OrderStep.PaymentFailed });
    }
  }, [transferStatus?.status, isLoading, updateSelection]);

  const handleDone = () => {
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

  // Handle case where quote data is invalid
  if (!quote.network) {
    console.error("Invalid quote structure for withdrawal:", { quote });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p>Loading withdrawal details...</p>
        </div>
      </div>
    );
  }

  // Determine the current state based on order step and transfer status
  let isProcessing = true;
  let isFailed = false;

  if (orderStep === OrderStep.ProcessingPayment) {
    // During ProcessingPayment, we're always processing (submitting hash)
    isProcessing = true;
  } else if (orderStep === OrderStep.GotTransfer) {
    // During GotTransfer, check the actual transfer status
    isProcessing = transferStatus?.status !== TransferStatusEnum.TransferComplete && 
                   transferStatus?.status !== TransferStatusEnum.TransferFailed;
    isFailed = transferStatus?.status === TransferStatusEnum.TransferFailed;
  }

  return (
    <WithdrawalStatusCard
      quote={quote}
      transfer={transfer || undefined}
      isProcessing={isProcessing}
      isFailed={isFailed}
      onDone={handleDone}
    />
  );
};

export default WithdrawalOrderProcessing;
