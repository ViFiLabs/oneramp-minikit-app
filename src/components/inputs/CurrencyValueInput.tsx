import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { useAmountStore } from "@/src/store/amount-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import React, { useEffect, useState } from "react";

interface CurrencyValueInputProps {
  maxBalance?: string;
  isWalletConnected?: boolean;
  isBalanceLoading?: boolean;
}

const CurrencyValueInput: React.FC<CurrencyValueInputProps> = ({
  maxBalance = "0",
  isWalletConnected = false,
  isBalanceLoading = false,
}) => {
  const { amount, setAmount, setIsValid, setMessage, message } =
    useAmountStore();
  const [isInvalid, setIsInvalid] = useState(false);
  const [balanceExceeded, setBalanceExceeded] = useState(false);
  const { country } = useUserSelectionStore();

  const formatNumber = (num: string) => {
    // Remove any non-digit characters except decimal point and first decimal only
    let cleanNum = num.replace(/[^\d.]/g, "");

    // Ensure only one decimal point
    const decimalCount = (cleanNum.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleanNum = cleanNum.replace(/\./g, (match, index) =>
        index === cleanNum.indexOf(".") ? match : ""
      );
    }

    // If number has decimal point, return as is (with max 2 decimal places)
    if (cleanNum.includes(".")) {
      const [integerPart, decimalPart] = cleanNum.split(".");
      return `${integerPart}.${decimalPart.slice(0, 2)}`;
    }

    // For whole numbers, add commas
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const validateAmount = (amount: string) => {
    if (!amount || amount === "") return true;
    setMessage("");

    const numericValue = parseFloat(amount);

    if (!country) return true;

    // Basic validation
    const isValidNumber =
      !isNaN(numericValue) &&
      numericValue >= country?.fiatMinMax.min &&
      numericValue <= country?.fiatMinMax.max &&
      // Check if decimal places are valid (max 2)
      (amount.includes(".") ? amount.split(".")[1].length <= 2 : true);

    // Balance validation (only if wallet is connected)
    if (isWalletConnected && isValidNumber) {
      const maxBalanceNumber = parseFloat(maxBalance);
      const exceedsBalance = numericValue > maxBalanceNumber;
      setBalanceExceeded(exceedsBalance);

      if (country) {
        const countryMinMax = country.cryptoMinMax;
        const exceedsMin = numericValue < countryMinMax.min;
        const exceedsMax = numericValue > countryMinMax.max;
        setBalanceExceeded(exceedsMin || exceedsMax);
        setMessage(
          exceedsMin
            ? `Minimum is ${countryMinMax.min}`
            : `Maximum is ${countryMinMax.max}`
        );
        return isValidNumber && !exceedsBalance && !exceedsMin && !exceedsMax;
      }

      return isValidNumber && !exceedsBalance;
    }

    setBalanceExceeded(false);
    return isValidNumber;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");

    // Allow typing decimal point and numbers
    if (rawValue === "" || rawValue === "." || /^\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      const isValidAmount = validateAmount(rawValue);
      setIsInvalid(!isValidAmount);
      setIsValid(isValidAmount);
    }
  };

  // Re-validate when balance changes
  useEffect(() => {
    if (amount) {
      const isValidAmount = validateAmount(amount);
      setIsInvalid(!isValidAmount);
      setIsValid(isValidAmount);
    }
  }, [maxBalance, isWalletConnected, amount]);

  // Calculate dynamic font size based on amount length
  const getFontSize = () => {
    if (amount.length > 12) return "text-[1.25rem] md:text-[1.5rem]";
    if (amount.length > 9) return "text-[1.5rem] md:text-[1.75rem]";
    return "text-[2rem] md:text-[2.5rem]";
  };

  const getWidth = () => {
    if (amount.length > 3) return "w-2/3";
    if (amount.length > 6) return "w-full";
    return "w-full";
  };

  const getTextColor = () => {
    if (isBalanceLoading) return "text-yellow-400";
    if (balanceExceeded) return "text-red-400";
    if (isInvalid) return "text-red-500";
    return "text-white";
  };

  return (
    <div className={cn("relative flex items-center justify-end", getWidth())}>
      <div className="w-full relative">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={formatNumber(amount)}
          onChange={handleChange}
          className={cn(
            "w-full text-right pr-2 !text-4xl !leading-tight py-4 font-semibold outline-none bg-transparent border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none",
            getTextColor(),
            getFontSize(),
            "transition-all duration-200"
          )}
        />
        {/* Error message for balance exceeded */}
        {balanceExceeded && isWalletConnected && (
          <div className="absolute -bottom-4 right-0 text-xs text-red-400">
            {message || "Exceeds balance"}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyValueInput;
