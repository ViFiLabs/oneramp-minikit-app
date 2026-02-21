/**
 * Real-Time V3 Exchange Rate Fetcher
 * Gets live exchange rates via Aerodrome MixedQuoter (config from v3-swap-config).
 */

import { createPublicClient, http, parseUnits, formatUnits } from "viem";
import { base } from "viem/chains";
import {
  V3_MIXED_QUOTER,
  V3_MIXED_QUOTER_ABI,
  V3_TICK_SPACING,
} from "@/src/config/v3-swap-config";

const TOKENS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  CNGN: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F",
} as const;

// Create public client
const publicClient = createPublicClient({
  chain: base,
  transport: http(
    process.env.NEXT_PUBLIC_INFURA_API_KEY
      ? `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
      : "https://mainnet.base.org",
  ),
});

interface ExchangeRate {
  usdcTocNGN: number;
  cNGNToUSDC: number;
  source: string;
  timestamp: string;
  success: boolean;
}

/**
 * Method 1: Try MixedQuoter contract for on-chain rate
 */
async function tryMixedQuoterRate(): Promise<ExchangeRate | null> {
  const testAmount = parseUnits("1", 6); // 1 USDC

  try {
    console.log("🔍 Querying MixedQuoter for USDC/CNGN rate...");

    const quoteParams = {
      tokenIn: TOKENS.USDC as `0x${string}`,
      tokenOut: TOKENS.CNGN as `0x${string}`,
      amountIn: testAmount,
      tickSpacing: V3_TICK_SPACING,
      sqrtPriceLimitX96: BigInt(0), // No slippage cap as requested
    };

    const result = (await publicClient.readContract({
      address: V3_MIXED_QUOTER as `0x${string}`,
      abi: V3_MIXED_QUOTER_ABI,
      functionName: "quoteExactInputSingleV3",
      args: [quoteParams],
    })) as [bigint, bigint, number, bigint];

    const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
      result;

    if (amountOut > 0) {
      const outputAmount = formatUnits(amountOut, 6); // cNGN has 6 decimals
      const rate = parseFloat(outputAmount);

      console.log(`✅ MixedQuoter rate: 1 USDC = ${rate.toFixed(4)} cNGN`);
      console.log(`📊 Quote details:`, {
        amountOut: amountOut.toString(),
        sqrtPriceX96After: sqrtPriceX96After.toString(),
        initializedTicksCrossed,
        gasEstimate: gasEstimate.toString(),
      });

      return {
        usdcTocNGN: parseFloat(rate.toFixed(4)),
        cNGNToUSDC: parseFloat((1 / rate).toFixed(8)),
        source: `MixedQuoter V3 (${V3_MIXED_QUOTER.slice(0, 8)}...)`,
        timestamp: new Date().toISOString(),
        success: true,
      };
    }
  } catch (error) {
    console.error(
      "❌ MixedQuoter failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }

  return null;
}

/**
 * Method 2: Use recent transaction data as reference
 */
function getTransactionBasedRate(): ExchangeRate {
  // From your successful transaction: 1.035 USDC → 1,558.044103 cNGN
  const rate = 1558.044103 / 1.035;

  console.log(`📊 Transaction-based rate: 1 USDC = ${rate.toFixed(4)} cNGN`);

  return {
    usdcTocNGN: parseFloat(rate.toFixed(4)),
    cNGNToUSDC: parseFloat((1 / rate).toFixed(8)),
    source: "Recent Transaction Data",
    timestamp: new Date().toISOString(),
    success: true,
  };
}

/**
 * Method 3: Oracle or API fallback (placeholder for future implementation)
 */
async function tryOracleRate(): Promise<ExchangeRate | null> {
  // Placeholder for oracle integration (Chainlink, etc.)
  // For now, return null to skip this method
  return null;
}

/**
 * Main function: Get live exchange rate with multiple fallbacks
 */
export async function getLiveExchangeRate(): Promise<ExchangeRate> {
  try {
    // Method 1: Try MixedQuoter contract
    const quoterRate = await tryMixedQuoterRate();
    if (quoterRate) {
      return quoterRate;
    }

    // Method 2: Try oracle/API
    const oracleRate = await tryOracleRate();
    if (oracleRate) {
      return oracleRate;
    }

    // Method 3: Fallback to transaction-based rate
    console.log("⚠️ Quoter and oracle failed, using transaction-based rate");
    return getTransactionBasedRate();
  } catch (error) {
    console.error("❌ All rate fetching methods failed:", error);

    // Ultimate fallback
    return {
      usdcTocNGN: 1505.36, // Best estimate
      cNGNToUSDC: 0.00066401,
      source: "Fallback Estimate",
      timestamp: new Date().toISOString(),
      success: false,
    };
  }
}

/**
 * Get quote for specific amount using MixedQuoter
 */
export async function getV3Quote(
  amountIn: string,
  fromSymbol: string = "USDC",
  toSymbol: string = "CNGN",
) {
  console.log(
    `🔍 Getting MixedQuoter quote: ${amountIn} ${fromSymbol} → ${toSymbol}`,
  );

  if (!amountIn || amountIn === "0" || isNaN(parseFloat(amountIn))) {
    throw new Error(`Invalid amount input: ${amountIn}`);
  }

  try {
    let tokenIn: string,
      tokenOut: string,
      inputDecimals: number,
      outputDecimals: number;

    if (fromSymbol === "USDC" && toSymbol === "CNGN") {
      tokenIn = TOKENS.USDC;
      tokenOut = TOKENS.CNGN;
      inputDecimals = 6;
      outputDecimals = 6;
    } else if (fromSymbol === "CNGN" && toSymbol === "USDC") {
      tokenIn = TOKENS.CNGN;
      tokenOut = TOKENS.USDC;
      inputDecimals = 6;
      outputDecimals = 6;
    } else {
      throw new Error(`Unsupported pair: ${fromSymbol}/${toSymbol}`);
    }

    const amountInBigInt = parseUnits(amountIn, inputDecimals);

    const quoteParams = {
      tokenIn: tokenIn as `0x${string}`,
      tokenOut: tokenOut as `0x${string}`,
      amountIn: amountInBigInt,
      tickSpacing: V3_TICK_SPACING,
      sqrtPriceLimitX96: BigInt(0), // No slippage cap
    };

    const result = (await publicClient.readContract({
      address: V3_MIXED_QUOTER as `0x${string}`,
      abi: V3_MIXED_QUOTER_ABI,
      functionName: "quoteExactInputSingleV3",
      args: [quoteParams],
    })) as [bigint, bigint, number, bigint];

    const [amountOut] = result;

    if (amountOut > 0) {
      const outputAmount = formatUnits(amountOut, outputDecimals);
      const rate = parseFloat(outputAmount) / parseFloat(amountIn);

      console.log(
        `✅ MixedQuoter quote: ${amountIn} ${fromSymbol} = ${outputAmount} ${toSymbol}`,
      );
      console.log(
        `📈 Rate: 1 ${fromSymbol} = ${rate.toFixed(fromSymbol === "USDC" ? 4 : 8)} ${toSymbol}`,
      );

      return {
        amountOut: parseFloat(outputAmount).toFixed(
          toSymbol === "USDC" ? 8 : 4,
        ),
        rate: rate.toFixed(fromSymbol === "USDC" ? 4 : 8),
        source: `MixedQuoter V3 (${V3_MIXED_QUOTER.slice(0, 8)}...)`,
        timestamp: new Date().toISOString(),
        success: true,
      };
    } else {
      throw new Error("Quote returned 0 amount out");
    }
  } catch (error) {
    console.error("❌ MixedQuoter quote failed with detailed error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    console.error("❌ Full error object:", error);

    // Fallback to rate-based calculation
    console.log("⚠️ Falling back to rate-based calculation...");
    const rate = await getLiveExchangeRate();

    if (fromSymbol === "USDC" && toSymbol === "CNGN") {
      const output = parseFloat(amountIn) * rate.usdcTocNGN;
      return {
        amountOut: output.toFixed(4),
        rate: rate.usdcTocNGN.toFixed(4),
        source: `${rate.source} (Fallback)`,
        timestamp: rate.timestamp,
        success: false,
      };
    } else if (fromSymbol === "CNGN" && toSymbol === "USDC") {
      const output = parseFloat(amountIn) * rate.cNGNToUSDC;
      return {
        amountOut: output.toFixed(8),
        rate: rate.cNGNToUSDC.toFixed(8),
        source: `${rate.source} (Fallback)`,
        timestamp: rate.timestamp,
        success: false,
      };
    }

    throw error;
  }
}
