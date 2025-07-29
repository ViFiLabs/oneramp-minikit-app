"use server";

import { oneRampApi } from "@/constants";
import { ExchangeRateRequest, ExchangeRateResponse } from "@/types";
import fs from "fs/promises";
import path from "path";

const EXCHANGE_RATES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "exchange-rates.json"
);

interface ExchangeRatesData {
  lastUpdated: string;
  exchangeRates: Record<
    string,
    Record<string, Record<string, ExchangeRateResponse>>
  >;
}

export async function getCountryExchangeRate(
  payload: ExchangeRateRequest
): Promise<ExchangeRateResponse> {
  // Try to read from JSON file first for fast loading
  try {
    const fileContent = await fs.readFile(EXCHANGE_RATES_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as ExchangeRatesData;

    const countryRates = data.exchangeRates[payload.country];
    if (
      countryRates &&
      countryRates[payload.orderType] &&
      countryRates[payload.orderType][payload.providerType]
    ) {
      return countryRates[payload.orderType][payload.providerType];
    }
  } catch {
    // Fallback to API if cache read fails
  }

  // Fallback to API if JSON file doesn't exist or doesn't have the data
  try {
    const response = await oneRampApi.post("/exchange", payload);
    return response.data;
  } catch (error) {
    throw new Error("Failed to get country exchange rate", { cause: error });
  }
}
