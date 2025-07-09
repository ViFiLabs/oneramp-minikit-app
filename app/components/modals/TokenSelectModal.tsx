import { Button } from "@/components/ui/button";
import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import { Asset, Network } from "@/types";
import { useState } from "react";
import AssetCard from "../cards/asset-card";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { X } from "lucide-react";

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

  // Filter tokens based on search query and selected network
  const filteredTokens = assets.filter((token) => {
    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by network if a specific network is selected
    const matchesNetwork =
      selectedNetwork === "All Networks" ||
      Object.keys(token.networks).includes(selectedNetwork);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-[#232323] w-full max-w-md shadow-2xl h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center py-4 border-b border-[#3a4155]">
          <Button
            variant="ghost"
            className="text-neutral-400 hover:text-white mr-4"
            onClick={onClose}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 12H5M5 12l7-7m-7 7l7 7"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <h3 className="text-xl text-white font-medium flex-1 text-center">
            Select A Token
          </h3>

          <Button
            variant="ghost"
            className="text-neutral-400 hover:text-white mr-4"
            onClick={onClose}
          >
            <X className="text-white" />
          </Button>
        </div>

        {/* Search and Filter Area */}
        <div className="p-4 flex gap-3 flex-col sm:flex-row">
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
        <div className="overflow-y-auto flex-1">
          {filteredTokens.length > 0 ? (
            selectedNetwork === "All Networks" ? (
              // Show all tokens grouped by networks
              SUPPORTED_NETWORKS_WITH_RPC_URLS.map((network) =>
                filteredTokens.map((token) => {
                  // Only show if token exists on this network
                  if (!token.networks[network.name]) return null;

                  return (
                    <AssetCard
                      key={`${token.symbol}-${network.name}`}
                      token={token}
                      network={network}
                      handleTokenSelect={handleTokenSelect}
                    />
                  );
                })
              )
            ) : (
              // Show tokens for selected network
              filteredTokens.map((token) => {
                if (!token.networks[selectedNetwork]) return null;

                return (
                  <AssetCard
                    key={`${token.symbol}-${selectedNetwork}`}
                    token={token}
                    network={token.networks[selectedNetwork] as Network}
                    handleTokenSelect={handleTokenSelect}
                  />
                );
              })
            )
          ) : (
            <div className="p-4 text-center text-neutral-400">
              No tokens found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
