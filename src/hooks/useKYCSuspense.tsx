import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../trpc/client";

export const useKYCStatusSuspense = ({ address }: { address: string }) => {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.getKYCStatus.queryOptions(
      { address },
      {
        enabled: !!address,
        refetchOnReconnect: true,
      }
    )
  );
};
