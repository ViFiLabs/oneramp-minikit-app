"use client";
import { ConnectButton } from "@/components/connect-button";
import { useNetworkStore } from "@/store/network";
import { useDisconnect } from "@reown/appkit/react";
import { useAccount as useStarknetAccount } from "@starknet-react/core";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useBalance, useToken } from "wagmi";
import { WalletDetailsModal } from "./WalletDetailsModal";

interface AppKitAccount {
  address?: string;
}

interface AppKit {
  subscribeAccount: (callback: (account: AppKitAccount) => void) => () => void;
  disconnect?: () => void;
}

declare global {
  interface Window {
    appKit?: AppKit;
  }
}

export function Header({ logoOnly }: { logoOnly?: boolean }) {
  // Track both wallet types separately
  const [evmConnected, setEvmConnected] = useState(false);
  const [evmAddress, setEvmAddress] = useState<string | undefined>();
  const [starknetConnected, setStarknetConnected] = useState(false);
  const [starknetWalletAddress, setStarknetWalletAddress] = useState<
    string | undefined
  >();

  // const [setShowWalletModal] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);

  // // Network state from Zustand
  const { currentNetwork, setCurrentNetwork, supportedNetworks } =
    useNetworkStore();

  const { disconnect } = useDisconnect();

  // Get current token address
  const currentTokenAddress = currentNetwork?.tokenAddress;

  // Balance hooks with token tracking
  const { data: evmBalance } = useBalance({
    address: evmAddress as `0x${string}`,
    token: currentTokenAddress as `0x${string}`,
    query: {
      enabled: !!evmAddress && !!currentTokenAddress,
    },
  });

  // // Token details
  const { data: tokenData } = useToken({
    address: currentTokenAddress as `0x${string}`,
    query: {
      enabled: !!currentTokenAddress,
    },
  });

  // Get Starknet account
  const { address: starknetAddress } = useStarknetAccount();

  // Listen for AppKit connection changes for EVM
  useEffect(() => {
    // Get the appKit instance that was created in WalletConnectionModal
    const appKit = window.appKit;
    if (!appKit) return;
    const unsubscribe = appKit.subscribeAccount((account: AppKitAccount) => {
      if (account?.address) {
        setEvmConnected(true);
        setEvmAddress(account.address);
      } else {
        setEvmConnected(false);
        setEvmAddress(undefined);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Check if connected to Starknet
  useEffect(() => {
    if (starknetAddress) {
      setStarknetConnected(true);
      setStarknetWalletAddress(starknetAddress);
    } else {
      setStarknetConnected(false);
      setStarknetWalletAddress(undefined);
    }
  }, [starknetAddress]);

  // Listen for network changes
  useEffect(() => {
    const appKit = window.appKit;
    if (!appKit) return;
    const handleChainChanged = async (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const network = supportedNetworks.find((n) => n.chainId === chainId);
      if (network) {
        setCurrentNetwork(network);
      }
    };
    const ethereum = window.ethereum;
    if (ethereum && typeof ethereum === "object") {
      const provider = ethereum as {
        on: (event: string, callback: (chainId: string) => void) => void;
        removeListener: (
          event: string,
          callback: (chainId: string) => void
        ) => void;
      };
      provider.on("chainChanged", handleChainChanged);
      return () => {
        provider.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [supportedNetworks, setCurrentNetwork]);

  // Determine what to show on the connect wallet button
  const anyWalletConnected = evmConnected || starknetConnected;
  // const primaryAddress = evmConnected ? evmAddress : starknetWalletAddress;

  const handleConnectFromDetails = () => {
    // Close wallet details modal first
    setShowWalletDetails(false);

    // Show the connect wallet modal to connect the new wallet
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  // Format balance display
  const formattedBalance = evmBalance
    ? `$${parseFloat(evmBalance?.formatted || "0").toFixed(2)}`
    : "$0.00";

  // Get token symbol safely
  const tokenSymbol = tokenData?.symbol?.toLowerCase() || "usdc";

  return (
    <nav className="w-full  ">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center">
        {/* Logo */}
        {logoOnly ? (
          <div className=" items-center hidden md:flex">
            <div className="block md:hidden ">
              <Image
                src="/large.png"
                alt="OneRamp"
                width={32}
                height={32}
                priority
                className="rounded-full"
              />
            </div>
            <div className="hidden md:block ">
              <Image
                src="/large.png"
                alt="OneRamp"
                width={100}
                height={32}
                priority
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {evmBalance && (
                <div className="hidden md:flex items-center px-3 py-1.5 bg-[#222222] rounded-full">
                  <Image
                    src={`/logos/${tokenSymbol}.svg`}
                    alt={tokenData?.symbol || "USDC"}
                    width={16}
                    height={16}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-white">
                    {formattedBalance}
                  </span>
                </div>
              )}

              <ConnectButton />
            </div>
          </>
        )}
      </div>

      {/* Wallet Connection Modal */}
      {/* <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        buttonPosition={buttonPosition}
        onConnect={handleWalletConnect}
      /> */}

      {/* Wallet Details Modal */}
      {anyWalletConnected && (
        <WalletDetailsModal
          isOpen={showWalletDetails}
          onClose={() => setShowWalletDetails(false)}
          evmAddress={evmAddress}
          evmConnected={evmConnected}
          starknetAddress={starknetWalletAddress}
          starknetConnected={starknetConnected}
          onDisconnect={handleDisconnect}
          onConnectWallet={handleConnectFromDetails}
        />
      )}
    </nav>
  );
}
