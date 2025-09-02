"use client";

import { Button } from "@/components/ui/button";
import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import { Asset, Network } from "@/types";
import { useState } from "react";
import AssetCard from "../cards/asset-card";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  VisuallyHidden,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface TokenSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export function TokenSelectModal({ open, onClose }: TokenSelectModalProps) {
  const [searchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("All Networks");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);

  const { setCurrentNetwork } = useNetworkStore();
  const { updateSelection } = useUserSelectionStore();

  // Limit to supported tokens for selection
  const supportedSymbols = new Set(["USDC", "cNGN"]);

  // Filter tokens based on search query and selected network
  const filteredTokens = assets
    .filter((token) => supportedSymbols.has(token.symbol))
    .filter((token) => {
      const matchesSearch =
        searchQuery === "" ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase());

      // For visibility, only require that the token declares the network; do not require tokenAddress
      const matchesNetwork =
        selectedNetwork === "All Networks" ||
        (selectedNetwork !== "All Networks" && token.networks[selectedNetwork]);

      return matchesSearch && matchesNetwork;
    });

  if (!open) return null;

  const handleTokenSelect = (token: Asset, network: Network) => {
    setCurrentNetwork(network);

    updateSelection({
      asset: token,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg" />
        <DialogPrimitive.Content
          className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 w-full max-w-none shadow-2xl overflow-hidden
          /* Mobile: bottom sheet behavior */
          bottom-0 left-0 right-0 rounded-t-2xl animate-slide-up-smooth
          /* Desktop: centered modal */
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200
          desktop-modal-center"
          style={{
            padding: 0,
            maxHeight: "60vh",
            minHeight: "auto",
            height: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select Token</DialogPrimitive.Title>
          </VisuallyHidden>
          {/* Header */}
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-[#232323] flex-shrink-0 rounded-t-2xl">
            <h2 className="text-lg md:text-xl font-bold text-white">
              Select A Token
            </h2>
            <Button
              variant="ghost"
              className="text-neutral-400 hover:text-white p-2"
              onClick={onClose}
            >
              <X className="text-white w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>

          {/* Search and Filter Area */}
          <div className="p-4  gap-3 flex-col hidden">
            {/* Search Input */}
            {/* <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="#888"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a currency"
              className="w-full bg-[#23232a] text-white placeholder:text-[#aaa] py-4 pl-12 pr-4 rounded-full border border-[#333] shadow-sm focus:outline-none focus:border-[#bcbcff] focus:ring-2 focus:ring-[#bcbcff]/20 transition-all text-lg"
            />
          </div> */}

            {/* Network Filter Dropdown */}
            <div className="relative flex-1 min-w-[160px]">
              {/* <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="w-full bg-[#23232a] text-white py-4 px-6 rounded-full border border-[#333] flex items-center gap-2 justify-between shadow-sm focus:outline-none focus:border-[#bcbcff] focus:ring-2 focus:ring-[#bcbcff]/20 transition-all text-lg"
            >
              <span>{selectedNetwork}</span>
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                className={`transition-transform ${
                  showNetworkDropdown ? "rotate-180" : ""
                }`}
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button> */}

              {/* Network Dropdown Menu */}
              {showNetworkDropdown && (
                <div className="absolute right-0 mt-2 bg-[#23232a] border border-[#333] rounded-xl w-full z-10 shadow-lg">
                  <Button
                    key="all-networks"
                    className={`w-full text-left px-4 py-2 text-white hover:bg-[#3a4155] ${
                      selectedNetwork === "All Networks" ? "bg-[#3a4155]" : ""
                    }`}
                    onClick={() => {
                      setSelectedNetwork("All Networks");
                      setShowNetworkDropdown(false);
                    }}
                  >
                    All Networks
                  </Button>
                  {SUPPORTED_NETWORKS_WITH_RPC_URLS.map((network) => (
                    <Button
                      key={network.name}
                      className={`w-full text-left px-4 py-2 text-white hover:bg-[#3a4155] ${
                        selectedNetwork === network.name ? "bg-[#3a4155]" : ""
                      }`}
                      onClick={() => {
                        setSelectedNetwork(network.name);
                        setShowNetworkDropdown(false);
                      }}
                    >
                      {network.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Token List */}
          <div
            className="overflow-y-auto pb-2 px-4 md:px-6 flex-1"
            style={{ height: "calc(65vh - 120px)" }}
          >
            {filteredTokens.length > 0 ? (
              selectedNetwork === "All Networks" ? (
                // Show all tokens grouped by networks
                SUPPORTED_NETWORKS_WITH_RPC_URLS.map((network) =>
                  filteredTokens
                    .filter((token) => token.networks[network.name])
                    .map((token) => (
                      <AssetCard
                        key={`${token.symbol}-${network.name}`}
                        token={token}
                        network={network}
                        handleTokenSelect={handleTokenSelect}
                      />
                    ))
                )
              ) : (
                // Show tokens for selected network
                filteredTokens
                  .filter((token) => token.networks[selectedNetwork])
                  .map((token) => (
                    <AssetCard
                      key={`${token.symbol}-${selectedNetwork}`}
                      token={token}
                      network={token.networks[selectedNetwork] as Network}
                      handleTokenSelect={handleTokenSelect}
                    />
                  ))
              )
            ) : (
              <div className="p-4 text-center text-neutral-400">
                No tokens found matching your criteria
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
