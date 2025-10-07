import { NextRequest, NextResponse } from "next/server";
import { oneRampApi } from "@/constants";
import fs from "fs/promises";
import path from "path";

const EXCHANGE_RATES_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "exchange-rates.json"
);

interface ExchangeRateResponse {
  exchange: number;
  country: string;
  conversionResponse: {
    success: boolean;
    chargeFeeInFiat: number;
    chargeFeeInUsd: number;
    exchangeRate: number;
    fiatAmount: number;
    gasFeeInFiat: number;
  };
}

interface ExchangeRatesData {
  lastUpdated: string;
  exchangeRates: Record<
    string,
    Record<string, Record<string, ExchangeRateResponse>>
  >;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Starting automated exchange rates update...");

    const countries = [
      "NG", // Nigeria
      "KE", // Kenya
      "UG", // Uganda
      "GHA", // Ghana
      "ZM", // Zambia
      "TZ", // Tanzania
      "ZA", // South Africa
    ];

    const orderTypes = ["buying", "selling"];
    const providerTypes = ["momo", "bank"];
    const updatedExchangeRates: Record<
      string,
      Record<string, Record<string, ExchangeRateResponse>>
    > = {};

    let successCount = 0;
    let errorCount = 0;

    // Fetch exchange rates for each country, order type, and provider type
    for (const country of countries) {
      updatedExchangeRates[country] = {};

      for (const orderType of orderTypes) {
        updatedExchangeRates[country][orderType] = {};

        for (const providerType of providerTypes) {
          try {
            const response = await oneRampApi.post("/exchange", {
              country,
              orderType,
              providerType,
            });
            updatedExchangeRates[country][orderType][providerType] =
              response.data;
            successCount++;
            console.log(
              `✅ Updated rates for ${country}-${orderType}-${providerType}`
            );
          } catch (error) {
            errorCount++;
            console.error(
              `❌ Failed to update rates for ${country}-${orderType}-${providerType}:`,
              error
            );
            // Continue with other requests even if one fails
            updatedExchangeRates[country][orderType][providerType] = {
              exchange: 0,
              country,
              conversionResponse: {
                success: false,
                chargeFeeInFiat: 0,
                chargeFeeInUsd: 0,
                exchangeRate: 0,
                fiatAmount: 0,
                gasFeeInFiat: 0,
              },
            };
          }
        }
      }
    }

    // Create the updated data structure
    const updatedData: ExchangeRatesData = {
      lastUpdated: new Date().toISOString(),
      exchangeRates: updatedExchangeRates,
    };

    // Write to the JSON file
    await fs.writeFile(
      EXCHANGE_RATES_FILE_PATH,
      JSON.stringify(updatedData, null, 2),
      "utf-8"
    );

    // Generate client-side data file while preserving existing code
    const clientDataPath = path.join(
      process.cwd(),
      "lib",
      "exchange-rates-data.ts"
    );

    // Read existing file to preserve additional code
    let existingContent = "";
    try {
      existingContent = await fs.readFile(clientDataPath, "utf-8");
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Extract the additional code that should be preserved
    const additionalCodeMatch = existingContent.match(
      /\/\/ Fixed cross rates:[\s\S]*$/
    );
    const additionalCode = additionalCodeMatch
      ? additionalCodeMatch[0]
      : `// Fixed cross rates: 1 NGN -> Local currency units
export const NGN_TO_LOCAL_RATES: Record<string, number> = {
  UG: 2.319,
  KE: 0.08645,
  TZ: 1.655,
  GHA: 0.008266,
};

export function getNgnToLocalRate(country: string): number | undefined {
  return NGN_TO_LOCAL_RATES[country];
}

// Instant client-side exchange rate getter
export function getExchangeRateClient(
  country: string,
  orderType: "buying" | "selling" = "selling",
  providerType: "momo" | "bank" = "momo"
) {
  if (!country) return null;
  
  const countryRates = exchangeRatesData.exchangeRates[country];
  if (countryRates && countryRates[orderType] && countryRates[orderType][providerType]) {
    return countryRates[orderType][providerType];
  }
  
  return null;
}`;

    const clientDataContent = `// Client-side exchange rates data for instant access
export const exchangeRatesData = ${JSON.stringify(updatedData, null, 2)};

${additionalCode}
`;

    await fs.writeFile(clientDataPath, clientDataContent, "utf-8");

    const totalRates = Object.values(updatedExchangeRates).reduce(
      (total, countryData) =>
        total +
        Object.values(countryData).reduce(
          (orderTypeTotal, orderTypeData) =>
            orderTypeTotal + Object.keys(orderTypeData).length,
          0
        ),
      0
    );

    console.log(
      `✅ Exchange rates update completed: ${successCount} successful, ${errorCount} failed, ${totalRates} total rates`
    );

    return NextResponse.json({
      success: true,
      message: "Exchange rates data updated successfully via cron job",
      lastUpdated: updatedData.lastUpdated,
      countriesUpdated: countries.length,
      totalRates,
      successCount,
      errorCount,
    });
  } catch (error) {
    console.error("❌ Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Failed to update exchange rates via cron job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
