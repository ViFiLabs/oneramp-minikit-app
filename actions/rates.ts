"use server";

import { oneRampApi } from "@/constants";
import { ExchangeRateRequest, ExchangeRateResponse } from "@/types";
import { unstable_cache } from "next/cache";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const CACHE_TAG = "exchange-rates";

// Cache exchange rate for 90 seconds (1.5 minutes)
// This ensures rates are fresh but not too aggressive with API calls
const CACHE_DURATION = 90;

// Legacy file path (kept for backward compatibility)
const EXCHANGE_RATES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "exchange-rates.json"
);

// Legacy interface (kept for backward compatibility)
interface ExchangeRatesData {
  lastUpdated: string;
  exchangeRates: Record<
    string,
    Record<string, Record<string, ExchangeRateResponse>>
  >;
}

/**
 * Get exchange rate with automatic revalidation every 90 seconds
 * Uses Next.js built-in caching for optimal performance
 */
export async function getCountryExchangeRate(
  payload: ExchangeRateRequest
): Promise<ExchangeRateResponse> {
  // Create a unique cache key for this specific rate
  const cacheKey = `exchange-rate-${payload.country}-${payload.orderType}-${payload.providerType}`;

  const getCachedRate = unstable_cache(
    async () => {
      try {
        const response = await oneRampApi.post("/exchange", payload);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch exchange rate for ${cacheKey}:`, error);
        throw new Error("Failed to get country exchange rate", {
          cause: error,
        });
      }
    },
    [cacheKey],
    {
      tags: [CACHE_TAG],
      revalidate: CACHE_DURATION, // Revalidate every 90 seconds
    }
  );

  return await getCachedRate();
}

/**
 * Get all exchange rates for all countries with automatic revalidation
 * This is more efficient for bulk operations
 */
export async function getAllExchangeRates(): Promise<
  Record<string, Record<string, Record<string, ExchangeRateResponse>>>
> {
  const getCachedRates = unstable_cache(
    async () => {
      const countries = ["NG", "KE", "UG", "GHA", "ZM", "TZ", "ZA"];
      const orderTypes = ["buying", "selling"];
      const providerTypes = ["momo", "bank"];
      const exchangeRates: Record<
        string,
        Record<string, Record<string, ExchangeRateResponse>>
      > = {};

      // Fetch all rates in parallel for better performance
      const fetchPromises = countries.flatMap((country) =>
        orderTypes.flatMap((orderType) =>
          providerTypes.map(async (providerType) => {
            try {
              const payload: ExchangeRateRequest = {
                country,
                orderType,
                providerType,
              };
              const response = await oneRampApi.post("/exchange", payload);
              return { country, orderType, providerType, data: response.data };
            } catch (error) {
              console.error(
                `Failed to fetch rate for ${country}/${orderType}/${providerType}:`,
                error
              );
              return null;
            }
          })
        )
      );

      const results = await Promise.all(fetchPromises);

      // Build the rates object
      results.forEach((result) => {
        if (result) {
          if (!exchangeRates[result.country]) {
            exchangeRates[result.country] = {};
          }
          if (!exchangeRates[result.country][result.orderType]) {
            exchangeRates[result.country][result.orderType] = {};
          }
          exchangeRates[result.country][result.orderType][result.providerType] =
            result.data;
        }
      });

      return exchangeRates;
    },
    ["all-exchange-rates"],
    {
      tags: [CACHE_TAG],
      revalidate: CACHE_DURATION, // Revalidate every 90 seconds
    }
  );

  return await getCachedRates();
}

/**
 * Manually revalidate all exchange rates (for admin use)
 */
export async function revalidateExchangeRates() {
  revalidatePath("/", "layout");
  return { success: true, message: "Exchange rates revalidated" };
}

/**
 * @deprecated This function is no longer needed with automatic revalidation.
 * Exchange rates now update automatically every 90 seconds.
 * Use getAllExchangeRates() instead for current rates.
 */
export async function updateExchangeRatesCache() {
  try {
    console.log("🔄 Updating exchange rates cache (legacy method)...");

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
            console.log(
              `✅ Fetched exchange rate for ${country}/${orderType}/${providerType}`
            );
          } catch (error) {
            console.error(
              `❌ Failed to fetch exchange rate for ${country}/${orderType}/${providerType}:`,
              error
            );
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
        return (
          acc +
          Object.values(country).reduce((sum, orderType) => {
            return sum + Object.keys(orderType).length;
          }, 0)
        );
      }, 0),
    };
  } catch (error) {
    console.error("❌ Error updating exchange rates cache:", error);
    throw error;
  }
}

/**
 * @deprecated This function is no longer needed with automatic revalidation.
 * Client-side data is now served directly from the Next.js cache.
 */
async function generateClientSideData(data: ExchangeRatesData) {
  try {
    const clientDataPath = path.join(
      process.cwd(),
      "lib",
      "exchange-rates-data.ts"
    );

    const clientDataContent = `// Auto-generated file - do not edit manually
// Generated on: ${new Date().toISOString()}

// Import the correct type from types.ts
import type { ExchangeRateResponse } from "@/types";

// Re-export for convenience
export type { ExchangeRateResponse };

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
