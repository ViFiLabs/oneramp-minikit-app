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

export async function updateExchangeRatesCache() {
  try {
    console.log("🔄 Updating exchange rates cache...");

    const countries = ["NG", "KE", "UG", "GHA", "ZM", "TZ", "ZA"];
    const orderTypes = ["buying", "selling"];
    const providerTypes = ["momo", "bank"];
    const exchangeRates: Record<
      string,
      Record<string, Record<string, ExchangeRateResponse>>
    > = {};

    // Fetch exchange rates for all combinations
    for (const country of countries) {
      exchangeRates[country] = {};
      for (const orderType of orderTypes) {
        exchangeRates[country][orderType] = {};
        for (const providerType of providerTypes) {
          try {
            const payload: ExchangeRateRequest = {
              country,
              orderType,
              providerType,
            };
            const response = await oneRampApi.post("/exchange", payload);
            exchangeRates[country][orderType][providerType] = response.data;
            console.log(`✅ Fetched exchange rate for ${country}/${orderType}/${providerType}`);
          } catch (error) {
            console.error(`❌ Failed to fetch exchange rate for ${country}/${orderType}/${providerType}:`, error);
            // Don't fail the entire update if one rate fails
          }
        }
      }
    }

    // Save to JSON file
    const data: ExchangeRatesData = {
      lastUpdated: new Date().toISOString(),
      exchangeRates,
    };

    await fs.writeFile(EXCHANGE_RATES_FILE_PATH, JSON.stringify(data, null, 2));
    console.log("✅ Exchange rates cache updated successfully");

    // Generate client-side data file
    await generateClientSideData(data);

    return {
      success: true,
      lastUpdated: data.lastUpdated,
      countries: Object.keys(exchangeRates),
      totalRates: Object.values(exchangeRates).reduce((acc, country) => {
        return acc + Object.values(country).reduce((sum, orderType) => {
          return sum + Object.keys(orderType).length;
        }, 0);
      }, 0),
    };
  } catch (error) {
    console.error("❌ Error updating exchange rates cache:", error);
    throw error;
  }
}

async function generateClientSideData(data: ExchangeRatesData) {
  try {
    const clientDataPath = path.join(process.cwd(), "lib", "exchange-rates-data.ts");
    
    const clientDataContent = `// Auto-generated file - do not edit manually
// Generated on: ${new Date().toISOString()}

export interface ExchangeRateResponse {
  exchange: number;
  fee: number;
  fiatAmount: number;
  cryptoAmount: number;
  fiatType: string;
  cryptoType: string;
  country: string;
  orderType: string;
  providerType: string;
}

const EXCHANGE_RATES_DATA = ${JSON.stringify(data, null, 2)};

export function getExchangeRateClient(
  country: string,
  orderType: string,
  providerType: string
): ExchangeRateResponse | null {
  try {
    const countryRates = EXCHANGE_RATES_DATA.exchangeRates[country];
    if (!countryRates) return null;

    const orderTypeRates = countryRates[orderType];
    if (!orderTypeRates) return null;

    const rate = orderTypeRates[providerType];
    return rate || null;
  } catch {
    return null;
  }
}

export function getAllExchangeRatesClient(): Record<string, Record<string, Record<string, ExchangeRateResponse>>> {
  return EXCHANGE_RATES_DATA.exchangeRates;
}

export function getLastUpdated(): string {
  return EXCHANGE_RATES_DATA.lastUpdated;
}
`;

    await fs.writeFile(clientDataPath, clientDataContent);
    console.log("✅ Client-side exchange rates data generated");
  } catch (error) {
    console.error("❌ Error generating client-side data:", error);
    throw error;
  }
}
