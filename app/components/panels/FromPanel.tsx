"use client";

import { useTokenBalance } from "@/hooks/useTokenBalance";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { Asset, Network } from "@/types";
import { useAccount as useStarknetAccount } from "@starknet-react/core";
import ValueInput from "../inputs/ValueInput";
import { NetworkSelector } from "../NetworkSelector";

interface FromPanelProps {
  selectedCurrency: Asset;
  networks: Network[];
  canSwitchNetwork: (network: Network) => boolean;
  onNetworkSelect: (network: Network) => Promise<void>;
}

export function FromPanel({
  selectedCurrency,
  networks,
  canSwitchNetwork,
  onNetworkSelect,
}: FromPanelProps) {
  const { currentNetwork } = useNetworkStore();
  const { setAmount } = useAmountStore();

  // Wallet connection states
  const { isConnected: evmConnected } = useWalletGetInfo();
  const { address: starknetAddress } = useStarknetAccount();
  const starknetConnected = !!starknetAddress;

  // Token balance hook
  const {
    formatted: tokenBalance,
    isLoading: balanceLoading,
    allNetworkBalances,
  } = useTokenBalance(selectedCurrency.symbol);

  // Check if current token is supported on the current network
  const isCurrentTokenSupported =
    selectedCurrency.networks && currentNetwork?.chainId
      ? !!selectedCurrency.networks[
          currentNetwork.name as keyof typeof selectedCurrency.networks
        ]
      : false;

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

  const getCurrentBalance = () => {
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
  };

  const getMaxBalance = () => {
    const currentChainId = currentNetwork?.chainId;
    if (currentChainId && allNetworkBalances?.[currentChainId]) {
      return allNetworkBalances[currentChainId].formatted;
    }
    return tokenBalance;
  };

  const isBalanceLoading = () => {
    if (balanceLoading) return true;
    const currentChainId = currentNetwork?.chainId;
    return !!(
      currentChainId && allNetworkBalances?.[currentChainId]?.isLoading
    );
  };

  const canClickMax = () => {
    return (
      isCurrentTokenSupported &&
      (evmConnected || starknetConnected) &&
      parseFloat(getCurrentBalance()) > 0
    );
  };

  return (
    <div className="mx-3 md:mx-4 my-1 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-neutral-200 text-base md:text-lg font-medium">
          From
        </span>
        <span className="text-neutral-400 text-xs md:text-sm">
          Balance: {getCurrentBalance()}{" "}
          <span
            className={`ml-1 cursor-pointer ${
              canClickMax()
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
            onNetworkChange={onNetworkSelect}
            canSwitch={canSwitchNetwork}
            buttonClassName="bg-black border-none px-2 md:px-4 rounded-full min-w-[100px] md:min-w-[120px]"
          />
        </div>
        <ValueInput
          maxBalance={getMaxBalance()}
          isWalletConnected={evmConnected || starknetConnected}
          isBalanceLoading={isBalanceLoading()}
        />
      </div>
    </div>
  );
}
