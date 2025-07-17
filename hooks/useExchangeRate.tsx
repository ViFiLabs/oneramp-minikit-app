import { useQuery } from "@tanstack/react-query";
import { getCountryExchangeRate } from "@/actions/rates";

interface UseExchangeRateParams {
  countryCode?: string;
  orderType: "buying" | "selling";
  providerType?: string;
}

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
