"use server";

import { oneRampApi } from "@/constants";
import { ExchangeRateRequest } from "@/types";

export async function getCountryExchangeRate(payload: ExchangeRateRequest) {
  try {
    if (!payload.country || !payload.orderType || !payload.providerType) {
      throw new Error("Country and amount are required");
    }

    const response = await oneRampApi.post("/exchange", payload);

    return response.data;
  } catch (error) {
    throw new Error("Failed to get country exchange rate", { cause: error });
  }
}
