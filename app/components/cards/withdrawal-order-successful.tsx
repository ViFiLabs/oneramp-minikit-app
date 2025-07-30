"use client";

import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { TransferType } from "@/types";
import { useRouter } from "next/navigation";
import WithdrawalStatusCard from "./withdrawal-status-card";

const WithdrawalOrderSuccessful = () => {
  const { resetToDefault } = useUserSelectionStore();
  const { quote } = useQuoteStore();
  const { resetQuote } = useQuoteStore();
  const { resetTransfer } = useTransferStore();
  const router = useRouter();

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

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black">
      <WithdrawalStatusCard
        quote={quote}
        isProcessing={false}
        onDone={handleDone}
      />
    </div>
  );
};

export default WithdrawalOrderSuccessful;
