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
  orderType: string;
  providerType: string;
  conversionResponse: {
    success: boolean;
    chargeFeeInFiat: number;
    chargeFeeInUsd: number;
    exchangeRate: number;
    cryptoAmount: number;
    fiatAmount: number;
    providerPayoutAmount: number;
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

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you can add your own auth logic here)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Fetch exchange rates for each country, order type, and provider type
    for (const country of countries) {
      updatedExchangeRates[country] = {};

      for (const orderType of orderTypes) {
        updatedExchangeRates[country][orderType] = {};

        for (const providerType of providerTypes) {
          try {
            const response = await oneRampApi.get(
              `/exchange-rate/${country}/${orderType}/${providerType}`
            );
            updatedExchangeRates[country][orderType][providerType] =
              response.data;
          } catch {
            // Continue with other requests even if one fails
            updatedExchangeRates[country][orderType][providerType] = {
              exchange: 0,
              country,
              orderType,
              providerType,
              conversionResponse: {
                success: false,
                chargeFeeInFiat: 0,
                chargeFeeInUsd: 0,
                exchangeRate: 0,
                cryptoAmount: 0,
                fiatAmount: 0,
                providerPayoutAmount: 0,
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

    return NextResponse.json({
      success: true,
      message: "Exchange rates data updated successfully",
      lastUpdated: updatedData.lastUpdated,
      countriesUpdated: countries.length,
      totalRates: Object.values(updatedExchangeRates).reduce(
        (total, countryData) =>
          total +
          Object.values(countryData).reduce(
            (orderTypeTotal, orderTypeData) =>
              orderTypeTotal + Object.keys(orderTypeData).length,
            0
          ),
        0
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const fileContent = await fs.readFile(EXCHANGE_RATES_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent) as ExchangeRatesData;

    return NextResponse.json({
      success: true,
      lastUpdated: data.lastUpdated,
      countries: Object.keys(data.exchangeRates),
      totalRates: Object.values(data.exchangeRates).reduce(
        (
          total: number,
          countryData: Record<string, Record<string, ExchangeRateResponse>>
        ) =>
          total +
          Object.values(countryData).reduce(
            (
              orderTypeTotal: number,
              orderTypeData: Record<string, ExchangeRateResponse>
            ) => orderTypeTotal + Object.keys(orderTypeData).length,
            0
          ),
        0
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read exchange rates file" },
      { status: 500 }
    );
  }
}
