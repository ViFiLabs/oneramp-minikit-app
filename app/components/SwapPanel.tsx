"use client";

import { Button } from "@/components/ui/button";
import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import { isTokenSupported } from "@/data/token-config";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { Asset, Network } from "@/types";
import { useAccount as useStarknetAccount } from "@starknet-react/core";
import Image from "next/image";
import { useState } from "react";
import SubmitButton from "./buttons/submit-button";
import ExchangeRateComponent from "./exchange-rate-component";
import ValueInput from "./inputs/ValueInput";
import { TransactionReviewModal } from "./modals/TransactionReviewModal";
import { NetworkSelector } from "./NetworkSelector";
import SelectCountry from "./select-country";
import SelectInstitution from "./select-institution";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const [selectedCurrency, setSelectedCurrency] = useState<Asset>(assets[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { currentNetwork, setCurrentNetwork } = useNetworkStore();
  const [selectedCountryCurrency] = useState<null | {
    name: string;
    logo: string;
  }>(null);

  // Wallet connection states
  // const [evmConnected] = useState(false);
  const { isConnected: evmConnected } = useWalletGetInfo();

  const { address: starknetAddress } = useStarknetAccount();
  const starknetConnected = !!starknetAddress;

  const { country, updateSelection } = useUserSelectionStore();
  const { setAmount, isValid: isAmountValid } = useAmountStore();

  // Token balance hook - now fetches balances for all networks
  const {
    formatted: tokenBalance,
    isLoading: balanceLoading,
    allNetworkBalances,
  } = useTokenBalance(selectedCurrency.symbol);

  // Check if current token is supported on the current network
  const isCurrentTokenSupported = currentNetwork?.chainId
    ? isTokenSupported(selectedCurrency.symbol, currentNetwork.chainId)
    : false;

  // Check EVM wallet connection

  // Used to show wallet requirement in the network modal
  const canSwitchNetwork = (network: Network) => {
    if (network.type === "starknet") {
      return starknetConnected;
    } else {
      return evmConnected;
    }
  };

  // Update handleNetworkSelect to use global state
  const handleNetworkSelect = async (network: Network) => {
    // If appropriate wallet is connected, attempt to switch networks
    setCurrentNetwork(network);
  };

  // Handle Max button click
  const handleMaxClick = () => {
    if (!isCurrentTokenSupported || (!evmConnected && !starknetConnected))
      return;

    // Use the balance for the current network
    const currentChainId = currentNetwork?.chainId;
    let maxAmount = "0";

    if (currentChainId && allNetworkBalances?.[currentChainId]) {
      maxAmount = allNetworkBalances[currentChainId].formatted;
    } else {
      maxAmount = tokenBalance;
    }

    // Ensure we don't set an amount greater than the balance
    const maxBalanceNumber = parseFloat(maxAmount);
    if (maxBalanceNumber > 0) {
      setAmount(maxAmount);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[450px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-bold text-white">Swap</span>
          <div className="relative">
            {/* <Button
              variant="default"
              className="flex items-center gap-2 bg-[#232323] border-none px-3 md:px-4 py-2 rounded-full min-w-[80px] md:min-w-[90px]"
              onClick={() => setShowDropdown((v) => !v)}
              type="button"
            >
              <Image
                src={selectedCurrency.logo}
                alt={selectedCurrency.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-white text-sm md:text-base font-medium">
                {selectedCurrency.symbol}
              </span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button> */}

            <div className="flex items-center gap-2 bg-[#232323] border-none px-3 md:px-4 py-2 rounded-full min-w-[80px] md:min-w-[90px]">
              <Image
                src={selectedCurrency.logo}
                alt={selectedCurrency.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-white text-sm md:text-base font-medium pr-4">
                {selectedCurrency.symbol}
              </span>
            </div>
            <div
              className={`absolute left-0 mt-2 w-full bg-[#232323] rounded-2xl shadow-lg z-30 border border-[#6b6b6b] origin-top transition-all duration-200 ease-out transform ${
                showDropdown
                  ? "scale-100 opacity-100 pointer-events-auto"
                  : "scale-95 opacity-0 pointer-events-none"
              }`}
              style={{ minWidth: 150 }}
            >
              {assets.map((c) => (
                <button
                  key={c.symbol}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-colors gap-3 ${
                    selectedCurrency.symbol === c.symbol
                      ? "bg-[#353545]"
                      : "hover:bg-[#23232f]"
                  }`}
                  onClick={async () => {
                    await Promise.all([
                      setSelectedCurrency(c),
                      updateSelection({ asset: c }),
                    ]);

                    setShowDropdown(false);
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Image
                      src={c.logo}
                      alt={c.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="text-white font-medium text-lg">
                      {c.symbol}
                    </span>
                  </span>
                  {selectedCurrency.symbol === c.symbol && (
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#bcbcff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="bg-[#232323] border-none p-2 rounded-xl"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="3"
              stroke="#fff"
              strokeWidth="2"
            />
            <path
              d="M8 8h8v8"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </div>

      {/* From Panel */}
      <div className="mx-3 md:mx-4 mt-2 mb-2 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-200 text-base md:text-lg font-medium">
            From
          </span>
          <span className="text-neutral-400 text-xs md:text-sm">
            Balance:{" "}
            {(() => {
              if (balanceLoading) return "...";
              if (!isCurrentTokenSupported) return "0";

              // Show balance for current network
              const currentChainId = currentNetwork?.chainId;
              if (currentChainId && allNetworkBalances?.[currentChainId]) {
                return allNetworkBalances[currentChainId].isLoading
                  ? "..."
                  : allNetworkBalances[currentChainId].formatted;
              }
              return tokenBalance;
            })()}{" "}
            <span
              className={`ml-1 cursor-pointer ${
                isCurrentTokenSupported &&
                (evmConnected || starknetConnected) &&
                (() => {
                  const currentChainId = currentNetwork?.chainId;
                  const currentBalance =
                    currentChainId && allNetworkBalances?.[currentChainId]
                      ? allNetworkBalances[currentChainId].formatted
                      : tokenBalance;
                  return parseFloat(currentBalance) > 0;
                })()
                  ? "text-red-400 hover:text-red-300"
                  : "text-neutral-500 cursor-not-allowed"
              }`}
              onClick={handleMaxClick}
            >
              Max
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex-1 w-full">
            <NetworkSelector
              selectedNetwork={currentNetwork || networks[0]}
              onNetworkChange={handleNetworkSelect}
              canSwitch={canSwitchNetwork}
              buttonClassName="bg-black border-none px-2 md:px-4 rounded-full min-w-[100px] md:min-w-[120px]"
            />
          </div>
          <ValueInput
            maxBalance={(() => {
              const currentChainId = currentNetwork?.chainId;
              if (currentChainId && allNetworkBalances?.[currentChainId]) {
                return allNetworkBalances[currentChainId].formatted;
              }
              return tokenBalance;
            })()}
            isWalletConnected={evmConnected || starknetConnected}
            isBalanceLoading={
              balanceLoading ||
              (() => {
                const currentChainId = currentNetwork?.chainId;
                return !!(
                  currentChainId &&
                  allNetworkBalances?.[currentChainId]?.isLoading
                );
              })()
            }
          />
        </div>
      </div>

      {/* Arrow in the middle, visually bridging the two panels */}
      <div className="flex justify-center -my-6 z-20">
        <div
          className="bg-[#181818] border-4 !border-[#232323] rounded-xl p-2 md:p-3 shadow-lg flex items-center justify-center"
          style={{ width: 48, height: 48 }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 5v14m0 0l-5-5m5 5l5-5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* To Panel */}
      <div className="mx-3 md:mx-4 mb-2 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-200 text-base md:text-lg font-medium">
            To
          </span>
          {selectedCountryCurrency && (
            <span className="text-purple-400 text-xs md:text-sm font-medium cursor-pointer">
              Select beneficiary
            </span>
          )}
        </div>

        <SelectCountry />
      </div>

      {/* Recipient Details - Only show when a country is selected */}

      {/* Swap Info */}
      <ExchangeRateComponent />

      {country ? (
        <div className="px-3 md:px-4">
          <SelectInstitution />
        </div>
      ) : (
        <div className="px-3 md:px-4 mt-4">
          <SubmitButton disabled={!isAmountValid}>SWAP</SubmitButton>
        </div>
      )}

      {/* Transaction Review Modal */}
      <TransactionReviewModal />
    </div>
  );
}
