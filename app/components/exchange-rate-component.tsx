import React, { useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { useAmountStore } from "@/store/amount-store";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/app/components/ui/skeleton";
import { countries } from "@/data/countries";
import { getNgnToLocalRate, getCNGNToNGNRate } from "@/lib/exchange-rates-data";

const ExchangeRateComponent = ({
  default: isDefault,
  orderType = "selling",
  showAmountConversion = false,
}: {
  default?: boolean;
  orderType?: "buying" | "selling";
  showAmountConversion?: boolean;
}) => {
  const { country, asset } = useUserSelectionStore();
  const { amount } = useAmountStore();

  // Get all country exchange rates using optimized hook
  const { data: allExchangeRates, isLoading: isExchangeRateLoading } =
    useAllCountryExchangeRates({
      orderType, // Use the passed orderType or default to "selling"
      providerType: "momo", // Default provider type
    });

  // Get current country's exchange rate from cached data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !allExchangeRates) return undefined;
    return allExchangeRates[country.countryCode];
  }, [country?.countryCode, allExchangeRates]);

  // Derive effective rate: if asset is cNGN, convert NGN -> local using cross-rate
  const effectiveRate = useMemo(() => {
    if (!exchangeRate || !country) return undefined;
    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (!isCngn) return exchangeRate.exchange;

    const fixed = getNgnToLocalRate(country.countryCode);
    if (fixed && fixed > 0) return fixed;

    const nigeriaAPI = allExchangeRates?.NG?.exchange;
    const nigeriaFallback = countries.find(
      (c) => c.countryCode === "NG"
    )?.exchangeRate;
    const ngRate = nigeriaAPI || nigeriaFallback;
    if (!ngRate || ngRate <= 0) return undefined;
    // exchangeRate.exchange is USD->Local, ngRate is USD->NGN, so NGN->Local = Local/USD / NGN/USD
    return exchangeRate.exchange / ngRate;
  }, [exchangeRate, asset?.symbol, allExchangeRates, country]);

  // Calculate the equivalent amount in local currency
  const localCurrencyAmount = useMemo(() => {
    if (!effectiveRate || !amount) return 0;
    const numericAmount = parseFloat(amount) || 0;

    // Special handling for cNGN: apply platform fee conversion
    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (isCngn && country?.countryCode === "NG") {
      // For cNGN to NGN, apply the platform fee
      return numericAmount * getCNGNToNGNRate();
    }

    return numericAmount * effectiveRate;
  }, [effectiveRate, amount, asset?.symbol, country?.countryCode]);

  return (
    <div
      className={cn(
        isDefault && "w-full flex flex-col items-center justify-center"
      )}
    >
      {country && (
        <div className="mx-4 md:mx-10 mb-4 flex justify-between text-sm">
          {isExchangeRateLoading ? (
            <>
              <Skeleton className="h-4 w-32" />
              {!isDefault && <Skeleton className="h-4 w-40 hidden md:block" />}
            </>
          ) : (
            <>
              <span className="text-neutral-400 flex items-center gap-2">
                {showAmountConversion && amount && parseFloat(amount) > 0 ? (
                  // Show current amount conversion: "2 USD = 258.4 KES" (only for buy panel)
                  <>
                    {amount} {asset?.symbol ? asset.symbol : "USD"} ={" "}
                    {exchangeRate ? (
                      <>
                        {localCurrencyAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {country.currency}
                        {/* Show platform fee note for cNGN */}
                        {/* {(asset?.symbol || "").toUpperCase() === "CNGN" &&
                          country?.countryCode === "NG" && (
                            <span className="text-neutral-500 ml-1">
                              (~0.34% fee)
                            </span>
                          )} */}
                      </>
                    ) : (
                      <>-- {country.currency}</>
                    )}
                  </>
                ) : (
                  // Standard rate display using effective rate
                  <>
                    1 {asset?.symbol ? asset.symbol : "USD"} ~{" "}
                    {effectiveRate ? (
                      <>
                        {effectiveRate.toLocaleString()} {country.currency}
                      </>
                    ) : (
                      <>-- {country.currency}</>
                    )}
                  </>
                )}
              </span>
              {!isDefault && (
                <span className="text-neutral-400 hidden md:block">
                  Swap usually completes in 30s
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExchangeRateComponent;
