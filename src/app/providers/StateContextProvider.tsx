"use client";

import { useUserSelectionStore } from "@/src/store/user-selection";
import { OrderStep, TransferType } from "@/types";
import OrderProcessing from "@/src/components/cards/order-processing";
import OrderSuccessful from "@/src/components/cards/order-successful";
import PayOrderProcessing from "@/src/components/cards/pay-order-processing";
import WithdrawalUnified from "@/src/components/cards/withdrawal-unified";
import BuyUnified from "@/src/components/cards/buy-unified";
import { TransactionReviewModal } from "@/src/components/modals/TransactionReviewModal";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useEffect } from "react";
import { useKYCStore } from "@/src/store/kyc-store";
import { useQuoteStore } from "@/src/store/quote-store";
import OrderFailed from "@/src/components/cards/order-failed";
import { useKYCStatusSuspense } from "@/src/hooks/useKYCSuspense";

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

  // const { isCheckingKyc } = useKYCStore();

  const { data: kycData, isLoading: isKYCStatusLoading } = useKYCStatusSuspense(
    { address: address || "" }
  );

  // Fetch KYC data only when we have an address and not actively checking KYC
  // const getKYCQuery = useQuery({
  //   queryKey: ["kyc", address], // Add address to query key to refetch on address change
  //   queryFn: async () => {
  //     if (!address) return null;
  //     return await getKYC(address);
  //   },
  //   enabled: !!address && !isCheckingKyc, // Disable query when actively checking KYC
  //   refetchOnWindowFocus: true,
  // });

  // Update KYC data only when we have valid data
  useEffect(() => {
    if (kycData && !isKYCStatusLoading) {
      setKycData(kycData);
    }
  }, [kycData, setKycData]);

  // useEffect(() => {
  //   const kycData = getKYCQuery.data;
  //   if (kycData) {
  //     setKycData(kycData);
  //   }
  // }, [getKYCQuery.data, setKycData]);

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
