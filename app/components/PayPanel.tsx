"use client";

import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { Asset, Network } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import SubmitButton from "./buttons/submit-button";
import ExchangeRateComponent from "./exchange-rate-component";
import { TransactionReviewModal } from "./modals/TransactionReviewModal";
import { FromPanel } from "./panels/FromPanel";
import { SwapArrow } from "./panels/SwapArrow";
import { SwapHeader } from "./panels/SwapHeader";
import { ToPanel } from "./panels/ToPanel";
import SelectInstitution from "./select-institution";
import { PaymentInterface } from "./payment/pay-interface";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function PayPanel() {
  const [selectedCurrency, setSelectedCurrency] = useState<Asset>(assets[0]);
  const { countryPanelOnTop, updateSelection } = useUserSelectionStore();
  const { setCurrentNetwork } = useNetworkStore();
  const [selectedCountryCurrency] = useState<null | {
    name: string;
    logo: string;
  }>(null);

  // Wallet connection states
  const { isConnected: evmConnected } = useWalletGetInfo();

  const { country } = useUserSelectionStore();
  const { isValid: isAmountValid, setAmount } = useAmountStore();

  // Used to show wallet requirement in the network modal
  const canSwitchNetwork = (network: Network) => {
    console.log(network);
    return evmConnected;
  };

  // Update handleNetworkSelect to use global state
  const handleNetworkSelect = async (network: Network) => {
    // If appropriate wallet is connected, attempt to switch networks
    setCurrentNetwork(network);
  };

  const handleCurrencyChange = (currency: Asset) => {
    setSelectedCurrency(currency);
  };

  const handleSettingsClick = () => {
    // Settings functionality to be implemented
  };

  const handleBeneficiarySelect = () => {
    // Beneficiary selection functionality to be implemented
  };

  return (
    <div className="w-full max-w-md mx-auto mt-0 min-h-[450px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      <PaymentInterface />

      {/* Transaction Review Modal */}
      <TransactionReviewModal />
    </div>
  );
}
