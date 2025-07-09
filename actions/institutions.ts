"use server";

import { oneRampApi } from "@/constants";
import { VerifyAccountDetailsRequest } from "@/types";

export async function getInstitutions(country: string, method = "buy") {
  try {
    if (!country) {
      throw new Error("Country is required");
    }

    const response = await oneRampApi.get(`/institutions/${country}/${method}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch institutions:", error);
    return [];
  }
}

export async function verifyAccountDetails(
  payload: VerifyAccountDetailsRequest
) {
  try {
    if (!payload.bankId || !payload.accountNumber || !payload.currency) {
      return new Error("Invalid payload", { cause: payload });
    }

    const response = await oneRampApi.post("/bank/verify/account", payload);

    return response.data;
  } catch (error) {
    return new Error("Failed to verify account details", { cause: error });
  }
}
