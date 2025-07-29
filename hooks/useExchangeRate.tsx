import { useQuery } from "@tanstack/react-query";
import { getCountryExchangeRate } from "@/actions/rates";
import { getInstitutions } from "@/actions/institutions";
import { ExchangeRateResponse, Institution } from "@/types";
import { getExchangeRateClient } from "@/lib/exchange-rates-data";

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
      if (!providerType || !orderType) {
        throw new Error("Provider type and order type are required");
      }

      // Use client-side data for instant access
      const countries = ["NG", "KE", "GHA", "ZM", "UG", "TZ", "ZA"];
      const ratesMap: Record<string, ExchangeRateResponse> = {};

      // Get rates from client-side cache
      countries.forEach((countryCode) => {
        const rate = getExchangeRateClient(
          countryCode,
          orderType,
          providerType as "momo" | "bank"
        );
        if (rate) {
          ratesMap[countryCode] = rate;
        }
      });

      return ratesMap;
    },
    enabled: !!(providerType && orderType),
    staleTime: Infinity, // Never consider data stale - use cache forever
    gcTime: Infinity, // Keep in cache forever
    retry: 1,
    retryDelay: 1000,
    // No background refetching since we're using client-side data
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// New hook for pre-fetching institutions for specific countries
export function usePreFetchInstitutions(
  countryCode: string,
  method: "buy" | "sell" = "buy"
) {
  return useQuery({
    queryKey: ["prefetchInstitutions", countryCode, method],
    queryFn: async () => {
      if (!countryCode) return [];
      return await getInstitutions(countryCode, method);
    },
    enabled: !!countryCode, // Fetch whenever a country is provided
    staleTime: Infinity, // Never consider data stale - use cache forever
    gcTime: Infinity, // Keep in cache forever
    retry: 1,
    retryDelay: 1000,
    // Background fetch - don't show loading states
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// Hook for pre-fetching institutions for multiple countries
export function usePreFetchMultipleInstitutions(
  countryCodes: string[],
  method: "buy" | "sell" = "buy"
) {
  return useQuery({
    queryKey: ["prefetchMultipleInstitutions", countryCodes, method],
    queryFn: async () => {
      if (!countryCodes.length) return {};

      const institutionPromises = countryCodes.map(async (countryCode) => {
        try {
          const institutions = await getInstitutions(countryCode, method);
          return { countryCode, institutions };
        } catch (error) {
          console.error(
            `Failed to pre-fetch institutions for ${countryCode}:`,
            error
          );
          return { countryCode, institutions: [] };
        }
      });

      const results = await Promise.all(institutionPromises);

      // Convert to a map for easy lookup
      const institutionsMap = results.reduce(
        (acc, { countryCode, institutions }) => {
          acc[countryCode] = institutions;
          return acc;
        },
        {} as Record<string, Institution[]>
      );

      return institutionsMap;
    },
    enabled: countryCodes.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    // Background fetch - don't show loading states
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

// Optimized hook for pre-fetching institutions for all countries
export function useAllCountryInstitutions(method: "buy" | "sell" = "buy") {
  return useQuery({
    queryKey: ["allCountryInstitutions", method],
    queryFn: async () => {
      // Fetch institutions for all supported countries
      const countries = ["NG", "KE", "GHA", "ZM", "UG", "TZ", "ZA"];
      const institutionPromises = countries.map(async (countryCode) => {
        try {
          const institutions = await getInstitutions(countryCode, method);
          return { countryCode, institutions };
        } catch (error) {
          console.error(
            `Failed to fetch institutions for ${countryCode}:`,
            error
          );
          // Return empty array but log the error for debugging
          return { countryCode, institutions: [], error: String(error) };
        }
      });

      const results = await Promise.all(institutionPromises);

      // Convert to a map for easy lookup
      const institutionsMap = results.reduce(
        (acc, { countryCode, institutions }) => {
          acc[countryCode] = institutions;
          return acc;
        },
        {} as Record<string, Institution[]>
      );

      return institutionsMap;
    },
    enabled: true, // Always enabled to pre-fetch
    staleTime: 5 * 60 * 1000, // 5 minutes - institutions don't change often
    refetchInterval: 10 * 60 * 1000, // 10 minutes - very infrequent refetching
    retry: 3, // Increased retries for better reliability
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    // Retry on window focus to handle network issues
    refetchOnWindowFocus: true,
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
