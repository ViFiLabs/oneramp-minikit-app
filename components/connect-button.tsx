"use client";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  VisuallyHidden,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/store/network";
import {
  useAppKit,
  useDisconnect as useDisconnectEVM,
} from "@reown/appkit/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ConnectedWalletCard from "./connected-wallet-card";
import { ChainTypes } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { getKYC } from "@/actions/kyc";
import { useKYCStore } from "@/store/kyc-store";
import { useUserSelectionStore } from "@/store/user-selection";

export const ConnectButton = ({ large }: { large?: boolean }) => {
  const { address, isConnected } = useWalletGetInfo();
  const { open } = useAppKit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { updateSelection } = useUserSelectionStore();

  const {
    setCurrentNetwork,
    addConnectedNetwork,
    connectedNetworks,
    removeConnectedNetwork,
    clearConnectedNetworks,
  } = useNetworkStore();
  const disconnectEvm = useDisconnectEVM();



  const { setKycData } = useKYCStore();

  const { mutate: getSaveKYCData } = useMutation({
    mutationFn: async () => await getKYC(address as string),
    onSuccess: (data) => {
      setKycData(data);
    },
  });

  useEffect(() => {
    if (address) {
      getSaveKYCData();
    }
  }, [address]);

  const handleSuccessfulEvmConnection = async () => {
    setCurrentNetwork(SUPPORTED_NETWORKS_WITH_RPC_URLS[0]);
    updateSelection({ pastedAddress: undefined });
    if (
      !connectedNetworks.some(
        (network) => network.id === SUPPORTED_NETWORKS_WITH_RPC_URLS[0].id
      )
    ) {
      addConnectedNetwork(SUPPORTED_NETWORKS_WITH_RPC_URLS[0]);
    }
  };


  const handleWalletTypeSelect = async (
    type?: "evm" | undefined
  ) => {
    const chainType = type;
    if (!chainType) {
      setDialogOpen(true);
      return;
    }
    if (chainType === "evm") {
      try {
        await open();
        await handleSuccessfulEvmConnection();
      } catch (error) {
        console.error("Failed to connect EVM wallet:", error);
      }
    }
  };

  const handleDisconnectCurrentWallet = async (type?: ChainTypes) => {
    const chainType = type;
    if (!chainType) {
      try {
        await Promise.all([
          Promise.resolve(disconnectEvm.disconnect()).catch((error: Error) => {
            console.error("Failed to disconnect EVM wallet:", error);
          }),
        ]);
        setCurrentNetwork(null);
        clearConnectedNetworks();
        updateSelection({ address: undefined, pastedAddress: undefined });
      } catch (error) {
        console.error("Error during wallet disconnection:", error);
      }
      return;
    }
    if (chainType === "evm") {
      try {
        await disconnectEvm.disconnect();
        connectedNetworks.forEach((network) => {
          if (network.type === ChainTypes.EVM) {
            removeConnectedNetwork(network);
          }
        });
        updateSelection({ address: undefined, pastedAddress: undefined });
      } catch (error) {
        console.error("Failed to disconnect EVM wallet:", error);
      }
    }
  };

  const hasAnyEvmNetwork = connectedNetworks.some(
    (network) => network.type === ChainTypes.EVM
  );


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger disabled={true} asChild>
        {isConnected ? (
          <Button
            className={cn(
              "rounded-full px-6 py-1.5 text-sm font-semibold transition-colors bg-neutral-800 hover:bg-neutral-700 text-white",
              large && "w-full h-14 rounded-lg text-lg "
            )}
            onClick={() => setDialogOpen(true)}
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Button>
        ) : (
          <Button
            className={cn(
              "rounded-full px-6 py-1.5 w-full text-sm font-semibold transition-colors bg-[#2563eb] hover:bg-[#1d4ed8] text-white",
              large && "w-full flex-1 p-6 text-lg rounded-xl "
            )}
            onClick={() => setDialogOpen(true)}
          >
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 shadow-2xl overflow-hidden
        /* Mobile: full screen behavior - for backwards compatibility */
        inset-0 w-screen h-screen max-w-none max-h-none translate-x-0 translate-y-0 top-0 left-0
        /* Desktop: centered modal */
        md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200 md:transform md:h-auto md:max-h-[80vh] md:inset-auto">
        <div className="h-14 mb-4 px-3 flex items-center justify-between">
          <h1 className="text-white text-xl font-semibold">My Wallets</h1>
          <DialogClose asChild>
            <button className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-[#232323] transition-colors">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </DialogClose>
        </div>
        <div className="flex flex-col gap-4 flex-1">
          {isConnected && hasAnyEvmNetwork ? (
            <ConnectedWalletCard
            // disconnect={() => handleDisconnectCurrentWallet(ChainTypes.EVM)}
            // network={ChainTypes.EVM}
            />
          ) : (
            <Button
              onClick={() => handleWalletTypeSelect("evm")}
              variant="outline"
              className="flex justify-start items-center gap-4 w-full h-16 border-[#232323] hover:bg-[#2a2a2a] rounded-2xl transition-all hover:scale-[1.02] border hover:border-[#353535] group"
            >
              <div className="p-2 bg-[#353535] rounded-lg group-hover:bg-[#454545] transition-colors">
                <Image
                  src="/logos/ethereum.png"
                  alt="EVM"
                  width={24}
                  height={24}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col items-start flex-1">
                <span className="text-white font-medium text-base">
                  EVM Wallet
                </span>
              </div>
              <div className="bg-white text-black rounded-md hover:bg-neutral-200 text-sm px-4 py-2 transition-colors">
                Connect
              </div>
            </Button>
          )}
        </div>
        {isConnected && (
          <Button
            className="w-full mt-5 rounded-lg text-base h-12 font-medium bg-[#9E2121] hover:bg-red-800"
            onClick={() => handleDisconnectCurrentWallet()}
          >
            Disconnect All
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
