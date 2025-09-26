import { Input } from "@/app/components/ui/input";
import { GLOBAL_MIN_MAX } from "@/data/countries";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAmountStore } from "@/store/amount-store";
import { useUserSelectionStore } from "@/store/user-selection";

const BuyValueInput = () => {
  const { amount, setAmount, setIsValid, setMessage, message } =
    useAmountStore();
  const [isInvalid, setIsInvalid] = useState(false);
  const { country, asset } = useUserSelectionStore();

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

    // For whole numbers, add thin spaces as thousand separators to avoid comma/decimal confusion
    const THIN_SPACE = "\u2009";
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  };

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount || amount === "") return true;
      setMessage("");

      const numericValue = parseFloat(amount);

      // Basic validation
      const isValidNumber =
        !isNaN(numericValue) &&
        numericValue >= GLOBAL_MIN_MAX.min &&
        numericValue <= GLOBAL_MIN_MAX.max &&
        // Check if decimal places are valid (max 2)
        (amount.includes(".") ? amount.split(".")[1].length <= 2 : true);

      if (country && isValidNumber) {
        const countryMinMax = country.cryptoMinMax;
        const exceedsMin = numericValue < countryMinMax.min;
        const exceedsMax = numericValue > countryMinMax.max;

        if (exceedsMin || exceedsMax) {
          setMessage(
            exceedsMin
              ? `Minimum is ${countryMinMax.min} ${country.currency}`
              : `Maximum is ${countryMinMax.max} ${country.currency}`
          );
          return false;
        }
      }

      return isValidNumber;
    },
    [country, setMessage]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip thousands separators (commas, spaces, thin spaces) when parsing
    const rawValue = e.target.value.replace(/[\,\u2009\s]/g, "");

    // Allow typing decimal point and numbers
    if (rawValue === "" || rawValue === "." || /^\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      const isValidAmount = validateAmount(rawValue);
      setIsInvalid(!isValidAmount);
      setIsValid(isValidAmount);
    }
  };

  // Re-validate when country changes
  useEffect(() => {
    if (amount) {
      const isValidAmount = validateAmount(amount);
      setIsInvalid(!isValidAmount);
      setIsValid(isValidAmount);
    }
  }, [country, amount, setIsValid, validateAmount]);

  // Measure content width so the input grows with the number (Uniswap-like)
  const mirrorRef = useRef<HTMLSpanElement | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(96);
  const formattedAmount = formatNumber(amount);

  useEffect(() => {
    if (!mirrorRef.current) return;
    // Add small padding so the caret is not cramped
    const width = mirrorRef.current.offsetWidth + 8;
    // Clamp width to avoid overflow
    const clamped = Math.min(Math.max(width, 72), 320);
    setContentWidth(clamped);
  }, [formattedAmount]);

  const getTextColor = () => {
    if (isInvalid) return "text-red-500";
    return "text-white";
  };

  return (
    <div className={cn("relative my-4 w-full")}>
      <div className="w-full flex items-center justify-center">
        <div className="relative inline-flex items-center">
          {/* Number input sized to its content and centered as a group */}
          <div className="relative" style={{ width: contentWidth }}>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formattedAmount}
              onChange={handleChange}
              className={cn(
                "w-full bg-transparent text-center text-5xl font-semibold outline-none border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none leading-none px-0",
                getTextColor(),
                "transition-all duration-200"
              )}
            />
            {/* Mirror for measuring width (kept invisible but takes layout) */}
            <span
              ref={mirrorRef}
              aria-hidden
              className="invisible whitespace-pre absolute top-0 left-0 text-5xl font-semibold leading-none"
            >
              {formattedAmount || "0"}
            </span>
            {/* Currency symbol positioned without affecting centering */}
            <span
              className={cn(
                "absolute right-full mr-1 top-1/2 text-5xl font-semibold leading-none",
                getTextColor()
              )}
              style={{ transform: "translateY(calc(-50% + 2px))" }}
            >
              {asset?.symbol === "cNGN" ? "₦" : "$"}
            </span>
          </div>
        </div>
      </div>
      {isInvalid && message && (
        <div className="absolute -bottom-1 left-0 right-0 text-xs text-red-400 text-center">
          {message}
        </div>
      )}
    </div>
  );
};

export default BuyValueInput;
