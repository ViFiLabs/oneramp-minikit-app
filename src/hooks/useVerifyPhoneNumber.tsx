"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/src/trpc/client";

export const useVerifyPhoneNumber = (
  phoneNumber: string,
  countryCode: string
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.verifyPhoneNumber.queryOptions({ phoneNumber, countryCode }),
    enabled:
      !!phoneNumber &&
      !!countryCode &&
      phoneNumber.length > 0 &&
      countryCode.length > 0,
  });
};
