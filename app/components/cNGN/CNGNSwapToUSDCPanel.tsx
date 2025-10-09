"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { SwipeToWithdrawButton } from "@/app/components/payment/swipe-to-withdraw";
import { SwapArrow } from "@/app/components/panels/SwapArrow";
import { getCNGNToNGNRate } from "@/lib/exchange-rates-data";

export default function CNGNSwapToUSDCPanel() {
  const { country, updateSelection } = useUserSelectionStore();
  const { amount, setAmount, isValid: isAmountValid } = useAmountStore();

  const computedToValue = useMemo(() => {
    const cngnAmount = parseFloat(String(amount || 0));
    const ngnPerUSDC = country?.exchangeRate || 0; // 1 USDC ~ N NGN
    if (!cngnAmount || !ngnPerUSDC) return "0.00";
    const ngn = cngnAmount * getCNGNToNGNRate(); // Convert cNGN -> NGN (not 1:1)
    const usdc = ngn / ngnPerUSDC; // Then convert NGN → USDC
    return usdc.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount, country?.exchangeRate]);

  return (
    <div className="flex flex-col gap-1 md:mt-5">
      {/* From */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative h-[115px]">
        <div className="flex items-center justify-between ">
          <span className="text-neutral-200 text-base md:text-lg font-medium">
            From
          </span>
          <span className="text-neutral-400 text-xs md:text-sm">
            Balance: -- <span className="text-red-400 ml-1">Max</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 ">
          <div className="flex items-center bg-black rounded-full px-5 py-2">
            <Image
              src="/logos/cngn.png"
              alt="cNGN"
              width={25}
              height={25}
              className="rounded-full mr-2"
            />
            <span className="text-white text-lg font-medium">cNGN</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amount || ""}
            onChange={(e) => setAmount(e.target.value)}
            className="text-right pr-2 !leading-tight py-4 font-semibold !text-4xl outline-none bg-transparent border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none text-white w-28 md:w-40"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Arrow */}
      <SwapArrow
        double
        onClick={() => {
          setAmount("0");
          updateSelection({
            cngnActiveTab: "swapTocNGN",
          } as unknown as Record<string, unknown>);
        }}
      />

      {/* To */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative h-[115px]">
        <div className="text-neutral-300 text-base mb-2">To</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center bg-black rounded-full px-5 py-2">
            <Image
              src="/logos/USDC.svg"
              alt="USDC"
              width={25}
              height={25}
              className="rounded-full mr-2"
            />
            <span className="text-white text-lg font-medium">USDC</span>
          </div>
          <div className="text-white !text-4xl font-semibold tracking-tight ">
            {computedToValue}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs my-2 text-neutral-400 px-1">
        <div>
          1 cNGN ≈{" "}
          {(getCNGNToNGNRate() / (country?.exchangeRate || 1)).toLocaleString(
            "en-US",
            {
              maximumFractionDigits: 6,
            }
          )}{" "}
          USDC
        </div>
        {/* <div className="text-neutral-500">~0.34% platform fee</div> */}
      </div>

      <div className="mt-2">
        <SwipeToWithdrawButton
          onWithdrawComplete={() => {}}
          isLoading={false}
          disabled={!isAmountValid}
          stepMessage={""}
          onSwapClick={() => {}}
          isWalletConnected={false}
        />
      </div>
    </div>
  );
}
