import React, { useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { useAmountStore } from "@/store/amount-store";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Calculate the equivalent amount in local currency
  const localCurrencyAmount = useMemo(() => {
    if (!exchangeRate || !amount) return 0;
    const numericAmount = parseFloat(amount) || 0;
    return numericAmount * exchangeRate.exchange;
  }, [exchangeRate, amount]);

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
                      </>
                    ) : (
                      <>-- {country.currency}</>
                    )}
                  </>
                ) : (
                  // Standard rate display: "1 USD ~ 129.2 KES" (for all other components)
                  <>
                    1 {asset?.symbol ? asset.symbol : "USD"} ~{" "}
                    {exchangeRate ? (
                      <>
                        {exchangeRate.exchange.toLocaleString()} {country.currency}
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
