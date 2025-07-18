import { useQuery } from "@tanstack/react-query";
import { getCountryExchangeRate } from "@/actions/rates";
import { ExchangeRateResponse } from "@/types";

interface UseExchangeRateParams {
  countryCode?: string;
  orderType: "buying" | "selling";
  providerType?: string;
}

// New optimized hook for pre-fetching all country rates
export function useAllCountryExchangeRates({
  orderType,
  providerType,
}: Omit<UseExchangeRateParams, "countryCode">) {
  return useQuery({
    queryKey: ["allCountryExchangeRates", orderType, providerType],
    queryFn: async () => {
      if (!providerType) {
        throw new Error("Provider type is required");
      }

      // Fetch rates for Kenya and Uganda (the only countries supported in Pay interface)
      const countries = ["KE", "UG"];
      const ratePromises = countries.map(async (countryCode) => {
        try {
          const rate = await getCountryExchangeRate({
            country: countryCode,
            orderType,
            providerType,
          });
          return { countryCode, rate };
        } catch (error) {
          console.error(`Failed to fetch rate for ${countryCode}:`, error);
          return { countryCode, rate: null };
        }
      });

      const results = await Promise.all(ratePromises);

      // Convert to a map for easy lookup
      const ratesMap = results.reduce((acc, { countryCode, rate }) => {
        if (rate) {
          acc[countryCode] = rate;
        }
        return acc;
      }, {} as Record<string, ExchangeRateResponse>);

      return ratesMap;
    },
    enabled: !!providerType,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for fresh rates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Original hook for backward compatibility
export function useExchangeRate({
  countryCode,
  orderType,
  providerType,
}: UseExchangeRateParams) {
  return useQuery({
    queryKey: ["exchangeRate", countryCode, orderType, providerType],
    queryFn: async () => {
      if (!countryCode || !providerType) {
        throw new Error("Country code and provider type are required");
      }

      return await getCountryExchangeRate({
        country: countryCode,
        orderType,
        providerType,
      });
    },
    enabled: !!countryCode && !!providerType,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for fresh rates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
