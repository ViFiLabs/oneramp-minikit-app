"use client";

import { useNetworkStore } from "@/store/network";
import {
  useAppKitAccount,
  useAppKitEvents,
  useAppKitNetwork,
  useAppKitState,
  useAppKitTheme,
} from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { useClientMounted } from "./useClientMounted";
import { useUserSelectionStore } from "@/store/user-selection";

const useWalletInfo = () => {
  const { currentNetwork } = useNetworkStore();

  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const { pastedAddress } = useUserSelectionStore();

  // EVM Wallet data
  const kitTheme = useAppKitTheme();
  const state = useAppKitState();
  const {
    address: evmAddress,
    caipAddress,
    isConnected: evmIsConnected,
    embeddedWalletInfo,
  } = useAppKitAccount();
  const events = useAppKitEvents();
  const mounted = useClientMounted();
  const {
    chainId: evmChainId,
    caipNetworkId,
    caipNetwork,
  } = useAppKitNetwork();



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
  }, [
    currentNetwork,
    evmAddress,
    evmIsConnected,
    evmChainId,
    pastedAddress,
  ]);

  return {
    kitTheme,
    state, //
    address, //
    caipAddress,
    isConnected, 
    embeddedWalletInfo,
    events,
    mounted,
    chainId, //
    caipNetworkId,
    caipNetwork,
  };
};

export default useWalletInfo;
