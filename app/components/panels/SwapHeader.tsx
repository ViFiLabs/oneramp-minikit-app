"use client";

import { Button } from "@/components/ui/button";
import { Asset } from "@/types";
import { CurrencySelector } from "./CurrencySelector";
import Image from "next/image";

interface SwapHeaderProps {
  selectedCurrency: Asset;
  onCurrencyChange: (currency: Asset) => void;
  availableAssets?: Asset[];
  onSettingsClick?: () => void;
  disableAssetSelection?: boolean;
  title?: string;
}

export function SwapHeader({
  selectedCurrency,
  onCurrencyChange,
  availableAssets,
  onSettingsClick,
  disableAssetSelection,
  title = "Swap",
}: SwapHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 pt-6 pb-2">
      <div className="flex items-center gap-3">
        <span className="text-xl md:text-2xl font-bold text-white">
          {title}
        </span>
        {disableAssetSelection ? (
          <div className="flex items-center bg-black rounded-full px-3 py-1 select-none cursor-not-allowed opacity-90">
            <Image
              src="/logos/cngn.png"
              alt="cNGN"
              width={18}
              height={18}
              className="rounded-full mr-2"
            />
            <span className="text-white text-sm font-medium">cNGN</span>
          </div>
        ) : (
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onCurrencyChange={onCurrencyChange}
            availableAssets={availableAssets}
          />
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
