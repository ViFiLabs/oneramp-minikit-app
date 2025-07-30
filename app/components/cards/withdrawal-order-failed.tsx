"use client";

import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { TransferType } from "@/types";
import { useRouter } from "next/navigation";
import WithdrawalStatusCard from "./withdrawal-status-card";

const WithdrawalOrderFailed = () => {
  const { resetToDefault } = useUserSelectionStore();
  const { quote } = useQuoteStore();
  const { resetQuote } = useQuoteStore();
  const { resetTransfer } = useTransferStore();
  const router = useRouter();

  const handleTryAgain = () => {
    resetQuote();
    resetTransfer();
    resetToDefault();
    router.refresh();
  };

  // Only render this component for withdrawal (TransferOut) transactions
  if (!quote || quote.transferType !== TransferType.TransferOut) {
    return null;
  }

  return (
    <WithdrawalStatusCard
      quote={quote}
      isProcessing={false}
      isFailed={true}
      onDone={handleTryAgain}
    />
  );
};

export default WithdrawalOrderFailed;
