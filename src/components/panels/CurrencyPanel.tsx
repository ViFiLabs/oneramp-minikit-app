"use client";

import { Asset } from "@/types";
import { Button } from "../ui/button";

interface CurrencyPanelProps {
  title: string;
  selectedCurrency: Asset;
  onCurrencyChange: (currency: Asset) => void;
  availableAssets: Asset[];
  amount?: string;
  balance?: string;
  isFrom?: boolean;
  onAmountChange?: (amount: string) => void;
  excludeCurrency?: Asset; // Currency to exclude from selection
  onMaxClick?: () => void; // Handler for Max button click
}

export function CurrencyPanel({
  title,
  selectedCurrency,
  onCurrencyChange,
  availableAssets,
  amount = "0",
  balance = "--",
  isFrom = false,
  onAmountChange,
  excludeCurrency,
  onMaxClick,
}: CurrencyPanelProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onAmountChange) {
      onAmountChange(e.target.value);
    }
  };

  // Filter out the excluded currency from available options
  const filteredAssets = excludeCurrency 
    ? availableAssets.filter(asset => asset.symbol !== excludeCurrency.symbol)
    : availableAssets;

  return (
    <div className="mx-3 md:mx-4 my-1 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-neutral-400 text-sm md:text-base font-medium">
          {title}
        </span>
        {isFrom && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span>Balance: {balance}</span>
            <button 
              onClick={onMaxClick}
              className="text-orange-400 font-medium hover:text-orange-300 transition-colors text-sm"
            >
              Max
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline" 
            className="bg-black border-none rounded-full px-4 py-2 h-auto flex items-center gap-2"
            onClick={() => {
              // Toggle between available currencies (excluding the other panel's currency)
              const currentIndex = filteredAssets.findIndex(asset => asset.symbol === selectedCurrency.symbol);
              const nextIndex = (currentIndex + 1) % filteredAssets.length;
              onCurrencyChange(filteredAssets[nextIndex]);
            }}
          >
            <img 
              src={selectedCurrency.logo} 
              alt={selectedCurrency.symbol} 
              className="w-6 h-6"
            />
            <span className="text-white font-medium text-lg">
              {selectedCurrency.symbol}
            </span>
          </Button>
        </div>
        
        <div className="text-right">
          {isFrom ? (
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              className="hide-number-spinner text-white text-2xl md:text-3xl font-semibold bg-transparent border-none outline-none text-right w-32"
              placeholder="0"
            />
          ) : (
            <div className="text-white text-2xl md:text-3xl font-semibold">
              {amount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}