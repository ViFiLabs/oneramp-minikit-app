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
  SubmitTransactionHashRequest,
} from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ProcessingCard from "./processing-card";

const PayOrderProcessing = () => {
  const { resetToDefault, updateSelection } = useUserSelectionStore();
  const { transfer, resetTransfer, transactionHash } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();
  const sessionStartTime = useProcessingSession(transfer?.transferId);
  const hashSubmittedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);


  // Reset submitted flag when transaction hash changes
  useEffect(() => {
    if (transactionHash) {
      hashSubmittedRef.current = false;
    }
  }, [transactionHash]);

  // Submit transaction hash mutation
  const submitTxHashMutation = useMutation({
    mutationKey: ["submit-tx-hash-pay"],
    mutationFn: (payload: SubmitTransactionHashRequest) =>
      submitTransactionHash(payload),
    onSuccess: () => {
      hashSubmittedRef.current = true;
      // Transition to regular transfer status polling
      updateSelection({ orderStep: OrderStep.GotTransfer });
    },
    onError: (error) => {
      console.error("Error submitting transaction hash:", error);
      clearProcessingSession(transfer?.transferId);
      updateSelection({ orderStep: OrderStep.PaymentFailed });
    },
  });

  // Submit hash on component mount
  useEffect(() => {
    if (
      transfer?.transferId &&
      transactionHash &&
      !submitTxHashMutation.isPending &&
      !hashSubmittedRef.current
    ) {
      // Wait 2 seconds before submitting (reduced from 10 seconds)
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
  }, [transfer?.transferId, transactionHash]); // Removed submitTxHashMutation from dependencies

  // Monitor transfer status after hash submission
  const { data: transferStatus, isLoading } = useQuery({
    queryKey: ["transferStatus", transfer?.transferId],
    queryFn: () => {
      if (!transfer?.transferId) {
        throw new Error("Transfer ID is required");
      }
      return getTransferStatus(transfer.transferId);
    },
    enabled: !!transfer?.transferId && submitTxHashMutation.isSuccess,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (
      transferStatus?.status === TransferStatusEnum.TransferComplete &&
      !isLoading
    ) {
      clearProcessingSession(transfer?.transferId);
      updateSelection({ orderStep: OrderStep.PaymentCompleted });
    }

    if (
      transferStatus?.status === TransferStatusEnum.TransferFailed &&
      !isLoading
    ) {
      clearProcessingSession(transfer?.transferId);
      updateSelection({ orderStep: OrderStep.PaymentFailed });
    }
  }, [transferStatus?.status, isLoading]); // Removed updateSelection from dependencies

  // Extract actual quote if it's nested
  const actualQuote = quote;

  // Handle case where quote data is invalid
  if (!actualQuote || !actualQuote.network) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm" />
        <div className="fixed inset-0 z-[51] flex items-end justify-center">
          <div className="bg-gray-900 rounded-t-3xl max-w-md w-full max-h-[50vh] p-6 flex items-center justify-center">
            <p className="text-white text-center">Loading payment details...</p>
          </div>
        </div>
      </>
    );
  }

  const handleCancel = () => {
    clearProcessingSession(transfer?.transferId);
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  const handleGetReceipt = () => {};

  // Generate explorer URL based on network
  const exploreUrl = transactionHash
    ? `https://explorer.example.com/tx/${transactionHash}`
    : undefined;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm" />
      {/* Action sheet from bottom */}
      <div className="fixed inset-0 z-[51] flex items-end justify-center">
        <div
          className={`w-full max-w-md max-h-[50vh] overflow-y-auto rounded-t-3xl overflow-hidden bg-[#181818] transition-transform duration-300 ease-out ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <ProcessingCard
            transactionHash={transactionHash || undefined}
            exploreUrl={exploreUrl}
            quote={actualQuote}
            transfer={transfer || undefined}
            onCancel={handleCancel}
            onGetReceipt={handleGetReceipt}
            sessionStartTime={sessionStartTime}
          />
        </div>
      </div>
    </>
  );
};

export default PayOrderProcessing;
