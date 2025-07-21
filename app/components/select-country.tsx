"use client";

import { getCountryExchangeRate } from "@/actions/rates";
import { cn } from "@/lib/utils";
import { useAmountStore } from "@/store/amount-store";
import { useExchangeRateStore } from "@/store/exchange-rate-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { Country } from "@/types";
import { useEffect, useMemo } from "react";
import SelectCountryModal from "./modals/select-country-modal";
import CurrencyValueInput from "./inputs/CurrencyValueInput";

const SelectCountry = () => {
  const { country, updateSelection, paymentMethod, countryPanelOnTop } =
    useUserSelectionStore();
  const { amount, setIsValid, setFiatAmount } = useAmountStore();
  const { exchangeRate, setExchangeRate, setError } = useExchangeRateStore();

  // Fetch exchange rate when country or payment method changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!country?.countryCode || !paymentMethod) return;

      try {
        const response = await getCountryExchangeRate({
          country: country.countryCode,
          orderType: "selling",
          providerType: paymentMethod,
        });

        setExchangeRate(response);
        setError(null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch exchange rate"
        );
        setExchangeRate(null);
      }
    };

    fetchExchangeRate();
  }, [country?.countryCode, paymentMethod, setExchangeRate, setError]);

  const calculatedAmount = useMemo(() => {
    if (!country || !amount || !exchangeRate) return null;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return null;

    // Use the exchange rate from the API response
    const rate = exchangeRate.exchange;
    const convertedAmount = numericAmount * rate;
    return convertedAmount.toFixed(2);
  }, [amount, country, exchangeRate]);

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
    const rate = exchangeRate?.exchange ?? selectedCountry.exchangeRate;

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
