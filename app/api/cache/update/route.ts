import { NextRequest, NextResponse } from "next/server";
import { updateInstitutionsCache } from "@/actions/institutions";
import { updateExchangeRatesCache } from "@/actions/rates";

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // You can add token validation here if needed
    // if (token !== process.env.ADMIN_TOKEN) {
    //   return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    // }

    console.log("🔄 Starting combined cache update...");

    // Update both caches in parallel
    const [institutionsResult, exchangeRatesResult] = await Promise.allSettled([
      updateInstitutionsCache(),
      updateExchangeRatesCache(),
    ]);

    const results = {
      institutions: {
        success: institutionsResult.status === "fulfilled",
        data: institutionsResult.status === "fulfilled" ? institutionsResult.value : null,
        error: institutionsResult.status === "rejected" ? institutionsResult.reason : null,
      },
      exchangeRates: {
        success: exchangeRatesResult.status === "fulfilled",
        data: exchangeRatesResult.status === "fulfilled" ? exchangeRatesResult.value : null,
        error: exchangeRatesResult.status === "rejected" ? exchangeRatesResult.reason : null,
      },
    };

    const allSuccessful = results.institutions.success && results.exchangeRates.success;
    const statusCode = allSuccessful ? 200 : 207; // 207 = Multi-Status

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful 
        ? "All caches updated successfully" 
        : "Some caches failed to update",
      timestamp: new Date().toISOString(),
      results,
    }, { status: statusCode });

  } catch (error) {
    console.error("❌ Error updating caches:", error);
    return NextResponse.json(
      { 
        error: "Failed to update caches",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Import the cache data to show current status
    const fs = await import("fs/promises");
    const path = await import("path");

    const results: {
      institutions: any;
      exchangeRates: any;
    } = {
      institutions: null,
      exchangeRates: null,
    };

    // Check institutions cache
    try {
      const institutionsPath = path.join(process.cwd(), "data", "institutions.json");
      const institutionsData = await fs.readFile(institutionsPath, "utf-8");
      results.institutions = JSON.parse(institutionsData);
    } catch (error) {
      results.institutions = { error: "Cache file not found or invalid" };
    }

    // Check exchange rates cache
    try {
      const ratesPath = path.join(process.cwd(), "data", "exchange-rates.json");
      const ratesData = await fs.readFile(ratesPath, "utf-8");
      results.exchangeRates = JSON.parse(ratesData);
    } catch (error) {
      results.exchangeRates = { error: "Cache file not found or invalid" };
    }

    return NextResponse.json({
      success: true,
      message: "Cache status retrieved",
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error("❌ Error checking cache status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check cache status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 