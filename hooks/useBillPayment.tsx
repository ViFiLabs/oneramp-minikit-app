"use client";

import { useMutation } from "@tanstack/react-query";
import { createBillQuote } from "@/actions/quote";
import { createPayoutTransfer } from "@/actions/transfer";
import { BillQuoteRequest, BillTillRequest } from "@/types";
import { useState } from "react";

interface BillPaymentParams {
  quotePayload: BillQuoteRequest;
  transferDetails: {
    accountName: string;
    accountNumber: string;
    requestType: "bill" | "till" | "payout";
    businessNumber?: string;
  };
}

export type PaymentStep =
  | "idle"
  | "creating-quote"
  | "initiating-transfer"
  | "opening-wallet"
  | "completed"
  | "error";

export const useBillPayment = () => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>("idle");

  const mutation = useMutation({
    mutationFn: async ({
      quotePayload,
      transferDetails,
    }: BillPaymentParams) => {
      try {
        // Step 1: Create bill quote
        setCurrentStep("creating-quote");
        const quoteResponse = await createBillQuote(quotePayload);

        // Step 2: Create transfer using the quote ID
        if (!quoteResponse?.quote?.quoteId) {
          throw new Error("No quote ID received from quote response");
        }

        setCurrentStep("initiating-transfer");
        const transferPayload: BillTillRequest = {
          quoteId: quoteResponse.quote.quoteId,
          accountName: transferDetails.accountName,
          accountNumber: transferDetails.accountNumber,
          requestType: transferDetails.requestType,
          ...(transferDetails.businessNumber && {
            businessNumber: transferDetails.businessNumber,
          }),
        };

        const transferResponse = await createPayoutTransfer(transferPayload);

        // Step 3: Ready for wallet interaction
        setCurrentStep("opening-wallet");

        // Return both responses
        return {
          quote: quoteResponse,
          transfer: transferResponse,
        };
      } catch (error) {
        setCurrentStep("error");
        throw error;
      }
    },
    onSuccess: () => {
      setCurrentStep("completed");
    },
    onError: () => {
      setCurrentStep("error");
    },
    onMutate: () => {
      setCurrentStep("creating-quote");
    },
  });

  const reset = () => {
    setCurrentStep("idle");
    mutation.reset();
  };

  return {
    ...mutation,
    currentStep,
    reset,
  };
};
