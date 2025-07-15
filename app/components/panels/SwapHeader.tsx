"use client";

import { Button } from "@/components/ui/button";
import { Asset } from "@/types";
import { CurrencySelector } from "./CurrencySelector";

interface SwapHeaderProps {
  selectedCurrency: Asset;
  onCurrencyChange: (currency: Asset) => void;
  onSettingsClick?: () => void;
}

export function SwapHeader({
  selectedCurrency,
  onCurrencyChange,
  onSettingsClick,
}: SwapHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 pt-6 pb-2">
      <div className="flex items-center gap-3">
        <span className="text-xl md:text-2xl font-bold text-white">Swap</span>
        <CurrencySelector
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
        />
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
