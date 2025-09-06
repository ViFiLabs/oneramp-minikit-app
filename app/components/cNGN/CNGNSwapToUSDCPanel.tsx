"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { FromPanel } from "@/app/components/panels/FromPanel";
import { SwapArrow } from "@/app/components/panels/SwapArrow";
import { SwipeToWithdrawButton } from "@/app/components/payment/swipe-to-withdraw";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import type { Network } from "@/types";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export default function CNGNSwapToUSDCPanel() {
  const { asset, country } = useUserSelectionStore();
  const { amount, isValid: isAmountValid } = useAmountStore();

  const computedToValue = useMemo(() => {
    const a = parseFloat(String(amount || 0));
    const rate = country?.exchangeRate || 0; // NGN per cNGN
    if (!a || !rate) return "0.00";
    return (a * rate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount, country?.exchangeRate]);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Title */}
      <div className="bg-[#232323] rounded-2xl px-4 py-3 text-white/90 text-base font-medium">
        Swap cNGN for USDC
      </div>

      {/* From token pill (cNGN) */}
      <div className="flex items-center gap-2 px-1">
        <div className="flex items-center bg-black rounded-full pl-2 pr-3 py-1">
          <Image
            src="/logos/cngn.png"
            alt="cNGN"
            width={16}
            height={16}
            className="rounded-full mr-2"
          />
          <span className="text-white text-sm font-medium">cNGN</span>
        </div>
      </div>

      {/* From block */}
      <FromPanel
        selectedCurrency={asset as unknown as never}
        networks={networks}
        canSwitchNetwork={() => true}
        onNetworkSelect={async () => {}}
      />

      <SwapArrow disabled />

      {/* To block (token pill + amount on right) */}
      <div className="mx-0 my-0 bg-[#232323] rounded-2xl p-4 md:p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black rounded-full pl-2 pr-3 py-1">
            <Image
              src="/logos/USDC.svg"
              alt="USDC"
              width={16}
              height={16}
              className="rounded-full mr-2"
            />
            <span className="text-white text-sm font-medium">USDC</span>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              className="ml-1 text-neutral-400"
            >
              <path
                d="M7 10l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="text-white text-3xl font-semibold tracking-tight">
          {computedToValue}
        </div>
      </div>

      {/* Rate + slippage line */}
      <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
        <div>
          {/* Reuse component to ensure rate line stays fresh */}
          <span className="mr-2">
            1 USDC ~{" "}
            {country?.exchangeRate?.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            }) || "-"}{" "}
            NGN
          </span>
        </div>
        <div>Max slippage ~ 2.5%</div>
      </div>

      {/* Swipe */}
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
