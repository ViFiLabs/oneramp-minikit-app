import { useTRPC } from "@/src/trpc/client";
import { useQuery } from "@tanstack/react-query";

const useFetchTx = (address?: string, enabled: boolean = true) => {
  const trpc = useTRPC();

  const dataResponse = useQuery({
    ...trpc.getAllTransactions.queryOptions({
      address: address || "",
    }),
    enabled: enabled && !!address && address.length > 0,
    refetchInterval: 10000, // Refetch every 10 seconds to keep transactions updated
    refetchOnWindowFocus: true,
  });
  return dataResponse;
};

export default useFetchTx;
