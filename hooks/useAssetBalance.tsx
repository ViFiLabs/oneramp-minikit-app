import { useTokenBalance } from "@/hooks/useTokenBalance";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useNetworkStore } from "@/store/network";
import { Asset } from "@/types";
import { useMemo } from "react";

export function useAssetBalance(selectedAsset: Asset | null) {
  const { currentNetwork } = useNetworkStore();
  const { isConnected: evmConnected } = useWalletGetInfo();

  // Token balance hook with caching
  const {
    formatted: tokenBalance,
    isLoading: balanceLoading,
    allNetworkBalances,
    error: balanceError,
  } = useTokenBalance(selectedAsset?.symbol || "");

  // Memoized calculations to prevent unnecessary re-renders
  const balanceData = useMemo(() => {
    // Check if current token is supported on the current network
    const isCurrentTokenSupported =
      selectedAsset?.networks && currentNetwork?.chainId
        ? !!selectedAsset.networks[
            currentNetwork.name as keyof typeof selectedAsset.networks
          ]
        : false;

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

    const canUseMaxBalance = () => {
      return (
        isCurrentTokenSupported &&
        evmConnected &&
        parseFloat(getCurrentBalance()) > 0
      );
    };

    return {
      currentBalance: getCurrentBalance(),
      maxBalance: getMaxBalance(),
      isLoading: isBalanceLoading(),
      canUseMax: canUseMaxBalance(),
      isConnected: evmConnected,
      isTokenSupported: isCurrentTokenSupported,
      error: balanceError,
    };
  }, [
    selectedAsset?.networks,
    currentNetwork?.chainId,
    currentNetwork?.name,
    balanceLoading,
    allNetworkBalances,
    tokenBalance,
    evmConnected,
    balanceError,
  ]);

  return balanceData;
}
