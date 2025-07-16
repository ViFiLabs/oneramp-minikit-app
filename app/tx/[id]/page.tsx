"use client";

import { getTransferStatus } from "@/actions/transfer";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { TransferStatusEnum } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import TransactionSuccessCard from "./transaction-success-card";
import TransactionFailedCard from "./transaction-failed-card";
import TransactionCard from "./transaction-card";

const TxPage = () => {
  const { resetToDefault } = useUserSelectionStore();
  const { resetTransfer } = useTransferStore();
  const router = useRouter();

  const { id } = useParams<{ id: string }>();

  const { data: transferStatus, isLoading } = useQuery({
    queryKey: ["transferStatus", id],
    queryFn: () => {
      if (!id) {
        throw new Error("Transfer ID is required");
      }
      return getTransferStatus(id);
    },
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (
      transferStatus?.status === TransferStatusEnum.TransferComplete &&
      !isLoading
    ) {
      // Order step update will be handled by the parent component
    }
  }, [transferStatus?.status, isLoading]);

  const handleCancel = () => {
    resetTransfer();
    resetToDefault();
    router.push("/");
  };

  const handleNewPayment = () => {
    resetTransfer();
    resetToDefault();
    router.push("/");
  };

  const handleGetReceipt = () => {
    // Receipt generation functionality to be implemented
  };

  // Generate explorer URL based on network
  const exploreUrl = transferStatus?.txHash
    ? `https://polygon.etherscan.io/tx/${transferStatus.txHash}`
    : undefined;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading transfer details...</div>
      </div>
    );
  }

  if (!transferStatus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="text-white text-xl">Transfer not found</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {transferStatus.status === TransferStatusEnum.TransferComplete ? (
        <TransactionSuccessCard
          transferStatus={transferStatus}
          exploreUrl={exploreUrl}
          onNewPayment={handleNewPayment}
          onGetReceipt={handleGetReceipt}
        />
      ) : transferStatus.status === TransferStatusEnum.TransferFailed ||
        transferStatus.status === TransferStatusEnum.TransferRefunded ||
        transferStatus.status === TransferStatusEnum.TransferExpired ? (
        <TransactionFailedCard
          transferStatus={transferStatus}
          exploreUrl={exploreUrl}
          onNewPayment={handleNewPayment}
          onGetReceipt={handleGetReceipt}
        />
      ) : (
        <TransactionCard
          transferStatus={transferStatus}
          exploreUrl={exploreUrl}
          onCancel={handleCancel}
          onGetReceipt={handleGetReceipt}
        />
      )}
    </div>
  );
};

export default TxPage;
