import React, { useMemo } from "react";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { useExchangeRate } from "@/src/hooks/useExchangeRate";
import { useAmountStore } from "@/src/store/amount-store";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { countries } from "@/data/countries";
import {
  getNgnToLocalRate,
  getCNGNToNGNRate,
} from "@/src/lib/exchange-rates-data";
import { ExchangeRateResponse } from "@/types";

const ExchangeRateComponent = ({
  default: isDefault,
  orderType = "selling",
  showAmountConversion = false,
  exchangeRate: exchangeRateProp,
  nigeriaRate: nigeriaRateProp,
  isLoading: isLoadingProp,
}: {
  default?: boolean;
  orderType?: "buying" | "selling";
  showAmountConversion?: boolean;
  exchangeRate?: ExchangeRateResponse; // Optional exchange rate from suspense data
  nigeriaRate?: ExchangeRateResponse; // Optional Nigeria rate from suspense data
  isLoading?: boolean; // Optional loading state from suspense data
}) => {
  const { country, asset } = useUserSelectionStore();
  const { amount } = useAmountStore();

  // Use provided exchange rates if available, otherwise fetch
  // The hook's enabled check will disable fetching if countryCode is undefined
  const { data: fetchedExchangeRate, isLoading: isFetchingExchangeRate } =
    useExchangeRate({
      countryCode: exchangeRateProp ? undefined : country?.countryCode,
      orderType,
      providerType: exchangeRateProp ? undefined : "momo",
    });

  // Use provided Nigeria rate if available, otherwise fetch (needed for cNGN cross-rate)
  const { data: fetchedNigeriaRate } = useExchangeRate({
    countryCode: nigeriaRateProp ? undefined : "NG",
    orderType,
    providerType: nigeriaRateProp ? undefined : "momo",
  });

  // Use provided rates if available, otherwise use fetched data
  const exchangeRate = exchangeRateProp || fetchedExchangeRate;
  const nigeriaRate = nigeriaRateProp || fetchedNigeriaRate;
  const isExchangeRateLoading =
    isLoadingProp !== undefined ? isLoadingProp : isFetchingExchangeRate;

  // Derive effective rate: if asset is cNGN, convert NGN -> local using cross-rate
  const effectiveRate = useMemo(() => {
    const countryCode = country?.countryCode;
    const baseRate = exchangeRate?.exchange;
    if (!baseRate || !countryCode) return undefined;

    const isCngn = (asset?.symbol || "").toUpperCase() === "CNGN";
    if (!isCngn) return baseRate;

    const fixed = getNgnToLocalRate(countryCode);
    if (fixed && fixed > 0) return fixed;

    const nigeriaAPI = nigeriaRate?.exchange;
    const nigeriaFallback = countries.find(
      (c) => c.countryCode === "NG"
    )?.exchangeRate;
    const ngRate = nigeriaAPI || nigeriaFallback;
    if (!ngRate || ngRate <= 0) return undefined;
    // baseRate is USD->Local, ngRate is USD->NGN, so NGN->Local = Local/USD / NGN/USD
    return baseRate / ngRate;
  }, [
    exchangeRate?.exchange,
    asset?.symbol,
    nigeriaRate?.exchange,
    country?.countryCode,
  ]);

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
