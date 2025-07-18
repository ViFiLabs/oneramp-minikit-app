"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/app/components/ui/button";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { useDisconnect as useDisconnectEVM } from "@reown/appkit/react";

import Image from "next/image";
import { ConnectButton } from "./connect-button";

const ConnectedWalletCard = () => {
  const { address } = useWalletGetInfo();
  const disconnectEvm = useDisconnectEVM();
  const { updateSelection } = useUserSelectionStore();
  const { setCurrentNetwork, clearConnectedNetworks } = useNetworkStore();

  if (!address) {
    return <ConnectButton />;
  }

  const networkLogo = "/logos/base.png";

  const handleDisconnectWallet = async () => {
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
  };

  return (
    <Card className="!bg-neutral-800 !border-none text-white px-0 py-4">
      <CardHeader>
        <CardTitle className="flex flex-row w-full items-center gap-3">
          <div className="size-12 !bg-neutral-600 rounded-full relative overflow-hidden">
            <Image
              src={networkLogo}
              alt="Ethereum"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-white text-base font-medium">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <span className="text-neutral-400 text-sm">Base Wallet</span>
          </div>
          <Button
            onClick={handleDisconnectWallet}
            className="!text-red-400 rounded-lg hover:!text-red-500 !border-red-400 transition-colors"
          >
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ConnectedWalletCard;
