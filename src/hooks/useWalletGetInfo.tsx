"use client";

import { useNetworkStore } from "@/src/store/network";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { useUserSelectionStore } from "@/src/store/user-selection";

const useWalletInfo = () => {
  const { currentNetwork } = useNetworkStore();

  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const { pastedAddress } = useUserSelectionStore();

  // EVM Wallet data
  const { address: evmAddress, isConnected: evmIsConnected } =
    useAppKitAccount();
  const { chainId: evmChainId } = useAppKitNetwork();

  useEffect(() => {
    // Set the address and isConnected state based on the current network
    if (currentNetwork?.type === "evm" && evmAddress) {
      setAddress(evmAddress);
      setIsConnected(evmIsConnected);
      setChainId(
        typeof evmChainId === "string"
          ? parseInt(evmChainId)
          : evmChainId ?? null
      );
      return;
    }
    if (currentNetwork?.type === "evm" && !evmIsConnected) {
      if (pastedAddress && pastedAddress !== "") {
        setAddress(pastedAddress);
        setIsConnected(true);
        setChainId(null);
        return;
      }

      setAddress(null);
      setIsConnected(false);
      setChainId(null);
      return;
    }
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
  }, [currentNetwork, evmAddress, evmIsConnected, evmChainId, pastedAddress]);

  return {
    address,
    isConnected,
    chainId,
  };
};

export default useWalletInfo;
