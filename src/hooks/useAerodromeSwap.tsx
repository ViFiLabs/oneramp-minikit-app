"use client";

import { useState, useCallback, useEffect } from "react";
import {
  parseUnits,
  erc20Abi,
  createPublicClient,
  http,
  type WalletClient,
} from "viem";
import { base } from "viem/chains";
import { useWalletClient } from "wagmi";
import {
  V3_SWAP_ROUTER,
  V3_SWAP_ROUTER_ABI,
  V3_TICK_SPACING,
} from "@/src/config/v3-swap-config";
import { getTokenAddress, getTokenDecimals } from "@/data/token-config";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { getLiveExchangeRate, getV3Quote } from "@/src/utils/v3-rate-fetcher";

interface SwapParams {
  tokenASymbol: string;
  tokenBSymbol: string;
  amountIn: string;
  slippage?: number; // in percentage, default 2.5%
  deadline?: number; // in minutes, default 20
}

interface SwapState {
  isLoading: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  approvalHash?: string;
  swapHash?: string;
  error?: string;
  successHandled?: boolean;
}

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: base,
  transport: http(
    process.env.NEXT_PUBLIC_INFURA_API_KEY
      ? `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
      : "https://mainnet.base.org",
  ),
});

// Convert technical error messages to user-friendly messages
const getUserFriendlyError = (error: any): string => {
  if (!error) return "Transaction failed";

  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Check for user rejection/denial patterns (includes viem "not authorized" message)
  if (
    lowerMessage.includes("user rejected") ||
    lowerMessage.includes("user denied") ||
    lowerMessage.includes("user cancelled") ||
    lowerMessage.includes("transaction rejected") ||
    lowerMessage.includes("denied transaction signature") ||
    lowerMessage.includes("has not been authorized")
  ) {
    return "Transaction rejected";
  }

  // Check for approval-related errors
  if (
    lowerMessage.includes("approval") &&
    (lowerMessage.includes("rejected") || lowerMessage.includes("failed"))
  ) {
    return "Transaction rejected";
  }

  // Generic transaction failures
  if (
    lowerMessage.includes("transaction failed") ||
    lowerMessage.includes("execution reverted") ||
    lowerMessage.includes("insufficient funds") ||
    lowerMessage.includes("gas") ||
    lowerMessage.includes("revert")
  ) {
    return "Transaction failed";
  }

  // Network or connection issues
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("timeout")
  ) {
    return "Network error";
  }

  // Fallback for any other errors
  return "Transaction failed";
};

export function useAerodromeSwap() {
  const { address, isConnected } = useWalletGetInfo();
  const { data: walletClient } = useWalletClient({ chainId: base.id });
  const [swapState, setSwapState] = useState<SwapState>({
    isLoading: false,
    isApproving: false,
    isSwapping: false,
  });

  // Reset swap state when component unmounts or address changes
  useEffect(() => {
    return () => {
      setSwapState({
        isLoading: false,
        isApproving: false,
        isSwapping: false,
      });
    };
  }, [address]);

  // Check allowance for a token
  const checkAllowance = async (
    tokenSymbol: string,
    amount: string,
  ): Promise<boolean> => {
    const tokenAddress = getTokenAddress(tokenSymbol, base.id);
    const decimals = getTokenDecimals(tokenSymbol, base.id);

    if (!tokenAddress || !address) return false;

    try {
      const amountBigInt = parseUnits(amount, decimals);
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [
          address as `0x${string}`,
          V3_SWAP_ROUTER as `0x${string}`,
        ],
      });

      return allowance >= amountBigInt;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  // Approve token spending
  const approveToken = async (
    tokenSymbol: string,
    amount: string,
  ): Promise<string> => {
    const tokenAddress = getTokenAddress(tokenSymbol, base.id);
    const decimals = getTokenDecimals(tokenSymbol, base.id);

    if (!tokenAddress || !address) {
      throw new Error("Token address or user address not found");
    }

    setSwapState((prev) => ({ ...prev, isApproving: true, error: undefined }));

    try {
      if (!walletClient) {
        throw new Error(
          "Wallet not ready. Please ensure you're connected via the app's wallet modal.",
        );
      }
      const amountBigInt = parseUnits(amount, decimals);

      const hash = await (walletClient as WalletClient).writeContract({
        chain: base,
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [V3_SWAP_ROUTER as `0x${string}`, amountBigInt],
        account: address as `0x${string}`,
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setSwapState((prev) => ({
        ...prev,
        isApproving: false,
        approvalHash: hash,
      }));
      return hash;
    } catch (error) {
      console.error("Error approving token:", error);
      const userFriendlyError = getUserFriendlyError(error);
      setSwapState((prev) => ({
        ...prev,
        isApproving: false,
        error: userFriendlyError,
      }));
      throw new Error(userFriendlyError);
    }
  };

  // Execute swap
  const executeSwap = async ({
    tokenASymbol,
    tokenBSymbol,
    amountIn,
    slippage = 2.5,
    deadline = 20,
  }: SwapParams): Promise<string> => {
    const tokenAAddress = getTokenAddress(tokenASymbol, base.id);
    const tokenBAddress = getTokenAddress(tokenBSymbol, base.id);
    const tokenADecimals = getTokenDecimals(tokenASymbol, base.id);

    if (!tokenAAddress || !tokenBAddress || !address) {
      throw new Error("Token addresses or user address not found");
    }

    setSwapState((prev) => ({ ...prev, isSwapping: true, error: undefined }));

    try {
      if (!walletClient) {
        throw new Error(
          "Wallet not ready. Please ensure you're connected via the app's wallet modal.",
        );
      }
      const amountInBigInt = parseUnits(amountIn, tokenADecimals);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + deadline * 60;

      // V3 uses direct token pairs with tick spacing from config (e.g. 0.05% fee tier)
      const tickSpacing = V3_TICK_SPACING;

      // Get live exchange rate instead of hardcoding
      console.log("🔍 Fetching live V3 exchange rate...");
      console.log(`💱 Converting: ${tokenASymbol} → ${tokenBSymbol}`);

      let effectiveRate = 1505.36; // Fallback USDC to cNGN rate
      let rateSource = "Emergency Fallback";

      try {
        const liveRate = await getLiveExchangeRate();

        // Validate rate before using
        if (
          liveRate &&
          liveRate.usdcTocNGN &&
          !isNaN(liveRate.usdcTocNGN) &&
          liveRate.usdcTocNGN > 0
        ) {
          effectiveRate = liveRate.usdcTocNGN;
          rateSource = liveRate.source || "Live Rate";
        } else {
        }
      } catch (rateError) {
        console.error("❌ Rate fetching failed:", rateError);
      }

      if (!amountIn || amountIn === "0" || isNaN(parseFloat(amountIn))) {
        throw new Error(`Invalid amount input: ${amountIn}`);
      }

      // Calculate output based on conversion direction
      let estimatedOutputAmount: number;

      if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
        // USDC → CNGN: multiply by rate
        estimatedOutputAmount = parseFloat(amountIn) * effectiveRate;
      } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
        // CNGN → USDC: divide by rate
        estimatedOutputAmount = parseFloat(amountIn) / effectiveRate;
      } else {
        throw new Error(
          `Unsupported conversion pair: ${tokenASymbol} → ${tokenBSymbol}`,
        );
      }

      if (isNaN(estimatedOutputAmount)) {
        throw new Error(
          `Calculated output amount is NaN: ${parseFloat(
            amountIn,
          )} * ${effectiveRate} = ${estimatedOutputAmount}`,
        );
      }

      // Safely convert to BigInt with validation
      const outputAmountString = estimatedOutputAmount.toString();
      const tokenBDecimals = getTokenDecimals(tokenBSymbol, base.id);

      try {
        const estimatedOutputBigInt = parseUnits(
          outputAmountString,
          tokenBDecimals,
        );

        // Display rate information based on conversion direction
        if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
        } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
          const reverseRate = 1 / effectiveRate;
        }

        // Calculate minimum amount out with slippage protection
        const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
        const amountOutMin =
          (estimatedOutputBigInt * slippageMultiplier) / BigInt(10000);

        // V3 ExactInputSingle parameters
        const exactInputSingleParams = {
          tokenIn: tokenAAddress as `0x${string}`,
          tokenOut: tokenBAddress as `0x${string}`,
          tickSpacing,
          recipient: address as `0x${string}`,
          deadline: BigInt(deadlineTimestamp),
          amountIn: amountInBigInt,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: BigInt(0), // No price limit
        };

        const hash = await (walletClient as WalletClient).writeContract({
          chain: base,
          address: V3_SWAP_ROUTER as `0x${string}`,
          abi: V3_SWAP_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [exactInputSingleParams],
          account: address as `0x${string}`,
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash });

        setSwapState((prev) => ({
          ...prev,
          isSwapping: false,
          swapHash: hash,
          successHandled: false,
        }));
        return hash;
      } catch (parseUnitsError) {
        console.error(
          "❌ Error in parseUnits or swap execution:",
          parseUnitsError,
        );
        // Use user-friendly error instead of technical details
        throw new Error(getUserFriendlyError(parseUnitsError));
      }
    } catch (error) {
      console.error("Error executing swap:", error);
      const userFriendlyError = getUserFriendlyError(error);
      setSwapState((prev) => ({
        ...prev,
        isSwapping: false,
        error: userFriendlyError,
      }));
      throw new Error(userFriendlyError);
    }
  };

  // Main swap function that handles approval and swap
  const swap = async (params: SwapParams) => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      setSwapState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      // Check if we need approval first
      const needsApproval = !(await checkAllowance(
        params.tokenASymbol,
        params.amountIn,
      ));

      if (needsApproval) {
        await approveToken(params.tokenASymbol, params.amountIn);

        // Wait 1.5 seconds for the approve transaction to settle onchain
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Execute the swap
      const swapHash = await executeSwap(params);
    } catch (error) {
      console.error("❌ Swap failed:", error);
      throw error;
    } finally {
      setSwapState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Get estimated output amount from Aerodrome router
  const getQuote = useCallback(
    async (tokenASymbol: string, tokenBSymbol: string, amountIn: string) => {
      const tokenAAddress = getTokenAddress(tokenASymbol, base.id);
      const tokenBAddress = getTokenAddress(tokenBSymbol, base.id);
      const tokenADecimals = getTokenDecimals(tokenASymbol, base.id);
      const tokenBDecimals = getTokenDecimals(tokenBSymbol, base.id);

      if (!tokenAAddress || !tokenBAddress || !amountIn || amountIn === "0") {
        return null;
      }

      try {
        const amountInBigInt = parseUnits(amountIn, tokenADecimals);

        console.log(
          "🔍 Getting quote for:",
          amountIn,
          tokenASymbol,
          "->",
          tokenBSymbol,
        );
        console.log("Token A address:", tokenAAddress);
        console.log("Token B address:", tokenBAddress);
        console.log("Amount in BigInt:", amountInBigInt.toString());

        // Create route for Aerodrome
        // V3 doesn't use routes concept - direct token pairs
        console.log("🔍 Getting V3 quote...");
        console.log("Token pair:", tokenASymbol, "=>", tokenBSymbol);
        console.log("Amount in:", amountIn, tokenASymbol);

        try {
          // Use live V3 rate fetcher instead of hardcoded rate
          console.log("🔍 Getting live V3 quote...");
          console.log("📝 Quote params:", {
            amountIn,
            tokenASymbol,
            tokenBSymbol,
          });

          const quote = await getV3Quote(amountIn, tokenASymbol, tokenBSymbol);

          console.log(
            "✅ Live V3 quote SUCCESS:",
            amountIn,
            tokenASymbol,
            "=>",
            quote.amountOut,
            tokenBSymbol,
          );
          console.log(
            "📈 Live exchange rate:",
            1,
            tokenASymbol,
            "=",
            quote.rate,
            tokenBSymbol,
          );
          console.log("🔧 Source:", quote.source);

          return {
            amountOut: quote.amountOut, // Already formatted with proper decimals
            rate: quote.rate, // Already formatted with proper decimals
            source: quote.source,
            timestamp: quote.timestamp,
            isV3: true,
            isLive: quote.success,
          };
        } catch (routerError) {
          console.error("❌ Live V3 quote FAILED with error:", routerError);
          console.error("❌ Error details:", {
            message:
              routerError instanceof Error
                ? routerError.message
                : String(routerError),
            stack: routerError instanceof Error ? routerError.stack : undefined,
            cause: routerError instanceof Error ? routerError.cause : undefined,
          });

          // Fallback - handle both directions
          const fallbackRate = 1505.36; // USDC to cNGN rate
          let amountOut: number;
          let displayRate: string;

          if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
            // USDC → CNGN: multiply by rate
            amountOut = parseFloat(amountIn) * fallbackRate;
            displayRate = fallbackRate.toFixed(4);
            console.log(
              `📍 Using emergency fallback: ${amountIn} USDC * ${fallbackRate} = ${amountOut} CNGN`,
            );
          } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
            // CNGN → USDC: divide by rate
            amountOut = parseFloat(amountIn) / fallbackRate;
            displayRate = (1 / fallbackRate).toFixed(8);
            console.log(
              `📍 Using emergency fallback: ${amountIn} CNGN / ${fallbackRate} = ${amountOut} USDC`,
            );
          } else {
            // Unsupported pair
            amountOut = 0;
            displayRate = "0";
            console.log(
              `❌ Unsupported conversion pair: ${tokenASymbol} → ${tokenBSymbol}`,
            );
          }

          return {
            amountOut: amountOut.toFixed(tokenBSymbol === "USDC" ? 8 : 4),
            rate: displayRate,
            source: "Emergency Fallback",
            isV3: true,
            isFallback: true,
          };
        }
      } catch (error) {
        console.error("Error getting quote:", error);
        return null;
      }
    },
    [],
  );

  // Check if approval is successful and ready to swap
  const isApprovalSuccess = swapState.approvalHash && !swapState.isApproving;

  // Check if swap is successful
  const isSwapSuccess =
    swapState.swapHash && !swapState.isSwapping && !swapState.successHandled;

  // Function to mark success as handled to prevent infinite loops
  const markSuccessHandled = useCallback(() => {
    setSwapState((prev) => ({ ...prev, successHandled: true }));
  }, []);

  // Clear error when user dismisses the error sheet
  const clearError = useCallback(() => {
    setSwapState((prev) => ({ ...prev, error: undefined }));
  }, []);

  return {
    swap,
    getQuote,
    swapState,
    checkAllowance,
    approveToken,
    executeSwap,
    isApprovalSuccess,
    isSwapSuccess,
    markSuccessHandled,
    clearError,
  };
}
