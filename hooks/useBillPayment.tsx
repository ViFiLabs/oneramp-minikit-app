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
        console.log("Creating bill quote with payload:", quotePayload);
        const quoteResponse = await createBillQuote(quotePayload);
        console.log("Bill quote response:", quoteResponse);

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

        console.log("Creating transfer with payload:", transferPayload);
        const transferResponse = await createPayoutTransfer(transferPayload);
        console.log("Transfer response:", transferResponse);

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
    onSuccess: (data) => {
      console.log("✅ Bill payment flow completed successfully:", data);
      setCurrentStep("completed");
    },
    onError: (error) => {
      console.error("❌ Bill payment flow failed:", error);
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
