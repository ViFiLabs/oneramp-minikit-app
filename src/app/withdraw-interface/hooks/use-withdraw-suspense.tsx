import { useTRPC } from "@/src/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useWithdrawRatesSuspense = ({
  orderType,
  providerType,
}: {
  orderType: "selling" | "buying";
  providerType: "momo" | "bank";
}) => {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.getAllCountriesExchangeRates.queryOptions(
      {
        orderType,
        providerType,
      },
      {
        staleTime: 90 * 1000, // 90 seconds - matches server-side cache duration
        refetchInterval: 90 * 1000, // Refetch every 90 seconds for fresh rates
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      }
    )
  );
};

export const useWithdrawInstitutionsSuspense = ({
  method,
}: {
  method: "buy" | "sell";
}) => {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.getAllCountriesInstitutions.queryOptions({
      method,
    })
  );
};
