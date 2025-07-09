"use client";

import { verifyAccountDetails } from "@/actions/institutions";
import { useKYCStore } from "@/store/kyc-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { AppState } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { KYCVerificationModal } from "./modals/KYCVerificationModal";

export const FetchingAccountDetails = () => {
  return (
    <div className="flex items-center gap-3 text-neutral-600 text-sm">
      <Loader className="size-4 animate-spin" />
      <p>Verifying account name...</p>
    </div>
  );
};

const AccountDetails = ({ accountNumber }: { accountNumber: string }) => {
  const { paymentMethod, country, institution, setAppState, updateSelection } =
    useUserSelectionStore();
  //   const [isLoading, setIsLoading] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const { setIsCheckingKyc, kycData } = useKYCStore();

  // Automatically show KYC modal when status is not verified

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
    // if (isLoading && kycData && kycData?.message?.link) {
    //   setAppState(AppState.Processing);
    // }

    if (isLoading) {
      setAppState(AppState.Processing);
    }

    if (!isLoading && !error && accountDetails) {
      setAppState(AppState.Idle);
      updateSelection({ accountName: accountDetails.accountName });
    }
  }, [isLoading, error, accountDetails, kycData]);

  if (isLoading && kycData && !kycData?.message?.link) {
    return <FetchingAccountDetails />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-xs">Error fetching account details</div>
    );
  }

  return (
    <div className="mb-2 flex flex-col gap-4">
      <KYCVerificationModal
        open={showKYCModal}
        onClose={() => {
          setShowKYCModal(false);
          setIsCheckingKyc(false);
        }}
        kycLink={kycData?.message?.link || null}
      />
      <div className="flex items-center justify-between">
        {kycData && !kycData?.message?.link && (
          <>
            <div className="flex p-1 text-white border-2 bg-neutral-900 border-[#bcbcff] rounded-lg px-4 text-sm font-medium border-gradient-to-r from-purple-500/20 to-indigo-500/20">
              {paymentMethod === "momo" ? (
                <h3>OK</h3>
              ) : (
                <h3 className="line-clamp-1">
                  {accountDetails?.accountName || "Account Name"}
                </h3>
              )}
            </div>
            <Check className="size-6 text-green-500" />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountDetails;
