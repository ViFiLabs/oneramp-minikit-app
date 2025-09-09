"use client";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, VisuallyHidden } from "@/app/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { cn } from "@/lib/utils";
import { useNetworkStore } from "@/store/network";
import {
  useAppKit,
  // useDisconnect as useDisconnectEVM,
} from "@reown/appkit/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ConnectedWalletCard from "./connected-wallet-card";
import { ChainTypes } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { getKYC } from "@/actions/kyc";
import { useKYCStore } from "@/store/kyc-store";
import { useUserSelectionStore } from "@/store/user-selection";
import TransactionsModal from "../modals/transactions-modal";

export const ModalConnectButton = ({ large }: { large?: boolean }) => {
  const { address, isConnected } = useWalletGetInfo();
  const { open } = useAppKit();
  // const { resetQuote } = useQuoteStore();
  // const { resetTransfer } = useTransferStore();
  const [modalOpen, setModalOpen] = useState(false);
  const { updateSelection } = useUserSelectionStore();

  const {
    setCurrentNetwork,
    addConnectedNetwork,
    connectedNetworks,
    // removeConnectedNetwork,
    // clearConnectedNetworks,
  } = useNetworkStore();
  // const disconnectEvm = useDisconnectEVM();

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
    // Set the current network to the EVM network
    setCurrentNetwork(SUPPORTED_NETWORKS_WITH_RPC_URLS[0]);
    updateSelection({ pastedAddress: undefined });

    // First check if the network is already connected
    if (
      !connectedNetworks.some(
        (network) => network.id === SUPPORTED_NETWORKS_WITH_RPC_URLS[0].id
      )
    ) {
      addConnectedNetwork(SUPPORTED_NETWORKS_WITH_RPC_URLS[0]);
    }
  };

  const handleWalletTypeSelect = async (type?: "evm" | undefined) => {
    const chainType = type;

    if (!chainType) {
      setModalOpen(true);
      return;
    }

    if (chainType === "evm") {
      setModalOpen(false);
      try {
        await open();
        // Only update networks if the wallet was successfully connected
        await handleSuccessfulEvmConnection();
      } catch (error) {
        console.error("Failed to connect EVM wallet:", error);
      }
    }
  };

  const hasAnyEvmNetwork = connectedNetworks.some(
    (network) => network.type === ChainTypes.EVM
  );

  return (
    <>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <Button
            // disabled={true}
            className={cn(
              "rounded-full  px-6 py-1.5 text-sm font-semibold transition-colors bg-neutral-800 hover:bg-neutral-700 text-white",
              large && "w-full h-14 rounded-lg text-lg "
            )}
            onClick={() => setModalOpen(true)}
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </Button>

          {/* Add a navigate to recent transactions button with the relevant icon */}
          <TransactionsModal />
        </div>
      ) : (
        <Button
          onClick={() => setModalOpen(true)}
          className={cn(
            "rounded-full px-6 py-1.5 my-4 text-sm font-semibold transition-colors !bg-[#2563eb] hover:!bg-[#1d4ed8] text-white",
            large && "w-full flex-1 p-6 text-lg rounded-xl "
          )}
        >
          Connect Wallet
        </Button>
        // <CoinbaseWallet />
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/60 backdrop-blur-lg fixed inset-0 z-40 md:bg-black/60 md:backdrop-blur-lg" />
          <DialogPrimitive.Content
            className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 shadow-2xl overflow-hidden
            /* Mobile: bottom sheet behavior */
            bottom-0 left-0 right-0 w-full rounded-t-3xl animate-slide-up-smooth
            /* Desktop: centered modal */
            md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200 md:transform
            desktop-modal-center"
            style={{
              padding: 0,
              height: "auto",
              maxHeight: "60vh",
              minHeight: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <VisuallyHidden>
              <DialogPrimitive.Title>My Wallets</DialogPrimitive.Title>
            </VisuallyHidden>
            {/* Mobile pull indicator - only show on mobile */}
            <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mt-3 mb-4 md:hidden"></div>
            <div className="h-14 mb-4 px-5 flex items-center justify-between">
              <h1 className="text-white text-xl font-semibold">My Wallets</h1>
              {/* Desktop close button - only show on desktop */}
              <button
                onClick={() => setModalOpen(false)}
                className="hidden md:block text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-[#232323] transition-colors"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 px-4 pb-8">
            <>
              {isConnected && hasAnyEvmNetwork ? (
                <ConnectedWalletCard />
              ) : (
                <Button
                  onClick={() => handleWalletTypeSelect("evm")}
                  // variant="outline"
                  className="flex justify-start items-center gap-4 w-full h-16 hover:!bg-[#2a2a2a] rounded-2xl transition-all hover:scale-[1.02] bg-transparent group"
                >
                  <div className="p-2 bg-[#353535] rounded-lg group-hover:bg-[#454545] transition-colors">
                    <Image
                      src="/logos/base.png"
                      alt="EVM"
                      width={24}
                      height={24}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-white font-medium text-base">
                      Base Wallet
                    </span>
                  </div>
                  <div className="bg-white text-black rounded-md hover:bg-neutral-200 text-sm px-4 py-2 transition-colors">
                    Connect
                  </div>
                </Button>
              )}
            </>
          </div>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
};
