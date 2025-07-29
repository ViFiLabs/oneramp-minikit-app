import React, { useMemo } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ExchangeRateComponent = ({
  default: isDefault,
}: {
  default?: boolean;
}) => {
  const { country, asset } = useUserSelectionStore();

  // Get all country exchange rates using optimized hook
  const { data: allExchangeRates, isLoading: isExchangeRateLoading } =
    useAllCountryExchangeRates({
      orderType: "selling", // Using selling endpoint for better performance
      providerType: "momo", // Default provider type
    });

  // Get current country's exchange rate from cached data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !allExchangeRates) return undefined;
    return allExchangeRates[country.countryCode];
  }, [country?.countryCode, allExchangeRates]);

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
                1 {asset?.symbol ? asset.symbol : "USD"} ~{" "}
                {exchangeRate ? (
                  <>
                    {exchangeRate.exchange.toLocaleString()} {country.currency}
                  </>
                ) : (
                  <>-- {country.currency}</>
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
