"use client";

import { useKYCStore } from "@/src/store/kyc-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { AppState } from "@/types";
import { Check, Loader } from "lucide-react";
import { useEffect, Suspense } from "react";
import { useAccountDetailSuspense } from "@/src/hooks/useAccountDetailSuspense";

interface AccountDetailsResponse {
  accountName?: string;
  [key: string]: unknown;
}

export const FetchingAccountDetails = () => {
  return (
    <div className="flex items-center gap-3 text-neutral-600 text-sm">
      <Loader className="size-4 animate-spin" />
      <p>Verifying account name...</p>
    </div>
  );
};

// Component for status indicator inside input
const AccountStatusIndicatorInner = ({
  accountNumber,
  bankId,
  currency,
}: {
  accountNumber: string;
  bankId: string;
  currency: string;
}) => {
  const { setAppState, updateSelection } = useUserSelectionStore();
  const { kycData } = useKYCStore();

  const { data: accountDetails } = useAccountDetailSuspense({
    bankId,
    accountNumber,
    currency,
  });

  const accountDetailsTyped = accountDetails as
    | AccountDetailsResponse
    | undefined;

  useEffect(() => {
    setAppState(AppState.Idle);
    if (accountDetailsTyped?.accountName) {
      updateSelection({ accountName: accountDetailsTyped.accountName });
    }
  }, [accountDetailsTyped?.accountName, setAppState, updateSelection]);

  if (kycData && !kycData?.message?.link && accountDetailsTyped) {
    return (
      <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none z-20">
        <Check className="size-4 text-green-500" />
      </div>
    );
  }

  return null;
};

export const AccountStatusIndicator = ({
  accountNumber,
}: {
  accountNumber: string;
}) => {
  const { country, institution } = useUserSelectionStore();
  const { kycData } = useKYCStore();

  // Only show suspense boundary when we should fetch
  if (!accountNumber || !country?.currency || !institution?.code || !kycData) {
    return null;
  }

  return (
    <Suspense
      fallback={
        kycData && !kycData?.message?.link ? (
          <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none z-20">
            <Loader className="size-4 animate-spin text-neutral-400" />
          </div>
        ) : null
      }
    >
      <AccountStatusIndicatorInner
        accountNumber={accountNumber}
        bankId={institution.code}
        currency={country.currency}
      />
    </Suspense>
  );
};

// Component for account name display below input
const AccountNameDisplayInner = ({
  accountNumber,
  bankId,
  currency,
}: {
  accountNumber: string;
  bankId: string;
  currency: string;
}) => {
  const { data: accountDetails } = useAccountDetailSuspense({
    bankId,
    accountNumber,
    currency,
  });

  const accountDetailsTyped = accountDetails as
    | AccountDetailsResponse
    | undefined;

  // Show account name when available
  if (accountDetailsTyped?.accountName) {
    return (
      <div className="flex items-center justify-between mt-2">
        <div className="flex p-1 text-white border-2 bg-neutral-900 border-[#bcbcff] rounded-lg px-4 text-sm font-medium border-gradient-to-r from-purple-500/20 to-indigo-500/20">
          <h3 className="line-clamp-1">{accountDetailsTyped.accountName}</h3>
        </div>
      </div>
    );
  }

  return null;
};

export const AccountNameDisplay = ({
  accountNumber,
}: {
  accountNumber: string;
}) => {
  const { country, institution } = useUserSelectionStore();
  const { kycData } = useKYCStore();

  // Only show suspense boundary when we should fetch
  if (!accountNumber || !country?.currency || !institution?.code || !kycData) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AccountNameDisplayInner
        accountNumber={accountNumber}
        bankId={institution.code}
        currency={country.currency}
      />
    </Suspense>
  );
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
