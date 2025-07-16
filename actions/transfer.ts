"use server";

import { oneRampApi, oneRampApiWithCustomHeaders } from "@/constants";
import {
  SubmitTransactionHashRequest,
  Transaction,
  TransactionStatus,
  TransferBankRequest,
  TransferMomoRequest,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { AxiosError } from "axios";

export const createTransferIn = async (
  payload: TransferMomoRequest | TransferBankRequest
) => {
  try {
    if (!payload.operator || !payload.quoteId) {
      throw new Error("Invalid payload", { cause: payload });
    }

    const idompetancyKey = uuidv4();

    const response = await oneRampApiWithCustomHeaders({
      "Idempotency-Key": idompetancyKey,
    }).post("/transfer-in", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to create transfer in", { cause: error });
  }
};

export const createTransferOut = async (
  payload: TransferMomoRequest | TransferBankRequest
) => {
  try {
    if (!payload.operator || !payload.quoteId) {
      throw new Error("Invalid payload", { cause: payload });
    }

    const idompetancyKey = uuidv4();

    const response = await oneRampApiWithCustomHeaders({
      "Idempotency-Key": idompetancyKey,
    }).post("/transfer-out", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to create transfer out", { cause: error });
  }
};

export const getTransferStatus = async (transferId: string) => {
  try {
    if (!transferId) {
      throw new Error("Transfer ID is required");
    }

    const response = await oneRampApi.get(`/transfer/${transferId}`);

    return response.data;
  } catch (error) {
    throw new Error("Failed to get transfer status", { cause: error });
  }
};

export const submitTransactionHash = async (
  payload: SubmitTransactionHashRequest,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  status?: number;
  message?: string;
  data?: unknown;
  details?: unknown;
}> => {
  // Validate payload once before attempting
  if (!payload.transferId || !payload.txHash) {
    return {
      success: false,
      status: 400,
      message: "Missing required fields: transferId or txHash",
    };
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await oneRampApi.post(`/tx`, payload);

      return {
        success: true,
        status: response.status,
        data: response.data || null,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      const status = axiosError.response?.status || 500;
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Failed to submit transaction hash";

      // If it's a 500 error and we have retries left, continue to next attempt
      if (status === 500 && attempt < maxRetries) {
        // Add exponential backoff delay between retries
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));

        // Continue to next attempt (don't return here)
        continue;
      }

      // Last attempt or non-500 error - decide what to return
      if (status === 500) {
        // This is the final attempt with a 500 error - treat as acceptable
        return {
          success: true, // Treat 500s as acceptable per your requirement
          status: status,
          message: `Server error (${status}): ${message}`,
          details: process.env.NODE_ENV === "development" ? error : undefined,
        };
      }

      // Non-500 error or exhausted retries for other errors
      return {
        success: false,
        status: status,
        message: message,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      };
    }
  }

  // This should never be reached due to the logic above, but TypeScript needs it
  return {
    success: false,
    status: 500,
    message: "Unexpected error: Max retries exceeded",
  };
};

export const getTransactions = async (
  address: string,
  status: TransactionStatus
): Promise<Transaction[]> => {
  try {
    if (!address) {
      throw new Error("Address is required");
    }

    const response = await oneRampApi.get(
      `/address-orders/${address}/${status}`
    );

    return response.data as Transaction[];
  } catch (error) {
    throw new Error("Failed to get transactions", { cause: error });
  }
};
