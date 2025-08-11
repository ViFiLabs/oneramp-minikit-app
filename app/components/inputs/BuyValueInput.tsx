import { Input } from "@/components/ui/input";
import { GLOBAL_MIN_MAX } from "@/data/countries";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAmountStore } from "@/store/amount-store";
import { useUserSelectionStore } from "@/store/user-selection";

const BuyValueInput = () => {
  const { amount, setAmount, setIsValid, setMessage, message } =
    useAmountStore();
  const [isInvalid, setIsInvalid] = useState(false);
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

  // Re-validate when country changes
  useEffect(() => {
    if (amount) {
      const isValidAmount = validateAmount(amount);
      setIsInvalid(!isValidAmount);
      setIsValid(isValidAmount);
    }
  }, [country, amount]);

  const getWidth = () => {
    if (amount.length > 3) return "w-full";
    return "w-1/2";
  };

  const getTextColor = () => {
    if (isInvalid) return "text-red-500";
    return "text-white";
  };

  return (
    <div
      className={cn(
        "relative flex items-center my-4 justify-center",
        getWidth()
      )}
    >
      <div className="w-full relative flex flex-row">
        <div
          className={cn(
            "pointer-events-none flex items-center h-full  text-4xl"
          )}
        >
          <span className={cn("font-semibold", getTextColor())}>$</span>
        </div>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={formatNumber(amount)}
          onChange={handleChange}
          className={cn(
            "w-full bg-transparent text-left  text-5xl  font-semibold outline-none border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none leading-none",
            getTextColor(),
            "transition-all duration-200"
          )}
        />
        {/* Error message */}
        {isInvalid && message && (
          <div className="absolute -bottom-4 left-0 right-0 text-xs text-red-400">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyValueInput;
