"use client";

import { useEffect, useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useNetworkStore } from "@/store/network";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import type { Network } from "@/types";
import { FromPanel } from "@/app/components/panels/FromPanel";
import { ToPanel } from "@/app/components/panels/ToPanel";
import { SwapArrow } from "@/app/components/panels/SwapArrow";
import ExchangeRateComponent from "@/app/components/exchange-rate-component";
import SelectInstitution from "@/app/components/select-institution";
import { SwipeToWithdrawButton } from "@/app/components/payment/swipe-to-withdraw";
import { countries } from "@/data/countries";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export default function CNGNWithdrawPanel() {
  const userSelection = useUserSelectionStore();
  const { country, institution, accountNumber, asset, updateSelection } =
    userSelection;
  const { setCurrentNetwork } = useNetworkStore();
  const { isConnected: evmConnected } = useWalletGetInfo();
  const { isValid: isAmountValid } = useAmountStore();

  // Lock country to Nigeria for cNGN withdraw as well
  useEffect(() => {
    const nigeria = countries.find((c) => c.name === "Nigeria");
    if (nigeria && (!country || country.name !== "Nigeria")) {
      updateSelection({ country: nigeria });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSwitchNetwork = () => evmConnected;
  const handleNetworkSelect = async (network: Network) =>
    setCurrentNetwork(network);

  const isWithdrawDisabled = useMemo(
    () =>
      !isAmountValid ||
      !country ||
      !institution ||
      !accountNumber ||
      !evmConnected,
    [isAmountValid, country, institution, accountNumber, evmConnected]
  );

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* From / To panels */}
      <FromPanel
        selectedCurrency={asset as unknown as never}
        networks={networks}
        canSwitchNetwork={canSwitchNetwork}
        onNetworkSelect={handleNetworkSelect}
      />

      <SwapArrow disabled />

      <ToPanel selectedCountryCurrency={null} />

      {/* Rate line */}
      <ExchangeRateComponent />

      {/* Recipient */}
      <SelectInstitution disableSubmit={true} />

      {/* Swipe to Withdraw */}
      <div className="mt-2">
        <SwipeToWithdrawButton
          onWithdrawComplete={() => {}}
          isLoading={false}
          disabled={isWithdrawDisabled}
          stepMessage={""}
          isWalletConnected={evmConnected}
          onSwapClick={() => {}}
        />
      </div>
    </div>
  );
}
