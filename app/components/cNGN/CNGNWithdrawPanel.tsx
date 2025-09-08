"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { SwapArrow } from "@/app/components/panels/SwapArrow";
import SelectInstitution from "@/app/components/select-institution";
import { SwipeToWithdrawButton } from "@/app/components/payment/swipe-to-withdraw";
import { countries } from "@/data/countries";

export default function CNGNWithdrawPanel() {
  const userSelection = useUserSelectionStore();
  const { country, institution, accountNumber, updateSelection } =
    userSelection;
  const { isConnected: evmConnected } = useWalletGetInfo();
  const { isValid: isAmountValid, amount, setAmount } = useAmountStore();
  // cNGN is NGN-pegged (1:1). Show amount directly as NGN without FX conversion
  const computedToValue = useMemo(() => {
    const a = parseFloat(String(amount || 0));
    if (!a) return "0.00";
    return a.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount]);

  // Lock country to Nigeria for cNGN withdraw as well
  useEffect(() => {
    const nigeria = countries.find((c) => c.name === "Nigeria");
    if (nigeria && (!country || country.name !== "Nigeria")) {
      updateSelection({ country: nigeria });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isWithdrawDisabled = useMemo(
    () =>
      !isAmountValid ||
      !country ||
      !institution ||
      !accountNumber ||
      !evmConnected,
    [isAmountValid, country, institution, accountNumber, evmConnected]
  );

  return (
    <div className="flex flex-col gap-3 md:gap-4 md:mt-5">
      {/* From (custom cNGN token input) */}
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

      <SwapArrow disabled />

      {/* To (custom NGN display with Nigeria locked) */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative h-[115px]">
        <div className="text-neutral-300 text-base mb-2">To</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center bg-black rounded-full px-5 py-2">
            <Image
              src="/logos/nigeria.png"
              alt="Nigeria"
              width={25}
              height={25}
              className="rounded-full mr-2"
            />
            <span className="text-white text-lg font-medium">Nigeria</span>
          </div>
          <div className="text-white !text-4xl font-semibold tracking-tight ">
            {computedToValue}
          </div>
        </div>
      </div>

      {/* Peg line for cNGN */}
      <div className="px-1 text-xs text-neutral-400">1 cNGN ~ 1 NGN</div>

      {/* Recipient */}
      <SelectInstitution disableSubmit={true} />

      {/* Swipe to Withdraw */}
      <div className="mt-2">
        <SwipeToWithdrawButton
          onWithdrawComplete={() => {}}
          isLoading={false}
          disabled={isWithdrawDisabled}
          stepMessage={""}
          isWalletConnected={evmConnected}
          onSwapClick={() => {}}
        />
      </div>
    </div>
  );
}
