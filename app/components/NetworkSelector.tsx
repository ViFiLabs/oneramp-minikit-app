import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { NetworkSelectModal } from "./modals/NetworkSelectModal";
import { Network } from "@/types";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import { cn } from "@/lib/utils";
// import { useNetworkStore } from "@/store/network";

interface NetworkSelectorProps {
  selectedNetwork: Network;
  onNetworkChange: (network: Network) => void;
  canSwitch?: (network: Network) => boolean;
  buttonClassName?: string;
  iconSize?: number;
  disabled?: boolean;
}

export function NetworkSelector({
  selectedNetwork,
  onNetworkChange,
  canSwitch,
  buttonClassName = "",
  iconSize = 28,
  disabled = true,
}: NetworkSelectorProps) {
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const handleNetworkSelect = (network: Network) => {
    onNetworkChange(network);
    setShowNetworkModal(false);
  };

  return (
    <div className="relative">
      <Button
        variant="default"
        className={cn(
          "flex items-center gap-2 bg-black border-none p-4 rounded-full min-w-[120px]",
          buttonClassName
        )}
        onClick={() => setShowNetworkModal(true)}
        type="button"
        disabled={disabled}
      >
        <Image
          src={selectedNetwork.logo}
          alt={selectedNetwork.name}
          width={iconSize}
          height={iconSize}
          className="rounded-full"
        />
        <span className="text-white font-medium">{selectedNetwork.name}</span>
        {/* <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 10l5 5 5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg> */}
      </Button>

      <NetworkSelectModal
        open={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        networks={SUPPORTED_NETWORKS_WITH_RPC_URLS}
        selectedNetwork={selectedNetwork}
        onSelect={handleNetworkSelect}
        canSwitch={canSwitch}
      />
    </div>
  );
}
