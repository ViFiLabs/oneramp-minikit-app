"use client";

import { Button } from "@/src/components/ui/button";
import { Network } from "@/types";
import Image from "next/image";

interface SwapHeaderProps {
  selectedNetwork?: Network;
  onNetworkChange?: (network: Network) => void;
  availableNetworks?: Network[];
  onSettingsClick?: () => void;
}

export function SwapPanelHeader({
  selectedNetwork,
  onNetworkChange,
  availableNetworks,
  onSettingsClick,
}: SwapHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 pt-6 pb-2">
      <div className="flex items-center gap-3">
        <span className="text-xl md:text-2xl font-bold text-white">Swap</span>
        {selectedNetwork && (
          <Button
            variant="outline"
            className="bg-[#1E40AF] border-none rounded-full px-3 py-1 h-auto flex items-center gap-2"
            onClick={() => {
              // Toggle between available networks (simplified for demo)
              if (availableNetworks && onNetworkChange) {
                const currentIndex = availableNetworks.findIndex(
                  (net) => net.name === selectedNetwork.name
                );
                const nextIndex = (currentIndex + 1) % availableNetworks.length;
                onNetworkChange(availableNetworks[nextIndex]);
              }
            }}
          >
            <Image
              src={selectedNetwork.logo}
              alt={selectedNetwork.name}
              width={20}
              height={20}
            />
            <span className="text-white font-medium text-sm">
              {selectedNetwork.name}
            </span>
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        className="bg-[#232323] border-none p-2 rounded-xl"
        onClick={onSettingsClick}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
            stroke="#fff"
            strokeWidth="2"
          />
          <path
            d="M8 8h8v8"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Button>
    </div>
  );
}
