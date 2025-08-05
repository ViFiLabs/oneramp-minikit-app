"use client";

import { verifyAccountDetails } from "@/actions/institutions";
import { useKYCStore } from "@/store/kyc-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { AppState } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader } from "lucide-react";
import { useEffect } from "react";

export const FetchingAccountDetails = () => {
  return (
    <div className="flex items-center gap-3 text-neutral-600 text-sm">
      <Loader className="size-4 animate-spin" />
      <p>Verifying account name...</p>
    </div>
  );
};

// Component for status indicator inside input
export const AccountStatusIndicator = ({
  accountNumber,
}: {
  accountNumber: string;
}) => {
  const { country, institution, setAppState, updateSelection } =
    useUserSelectionStore();

  const { kycData } = useKYCStore();

  const {
    data: accountDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["account-details", accountNumber, country],
    queryFn: async () =>
      await verifyAccountDetails({
        bankId: institution?.code || "",
        accountNumber: accountNumber,
        currency: country?.currency || "",
      }),
    enabled: !!accountNumber && !!country && !!kycData,
    retry: true,
    retryDelay: 3000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (isLoading) {
      setAppState(AppState.Processing);
    }

    if (!isLoading && !error && accountDetails) {
      setAppState(AppState.Idle);
      updateSelection({ accountName: accountDetails.accountName });
    }
  }, [isLoading, error, accountDetails, kycData]);

  if (isLoading && kycData && !kycData?.message?.link) {
    return (
      <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none z-20">
        <Loader className="size-4 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (kycData && !kycData?.message?.link && !isLoading && !error) {
    return (
      <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none z-20">
        <Check className="size-4 text-green-500" />
      </div>
    );
  }

  return null;
};

// Component for account name display below input
export const AccountNameDisplay = ({
  accountNumber,
}: {
  accountNumber: string;
}) => {
  const { paymentMethod, country, institution } = useUserSelectionStore();
  const { kycData } = useKYCStore();

  const {
    data: accountDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["account-details", accountNumber, country],
    queryFn: async () =>
      await verifyAccountDetails({
        bankId: institution?.code || "",
        accountNumber: accountNumber,
        currency: country?.currency || "",
      }),
    enabled: !!accountNumber && !!country && !!kycData,
    retry: true,
    retryDelay: 3000,
    refetchOnWindowFocus: true,
  });

  // Only show account name for bank accounts, not mobile money
  if (
    paymentMethod === "bank" &&
    accountDetails?.accountName &&
    !isLoading &&
    !error
  ) {
    return (
      <div className="flex items-center justify-between mt-2">
        <div className="flex p-1 text-white border-2 bg-neutral-900 border-[#bcbcff] rounded-lg px-4 text-sm font-medium border-gradient-to-r from-purple-500/20 to-indigo-500/20">
          <h3 className="line-clamp-1">{accountDetails.accountName}</h3>
        </div>
      </div>
    );
  }

  return null;
};

const AccountDetails = ({ accountNumber }: { accountNumber: string }) => {
  return (
    <>
      <AccountStatusIndicator accountNumber={accountNumber} />
      <AccountNameDisplay accountNumber={accountNumber} />
    </>
  );
};

export default AccountDetails;
