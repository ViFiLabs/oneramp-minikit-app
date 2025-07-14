"use client";

import { getTransferStatus } from "@/actions/transfer";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep, TransferStatusEnum } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProcessingCard from "./processing-card";

const OrderProcessing = () => {
  const { resetToDefault, updateSelection, paymentMethod } =
    useUserSelectionStore();
  const { transfer, resetTransfer } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();

  const { data: transferStatus, isLoading } = useQuery({
    queryKey: ["transferStatus", transfer?.transferId],
    queryFn: () => {
      if (!transfer?.transferId) {
        throw new Error("Transfer ID is required");
      }
      return getTransferStatus(transfer.transferId);
    },
    enabled: !!transfer?.transferId,
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
  }, [transferStatus?.status, isLoading]);

  const handleCancel = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  const handleGetReceipt = () => {};

  // Generate explorer URL based on network
  const exploreUrl = transfer?.transactionHash
    ? `https://explorer.example.com/tx/${transfer.transactionHash}`
    : undefined;

  console.log("====================================");
  console.log("paymentMethod", paymentMethod);
  console.log("====================================");

  return (
    <div className="fixed inset-0 z-50 flex-col md:flex-row flex py-20  justify-center bg-black gap-x-16">
      {/* Left side - Timeline */}
      {quote && (
        <ProcessingCard
          transactionHash={transfer?.transactionHash}
          exploreUrl={exploreUrl}
          quote={quote}
          transfer={transfer || undefined}
          onCancel={handleCancel}
          onGetReceipt={handleGetReceipt}
        />
      )}
    </div>
  );
};

export default OrderProcessing;
