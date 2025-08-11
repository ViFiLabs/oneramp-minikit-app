"use client";

import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep, TransferType } from "@/types";
import OrderProcessing from "../components/cards/order-processing";
import OrderSuccessful from "../components/cards/order-successful";
import PayOrderProcessing from "../components/cards/pay-order-processing";
import WithdrawalUnified from "../components/cards/withdrawal-unified";
import BuyUnified from "@/app/components/cards/buy-unified";
import { TransactionReviewModal } from "../components/modals/TransactionReviewModal";
import { useQuery } from "@tanstack/react-query";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { getKYC } from "@/actions/kyc";
import { useEffect } from "react";
import { useKYCStore } from "@/store/kyc-store";
import { useQuoteStore } from "@/store/quote-store";
import OrderFailed from "../components/cards/order-failed";

const StateContextProvider = () => {
  const { orderStep } = useUserSelectionStore();
  const { quote } = useQuoteStore();
  const { address } = useWalletGetInfo();
  const { setKycData, clearKycData } = useKYCStore();

  // Reset KYC data when address changes
  useEffect(() => {
    if (!address) {
      clearKycData();
    }
  }, [address, clearKycData]);

  const { isCheckingKyc } = useKYCStore();

  // Fetch KYC data only when we have an address and not actively checking KYC
  const getKYCQuery = useQuery({
    queryKey: ["kyc", address], // Add address to query key to refetch on address change
    queryFn: async () => {
      if (!address) return null;
      return await getKYC(address);
    },
    enabled: !!address && !isCheckingKyc, // Disable query when actively checking KYC
    refetchOnWindowFocus: true,
  });

  // Update KYC data only when we have valid data
  useEffect(() => {
    const kycData = getKYCQuery.data;
    if (kycData) {
      setKycData(kycData);
    }
  }, [getKYCQuery.data, setKycData]);

  if (orderStep === OrderStep.Initial) {
    return null;
  }

  if (orderStep === OrderStep.GotQuote) {
    return <TransactionReviewModal />;
  }

  if (
    orderStep === OrderStep.ProcessingPayment ||
    orderStep === OrderStep.WaitingForPayment
  ) {
    // For withdrawals, use our unified component that handles all states
    if (quote?.transferType === TransferType.TransferOut) {
      return <WithdrawalUnified />;
    }
    // For buy transactions, use our unified component that handles all states
    if (quote?.transferType === TransferType.TransferIn) {
      return <BuyUnified />;
    }
    return <PayOrderProcessing />;
  }

  if (orderStep === OrderStep.GotTransfer) {
    // For withdrawals, continue using our unified component for status polling
    if (quote?.transferType === TransferType.TransferOut) {
      return <WithdrawalUnified />;
    }
    // For buy transactions, continue using our unified component for status polling
    if (quote?.transferType === TransferType.TransferIn) {
      return <BuyUnified />;
    }
    return <OrderProcessing />;
  }

  if (orderStep === OrderStep.PaymentCompleted) {
    // Use unified withdrawal component for TransferOut transactions
    if (quote?.transferType === TransferType.TransferOut) {
      return <WithdrawalUnified />;
    }
    // Use unified buy component for TransferIn transactions
    if (quote?.transferType === TransferType.TransferIn) {
      return <BuyUnified />;
    }
    return <OrderSuccessful />;
  }

  if (orderStep === OrderStep.PaymentFailed) {
    // Use unified withdrawal component for TransferOut transactions
    if (quote?.transferType === TransferType.TransferOut) {
      return <WithdrawalUnified />;
    }
    // Use unified buy component for TransferIn transactions
    if (quote?.transferType === TransferType.TransferIn) {
      return <BuyUnified />;
    }
    return <OrderFailed />;
  }

  return null;
};

export default StateContextProvider;
