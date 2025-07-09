"use client";

import { Button } from "@/components/ui/button";
import { SUPPORTED_NETWORKS } from "@/data/networks";
import { useAppKitNetwork } from "@reown/appkit/react";

import type { Chain } from "viem";

// Create a component with your custom button
function NetworkSwitcher() {
  // Access the WalletKit context
  const { caipNetwork, switchNetwork } = useAppKitNetwork();

  // Handle the network switch when your button is clicked
  const handleNetworkSwitch = (network: Chain) => {
    switchNetwork(network);
  };

  return (
    <div className="flex flex-col gap-4 ">
      {SUPPORTED_NETWORKS.map((network) => (
        <Button
          key={network.id}
          onClick={() => handleNetworkSwitch(network as Chain)}
          variant="outline"
        >
          Switch to {network.name}
        </Button>
      ))}
      <appkit-button />
      <div className="text-sm text-gray-500">
        Current network: {caipNetwork?.name}
      </div>
    </div>
  );
}

export default NetworkSwitcher;
