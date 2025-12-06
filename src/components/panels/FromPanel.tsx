"use client";

import { useTokenBalance } from "@/src/hooks/useTokenBalance";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useAmountStore } from "@/src/store/amount-store";
import { useNetworkStore } from "@/src/store/network";
import { Asset, Network } from "@/types";
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
    if (!isCurrentTokenSupported || !evmConnected) return;

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
      // Subtract a small buffer (0.01 tokens) for gas fees to prevent transaction failures
      const gasBuffer = 0.01;
      const adjustedAmount = Math.max(0, maxBalanceNumber - gasBuffer);

      // Format the adjusted amount to 2 decimal places
      const formattedAmount = adjustedAmount.toFixed(2);
      setAmount(formattedAmount);
    }
  };

  const getCurrentBalance = () => {
    if (balanceLoading) return "...";
    if (!isCurrentTokenSupported) return "0";

    // Show balance for current network
    const currentChainId = currentNetwork?.chainId;
    let balance = "0";

    if (currentChainId && allNetworkBalances?.[currentChainId]) {
      if (allNetworkBalances[currentChainId].isLoading) {
        return "...";
      }
      balance = allNetworkBalances[currentChainId].formatted;
    } else {
      balance = tokenBalance;
    }

    // Subtract a small buffer for gas fees to show the actual usable amount
    const balanceNumber = parseFloat(balance);
    const gasBuffer = 0.01;
    const adjustedBalance = Math.max(0, balanceNumber - gasBuffer);

    return adjustedBalance.toFixed(2);
  };

  const getMaxBalance = () => {
    const currentChainId = currentNetwork?.chainId;
    let balance = "0";

    if (currentChainId && allNetworkBalances?.[currentChainId]) {
      balance = allNetworkBalances[currentChainId].formatted;
    } else {
      balance = tokenBalance;
    }

    // Subtract a small buffer for gas fees to prevent transaction failures
    const balanceNumber = parseFloat(balance);
    const gasBuffer = 0.01;
    const adjustedBalance = Math.max(0, balanceNumber - gasBuffer);

    return adjustedBalance.toFixed(2);
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
      evmConnected &&
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
          isWalletConnected={evmConnected}
          isBalanceLoading={isBalanceLoading()}
        />
      </div>
    </div>
  );
}
