import { useTRPC } from "../trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useAccountDetailSuspense = ({
  bankId,
  accountNumber,
  currency,
}: {
  bankId: string;
  accountNumber: string;
  currency: string;
}) => {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.getAccountDetails.queryOptions({
      bankId,
      accountNumber,
      currency,
    })
  );
};
