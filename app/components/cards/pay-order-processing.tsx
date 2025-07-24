"use client";

import { submitTransactionHash, getTransferStatus } from "@/actions/transfer";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep, TransferStatusEnum } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProcessingCard from "./processing-card";

const PayOrderProcessing = () => {
  const { resetToDefault, updateSelection } = useUserSelectionStore();
  const { transfer, resetTransfer, transactionHash } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();

  // Debug the quote structure
  useEffect(() => {
    if (quote) {
      console.log("Quote network:", quote.network);
    }
  }, [quote]);

  // Submit transaction hash mutation
  const submitTxHashMutation = useMutation({
    mutationKey: ["submit-tx-hash-pay"],
    mutationFn: submitTransactionHash,
    onSuccess: () => {
      console.log("Transaction hash submitted successfully:");
      // Transition to regular transfer status polling
      updateSelection({ orderStep: OrderStep.GotTransfer });
    },
    onError: (error) => {
      console.error("Error submitting transaction hash:", error);
      updateSelection({ orderStep: OrderStep.PaymentFailed });
    },
  });

  // Submit hash on component mount
  useEffect(() => {
    if (
      transfer?.transferId &&
      transactionHash &&
      !submitTxHashMutation.isPending
    ) {
      // Wait 10 seconds before submitting (like TransactionReviewModal)
      const timer = setTimeout(() => {
        submitTxHashMutation.mutate({
          transferId: transfer.transferId,
          txHash: transactionHash,
        });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [transfer?.transferId, transactionHash, submitTxHashMutation]);

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
      updateSelection({ orderStep: OrderStep.PaymentCompleted });
    }

    if (
      transferStatus?.status === TransferStatusEnum.TransferFailed &&
      !isLoading
    ) {
      updateSelection({ orderStep: OrderStep.PaymentFailed });
    }
  }, [transferStatus?.status, isLoading, updateSelection]);

  // Extract actual quote if it's nested
  const actualQuote = quote;

  // Handle case where quote data is invalid
  if (!actualQuote || !actualQuote.network) {
    console.error("Invalid quote structure:", { quote, actualQuote });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
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
    <div className="fixed inset-0 z-50 flex-col md:flex-row flex py-20 justify-center bg-black gap-x-16">
      {/* Show processing card with actual quote */}
      <ProcessingCard
        transactionHash={transactionHash || undefined}
        exploreUrl={exploreUrl}
        quote={actualQuote}
        transfer={transfer || undefined}
        onCancel={handleCancel}
        onGetReceipt={handleGetReceipt}
      />
    </div>
  );
};

export default PayOrderProcessing;