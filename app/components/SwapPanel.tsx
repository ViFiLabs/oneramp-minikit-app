"use client";

import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { Asset, Network } from "@/types";
import {
  useAllCountryExchangeRates,
  useAllCountryInstitutions,
} from "@/hooks/useExchangeRate";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo } from "react";
import SubmitButton from "./buttons/submit-button";
import ExchangeRateComponent from "./exchange-rate-component";
import { TransactionReviewModal } from "./modals/TransactionReviewModal";
import { FromPanel } from "./panels/FromPanel";
import { SwapArrow } from "./panels/SwapArrow";
import { SwapHeader } from "./panels/SwapHeader";
import { ToPanel } from "./panels/ToPanel";
import SelectInstitution from "./select-institution";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const { countryPanelOnTop, updateSelection } = useUserSelectionStore();
  const { currentNetwork, setCurrentNetwork } = useNetworkStore();
  const [selectedCountryCurrency] = useState<null | {
    name: string;
    logo: string;
  }>(null);

  // Get available assets for the current network
  const availableAssets = useMemo(() => {
    if (!currentNetwork) return assets;

    return assets.filter((asset) => {
      const networkConfig = asset.networks[currentNetwork.name];
      return networkConfig && networkConfig.tokenAddress;
    });
  }, [currentNetwork]);

  const [selectedCurrency, setSelectedCurrency] = useState<Asset>(
    availableAssets[0] || assets[0]
  );

  // Wallet connection states
  const { isConnected: evmConnected } = useWalletGetInfo();

  const { country } = useUserSelectionStore();
  const { isValid: isAmountValid, setAmount } = useAmountStore();

  // Pre-fetch exchange rates for all supported countries when component mounts
  // This improves the user experience by having rates ready when countries are selected
  // Note: The data is used in ExchangeRateComponent, this just triggers the pre-fetching
  // Using "selling" endpoint for better performance (same as PaymentInterface)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allExchangeRates } = useAllCountryExchangeRates({
    orderType: "selling", // Using selling endpoint for better performance
    providerType: "momo", // Default provider type
  });

  // Pre-fetch institutions for all supported countries when component mounts
  // This ensures institutions are ready when users select a country
  // Note: The data is used in InstitutionModal, this just triggers the pre-fetching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allInstitutions } = useAllCountryInstitutions("buy");

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
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SwapHeader
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          availableAssets={availableAssets}
          onSettingsClick={handleSettingsClick}
        />
      </motion.div>

      {/* Animated Panel Container */}
      <AnimatePresence mode="wait">
        {countryPanelOnTop ? (
          <motion.div
            key="country-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ToPanel
                selectedCountryCurrency={selectedCountryCurrency}
                onBeneficiarySelect={handleBeneficiarySelect}
              />
            </motion.div>

            {/* Arrow in the middle */}
            <SwapArrow
              onClick={() => {
                updateSelection({ countryPanelOnTop: !countryPanelOnTop });
                setAmount("0");
              }}
            />

            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <FromPanel
                selectedCurrency={selectedCurrency}
                networks={networks}
                canSwitchNetwork={canSwitchNetwork}
                onNetworkSelect={handleNetworkSelect}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="crypto-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <FromPanel
                selectedCurrency={selectedCurrency}
                networks={networks}
                canSwitchNetwork={canSwitchNetwork}
                onNetworkSelect={handleNetworkSelect}
              />
            </motion.div>

            {/* Arrow in the middle */}
            <SwapArrow
              onClick={() => {
                updateSelection({ countryPanelOnTop: !countryPanelOnTop });
                setAmount("0");
              }}
            />

            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ToPanel
                selectedCountryCurrency={selectedCountryCurrency}
                onBeneficiarySelect={handleBeneficiarySelect}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <ExchangeRateComponent />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        {country ? (
          <div className="px-3 md:px-4">
            <SelectInstitution />
          </div>
        ) : (
          <div className="px-3 md:px-4 mt-4">
            <SubmitButton disabled={!isAmountValid}>SWAP</SubmitButton>
          </div>
        )}
      </motion.div>

      {/* Transaction Review Modal */}
      <TransactionReviewModal />
    </div>
  );
}
