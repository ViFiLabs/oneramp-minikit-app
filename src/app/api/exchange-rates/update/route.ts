import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAllExchangeRates } from "@/src/actions/rates";

/**
 * POST /api/exchange-rates/update
 * Manually revalidate exchange rates cache
 * This endpoint forces an immediate cache refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you can add your own auth logic here)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Revalidate the exchange rates cache
    revalidateTag("exchange-rates");

    // Fetch fresh rates to confirm update
    const freshRates = await getAllExchangeRates();

    return NextResponse.json({
      success: true,
      message: "Exchange rates cache revalidated successfully",
      lastUpdated: new Date().toISOString(),
      countries: Object.keys(freshRates),
      totalRates: Object.values(freshRates).reduce(
        (total, countryData) =>
          total +
          Object.values(countryData).reduce(
            (orderTypeTotal, orderTypeData) =>
              orderTypeTotal + Object.keys(orderTypeData).length,
            0
          ),
        0
      ),
      note: "Rates are now automatically revalidated every 90 seconds. Manual revalidation is no longer required.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to revalidate exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/exchange-rates/update
 * Get current exchange rates (automatically cached and revalidated every 90 seconds)
 */
export async function GET() {
  try {
    // This will use the cached data with automatic revalidation
    const rates = await getAllExchangeRates();

    return NextResponse.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      countries: Object.keys(rates),
      totalRates: Object.values(rates).reduce(
        (total, countryData) =>
          total +
          Object.values(countryData).reduce(
            (orderTypeTotal, orderTypeData) =>
              orderTypeTotal + Object.keys(orderTypeData).length,
            0
          ),
        0
      ),
      note: "Rates are automatically revalidated every 90 seconds. No manual updates needed!",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
