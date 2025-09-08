"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserSelectionStore } from "@/store/user-selection";
import { useNetworkStore } from "@/store/network";
import { useAmountStore } from "@/store/amount-store";
// Country modal is not used in cNGN deposit (locked to Nigeria)
// import type { Country } from "@/types";
import { SwipeToBuyButton } from "@/app/components/payment/swipe-to-buy";
import { useEffect } from "react";
import { countries } from "@/data/countries";

export default function CNGNDepositPanel() {
  const { country, asset, updateSelection } = useUserSelectionStore();
  const { currentNetwork } = useNetworkStore();
  const { amount, setAmount } = useAmountStore();

  // No-op: country selection disabled for this panel

  // Force default country to Nigeria and set minimum crypto amount on mount
  useEffect(() => {
    const nigeria = countries.find((c) => c.name === "Nigeria");
    if (nigeria) {
      if (!country || country.name !== "Nigeria") {
        updateSelection({ country: nigeria });
      }
      if (nigeria.cryptoMinMax?.min != null) {
        setAmount(String(nigeria.cryptoMinMax.min));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local helpers for formatting and input handling (commas, max 2 decimals)
  const formatNumber = (num: string) => {
    let clean = (num || "").replace(/[^\d.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) clean = `${parts[0]}.${parts.slice(1).join("")}`;
    const [intPart, decPart] = clean.split(".");
    const withCommas = intPart
      ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : "";
    if (decPart !== undefined) return `${withCommas}.${decPart.slice(0, 2)}`;
    return withCommas;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || rawValue === "." || /^\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
    }
  };

  return (
    <div className="w-full bg-[#181818] rounded-2xl min-h-[360px] p-4 md:p-6 flex flex-col gap-4 border !border-[#232323] md:mt-5">
      <div className="flex justify-between items-center">
        <span className="text-neutral-400 text-base md:text-lg">
          You&apos;re buying
        </span>
        {/* Locked to Nigeria for cNGN */}
        <div className="flex items-center bg-black rounded-full px-4 py-2 text-white opacity-70 cursor-not-allowed">
          <Image
            src="/logos/nigeria.png"
            alt="Nigeria"
            width={18}
            height={18}
            className="rounded-full mr-2"
          />
          <span className="text-sm">Nigeria</span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        {/* cNGN amount input (token pill + numeric input) */}
        <div className="w-full">
          <div className="flex flex-col relative ">
            <div className="flex items-center justify-center w-full ">
              <input
                type="text"
                inputMode="decimal"
                value={formatNumber(amount || "")}
                onChange={handleChange}
                className="mx-auto pr-2 text-center !leading-tight py-4 font-semibold !text-6xl outline-none bg-transparent border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none text-white w-full"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <Button
          variant="default"
          className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-full text-sm md:text-base font-medium flex items-center gap-2"
          disabled
        >
          {asset && currentNetwork ? (
            <>
              <Image
                src={asset.logo}
                alt={asset.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="font-medium">{asset.symbol}</span>
              <span className="text-gray-500 text-xs">
                on {currentNetwork.name}
              </span>
            </>
          ) : (
            <span className="pl-4">cNGN</span>
          )}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 10l5 5 5-5"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      {/* Peg line for cNGN */}
      <div className="text-center text-neutral-400 text-sm">
        {Number(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        cNGN ={" "}
        {Number(amount || 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        NGN
      </div>

      <div className="mt-2">
        <SwipeToBuyButton onBuyComplete={() => {}} disabled stepMessage={""} />
      </div>
    </div>
  );
}
