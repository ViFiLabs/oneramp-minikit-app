"use client";

import { useUserSelectionStore } from "@/store/user-selection";
import { OrderStep } from "@/types";
import OrderProcessing from "../components/cards/order-processing";
import OrderSuccessful from "../components/cards/order-successful";
import { TransactionReviewModal } from "../components/modals/TransactionReviewModal";
import { useQuery } from "@tanstack/react-query";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { getKYC } from "@/actions/kyc";
import { useEffect } from "react";
import { useKYCStore } from "@/store/kyc-store";
import OrderFailed from "../components/cards/order-failed";

const StateContextProvider = () => {
  const { orderStep } = useUserSelectionStore();
  const { address } = useWalletGetInfo();
  const { setKycData, clearKycData } = useKYCStore();

  // Reset KYC data when address changes
  useEffect(() => {
    if (!address) {
      clearKycData();
    }
  }, [address, clearKycData]);

  // Fetch KYC data only when we have an address
  const getKYCQuery = useQuery({
    queryKey: ["kyc", address], // Add address to query key to refetch on address change
    queryFn: async () => {
      if (!address) return null;
      return await getKYC(address);
    },
    enabled: !!address,
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

  if (orderStep === OrderStep.GotTransfer) {
    return <OrderProcessing />;
  }

  if (orderStep === OrderStep.PaymentCompleted) {
    return <OrderSuccessful />;
  }

  if (orderStep === OrderStep.PaymentFailed) {
    return <OrderFailed />;
  }

  return null;
};

export default StateContextProvider;
