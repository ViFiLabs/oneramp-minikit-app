import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { oneRampApi } from "@/constants";
import {
  Country,
  ExchangeRateResponse,
  KYCVerificationResponse,
  Transaction,
  TransactionStatus,
} from "@/types";
import { countries } from "@/data/countries";
import { Institution } from "@/types";
import { TRPCError } from "@trpc/server";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  getAllTransactions: baseProcedure
    .input(
      z.object({
        address: z.string().min(1, "Address is required"),
      })
    )
    .query(
      async ({ input }): Promise<Record<TransactionStatus, Transaction[]>> => {
        const { address } = input;

        try {
          // get all transactions for the address for all statuses
          const [inProgressResponse, doneResponse, failedResponse] =
            await Promise.all([
              oneRampApi.get(
                `/address-orders/${address}/${TransactionStatus.IN_PROGRESS}`
              ),
              oneRampApi.get(
                `/address-orders/${address}/${TransactionStatus.DONE}`
              ),
              oneRampApi.get(
                `/address-orders/${address}/${TransactionStatus.FAILED}`
              ),
            ]);

          const transactionsObj = {
            [TransactionStatus.IN_PROGRESS]: inProgressResponse.data,
            [TransactionStatus.DONE]: doneResponse.data,
            [TransactionStatus.FAILED]: failedResponse.data,
          };

          return transactionsObj as Record<TransactionStatus, Transaction[]>;
        } catch (error) {
          console.error("Error fetching transactions:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch transactions",
            cause: error,
          });
        }
      }
    ),
  getTransactions: baseProcedure
    .input(
      z.object({
        address: z.string().min(1, "Address is required"),
        status: z.nativeEnum(TransactionStatus).optional(),
      })
    )
    .query(async ({ input }): Promise<Transaction[]> => {
      const { address, status = TransactionStatus.IN_PROGRESS } = input;

      if (!address) {
        throw new Error("Address is required");
      }

      try {
        const response = await oneRampApi.get(
          `/address-orders/${address}/${status}`
        );

        return response.data;
      } catch (error) {
        console.error("Error fetching transactions:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transactions",
          cause: error,
        });
      }
    }),
  getAllCountriesExchangeRates: baseProcedure
    .input(
      z.object({
        orderType: z.enum(["buying", "selling"]),
        providerType: z.enum(["momo", "bank"]),
      })
    )
    .query(async ({ input }): Promise<Record<string, ExchangeRateResponse>> => {
      const { orderType, providerType } = input;

      try {
        // Use Promise.allSettled to handle partial failures gracefully
        const responses = await Promise.allSettled(
          countries.map(async (country: Country) => {
            const payload = {
              country: country.countryCode,
              orderType,
              providerType,
            };
            const apiResponse = await oneRampApi.post(`/exchange`, payload);
            return {
              countryCode: country.countryCode,
              data: apiResponse.data as ExchangeRateResponse,
            };
          })
        );

        // Convert array to object keyed by country code, filtering out failed requests
        const responseObj = responses.reduce((acc, result) => {
          if (result.status === "fulfilled") {
            acc[result.value.countryCode] = result.value.data;
          } else {
            // Log the rejection reason for failed country requests
            console.error(
              `Failed to fetch exchange rate for country:`,
              result.reason
            );
          }
          return acc;
        }, {} as Record<string, ExchangeRateResponse>);

        // If no countries succeeded, throw an error
        if (Object.keys(responseObj).length === 0) {
          throw new Error(
            "Failed to fetch exchange rates for all countries. Please try again."
          );
        }

        return responseObj;
      } catch (error) {
        console.error("Error fetching all countries exchange rates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch exchange rates",
          cause: error,
        });
      }
    }),
  getAllCountriesInstitutions: baseProcedure
    .input(
      z.object({
        method: z.enum(["buy", "sell"]),
      })
    )
    .query(async ({ input }): Promise<Record<string, Institution[]>> => {
      const { method } = input;

      try {
        // Use Promise.allSettled to handle partial failures gracefully
        const responses = await Promise.allSettled(
          countries.map(async (country: Country) => {
            const apiResponse = await oneRampApi.get(
              `/institutions/${country.countryCode}/${method}`
            );
            return {
              countryCode: country.countryCode,
              data: apiResponse.data as Institution[],
            };
          })
        );

        // Convert array to object keyed by country code, filtering out failed requests
        const responseObj = responses.reduce((acc, result) => {
          if (result.status === "fulfilled") {
            acc[result.value.countryCode] = result.value.data;
          } else {
            // Log the rejection reason for failed country requests
          }
          return acc;
        }, {} as Record<string, Institution[]>);

        // If no countries succeeded, throw an error
        if (Object.keys(responseObj).length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch all countries institutions",
          });
        }

        return responseObj;
      } catch (error) {
        console.error("Error fetching all countries exchange rates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch all countries institutions",
          cause: error,
        });
      }
    }),
  getKYCStatus: baseProcedure
    .input(
      z.object({
        address: z.string().optional(),
      })
    )
    .query(async ({ input }): Promise<KYCVerificationResponse | null> => {
      const { address } = input;

      if (!address) {
        return null;
      }

      try {
        const response = await oneRampApi.get(`/kyc/${address}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching KYC:", error);
        // throw new Error("Failed to fetch KYC");
        return null;
      }
    }),
  getAccountDetails: baseProcedure
    .input(
      z.object({
        bankId: z.string().min(1, "Bank ID is required"),
        accountNumber: z.string().min(1, "Account Number is required"),
        currency: z.string().min(1, "Currency is required"),
      })
    )
    .query(async ({ input }) => {
      const { bankId, accountNumber, currency } = input;

      try {
        const response = await oneRampApi.post("/bank/verify/account", {
          bankId,
          accountNumber,
          currency,
        });

        return response.data;
      } catch (error) {
        console.error("Error fetching account details:", error);
        // throw new TRPCError({
        //   code: "INTERNAL_SERVER_ERROR",
        //   message: "Failed to fetch account details",
        //   cause: error,
        // });
        return null;
      }
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
