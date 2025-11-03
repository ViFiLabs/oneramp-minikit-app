"use client";

import { cn } from "@/lib/utils";
import { useAmountStore } from "@/store/amount-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { Country } from "@/types";
import { useEffect, useMemo } from "react";
import SelectCountryModal from "./modals/select-country-modal";
import CurrencyValueInput from "./inputs/CurrencyValueInput";
import { countries } from "@/data/countries";
import { getNgnToLocalRate, getCNGNToNGNRate } from "@/lib/exchange-rates-data";

const SelectCountry = () => {
  const { country, updateSelection, paymentMethod, countryPanelOnTop, asset } =
    useUserSelectionStore();
  const { amount, setIsValid, setFiatAmount } = useAmountStore();

  // Fetch selected country's live exchange rate
  const { data: exchangeRate } = useExchangeRate({
    countryCode: country?.countryCode,
    orderType: "selling",
    providerType: paymentMethod || "momo",
  });

  // Also fetch Nigeria rate for cross-rate when asset is cNGN
  const { data: nigeriaRate } = useExchangeRate({
    countryCode: "NG",
    orderType: "selling",
    providerType: paymentMethod || "momo",
  });

  // Compute effective rate: if asset is cNGN, do NGN->Local using fixed overrides
  const effectiveRate = useMemo(() => {
    const baseRate = exchangeRate?.exchange;
    const countryCode = country?.countryCode;
    if (!baseRate) return null;

    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (!isCngn) return baseRate;

    const fixed = countryCode ? getNgnToLocalRate(countryCode) : undefined;
    if (fixed && fixed > 0) return fixed;

    const nigeriaAPI = nigeriaRate?.exchange;
    const nigeriaFallback = countries.find(
      (c) => c.countryCode === "NG"
    )?.exchangeRate;
    const ngRate = nigeriaAPI || nigeriaFallback;
    if (!ngRate || ngRate <= 0) return baseRate;
    return baseRate / ngRate;
  }, [
    exchangeRate?.exchange,
    asset?.symbol,
    country?.countryCode,
    nigeriaRate?.exchange,
  ]);

  const calculatedAmount = useMemo(() => {
    if (!country || !amount) return null;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return null;

    // Special handling for cNGN to NGN conversion
    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (isCngn && country.countryCode === "NG") {
      const convertedAmount = numericAmount * getCNGNToNGNRate();
      return convertedAmount.toFixed(2);
    }

    // For other currencies, use the effective rate
    if (!effectiveRate) return null;
    const convertedAmount = numericAmount * effectiveRate;
    return convertedAmount.toFixed(2);
  }, [amount, country, effectiveRate, asset?.symbol]);

  const isAmountValid = useMemo(() => {
    if (!calculatedAmount || !country) return true;
    const numericAmount = parseFloat(calculatedAmount);
    return (
      (numericAmount > country.fiatMinMax.min &&
        numericAmount < country.fiatMinMax.max) ||
      numericAmount === country.fiatMinMax.min ||
      numericAmount === country.fiatMinMax.max
    );
  }, [calculatedAmount, country]);

  // Move state updates to useEffect
  useEffect(() => {
    setIsValid(isAmountValid);
    if (calculatedAmount) {
      setFiatAmount(calculatedAmount);
    }
  }, [isAmountValid, calculatedAmount, setIsValid, setFiatAmount]);

  const handleCountrySelect = (selectedCountry: Country) => {
    // Use effective rate when present, otherwise fallback to selected country default
    const rate =
      effectiveRate ?? exchangeRate?.exchange ?? selectedCountry.exchangeRate;

    updateSelection({
      country: {
        ...selectedCountry,
        exchangeRate: rate,
      },
      // Reset related fields when country changes
      institution: undefined,
      address: undefined,
      accountNumber: undefined,
    });
  };

  return (
    <>
      <div className="flex items-center rounded-t-[2rem] gap-3">
        <SelectCountryModal handleCountrySelect={handleCountrySelect} />

        {countryPanelOnTop ? (
          <CurrencyValueInput />
        ) : (
          <div className="flex-1 text-right">
            <h1
              className={cn(
                "!text-3xl font-semibold",
                "text-neutral-300",
                isAmountValid ? "" : ""
              )}
            >
              {calculatedAmount
                ? parseFloat(calculatedAmount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </h1>
          </div>
        )}
      </div>
    </>
  );
};

export default SelectCountry;
