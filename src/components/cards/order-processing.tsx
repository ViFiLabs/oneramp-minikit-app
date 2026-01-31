"use client";

import { getTransferStatus } from "@/src/actions/transfer";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { OrderStep, TransferStatusEnum } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProcessingCard from "./processing-card";

const OrderProcessing = () => {
  const { resetToDefault, updateSelection } = useUserSelectionStore();
  const { transfer, resetTransfer } = useTransferStore();
  const { quote, resetQuote } = useQuoteStore();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 md:backdrop-blur-sm" />
      {/* Action sheet from bottom */}
      <div className="fixed inset-0 z-51 flex items-end justify-center">
        <div
          className={`w-full max-w-md h-[65vh] overflow-y-auto rounded-t-3xl overflow-hidden bg-[#181818] transition-transform duration-300 ease-out ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
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
      </div>
    </>
  );
};

export default OrderProcessing;
