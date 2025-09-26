"use client";

import { cn } from "@/lib/utils";
import { useAmountStore } from "@/store/amount-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { Country } from "@/types";
import { useEffect, useMemo } from "react";
import SelectCountryModal from "./modals/select-country-modal";
import CurrencyValueInput from "./inputs/CurrencyValueInput";
import { countries } from "@/data/countries";
import { getNgnToLocalRate } from "@/lib/exchange-rates-data";

const SelectCountry = () => {
  const { country, updateSelection, paymentMethod, countryPanelOnTop, asset } =
    useUserSelectionStore();
  const { amount, setIsValid, setFiatAmount } = useAmountStore();

  // Use the optimized hook to get all exchange rates (same as withdrawPanel)
  const { data: allExchangeRates } = useAllCountryExchangeRates({
    orderType: "selling",
    providerType: paymentMethod || "momo", // Default to momo if no payment method
  });

  // Get current country's exchange rate from cached data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !allExchangeRates) return null;
    return allExchangeRates[country.countryCode];
  }, [country?.countryCode, allExchangeRates]);

  // Compute effective rate: if asset is cNGN, do NGN->Local using fixed overrides
  const effectiveRate = useMemo(() => {
    if (!exchangeRate) return null;
    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (!isCngn) return exchangeRate.exchange;

    const fixed = country?.countryCode
      ? getNgnToLocalRate(country.countryCode)
      : undefined;
    if (fixed && fixed > 0) return fixed;

    const nigeriaAPI = allExchangeRates?.NG?.exchange;
    const nigeriaFallback = countries.find(
      (c) => c.countryCode === "NG"
    )?.exchangeRate;
    const ngRate = nigeriaAPI || nigeriaFallback;
    if (!ngRate || ngRate <= 0) return exchangeRate.exchange;
    return exchangeRate.exchange / ngRate;
  }, [exchangeRate, asset?.symbol, country?.countryCode, allExchangeRates]);

  const calculatedAmount = useMemo(() => {
    if (!country || !amount || !effectiveRate) return null;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return null;

    const convertedAmount = numericAmount * effectiveRate;
    return convertedAmount.toFixed(2);
  }, [amount, country, effectiveRate]);

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
