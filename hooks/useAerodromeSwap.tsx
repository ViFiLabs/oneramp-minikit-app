"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  parseUnits, 
  formatUnits, 
  erc20Abi,
  createPublicClient,
  http,
  createWalletClient,
  custom
} from "viem";
import { base } from "viem/chains";
import { getTokenAddress, getTokenDecimals } from "@/data/token-config";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { getLiveExchangeRate, getV3Quote } from "@/utils/v3-rate-fetcher";
// V3 SwapRouter (SlipStream) - your requested contract
const AERODROME_V3_SWAP_ROUTER = "0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5";
const AERODROME_V3_FACTORY = "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A";

// V3 SwapRouter ABI - from your provided JSON
const AERODROME_V3_ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "int24", "name": "tickSpacing", "type": "int24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "factory",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

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
  transport: http(process.env.NEXT_PUBLIC_INFURA_API_KEY ? 
    `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}` :
    'https://mainnet.base.org'
  ),
});

export function useAerodromeSwap() {
  const { address, isConnected } = useWalletGetInfo();
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

  // Get wallet client for transactions
  const getWalletClient = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("No wallet provider found");
    }
    
    return createWalletClient({
      chain: base,
      transport: custom(window.ethereum as any),
    });
  }, []);

  // Check allowance for a token
  const checkAllowance = async (tokenSymbol: string, amount: string): Promise<boolean> => {
    const tokenAddress = getTokenAddress(tokenSymbol, base.id);
    const decimals = getTokenDecimals(tokenSymbol, base.id);
    
    if (!tokenAddress || !address) return false;
    
    try {
      const amountBigInt = parseUnits(amount, decimals);
      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, AERODROME_V3_SWAP_ROUTER as `0x${string}`],
      });
      
      return allowance >= amountBigInt;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  // Approve token spending
  const approveToken = async (tokenSymbol: string, amount: string): Promise<string> => {
    const tokenAddress = getTokenAddress(tokenSymbol, base.id);
    const decimals = getTokenDecimals(tokenSymbol, base.id);
    
    if (!tokenAddress || !address) {
      throw new Error("Token address or user address not found");
    }

    setSwapState(prev => ({ ...prev, isApproving: true, error: undefined }));

    try {
      const walletClient = await getWalletClient();
      const amountBigInt = parseUnits(amount, decimals);

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [AERODROME_V3_SWAP_ROUTER as `0x${string}`, amountBigInt],
        account: address as `0x${string}`,
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
      
      setSwapState(prev => ({ ...prev, isApproving: false, approvalHash: hash }));
      return hash;
    } catch (error) {
      console.error("Error approving token:", error);
      setSwapState(prev => ({ 
        ...prev, 
        isApproving: false, 
        error: error instanceof Error ? error.message : "Approval failed" 
      }));
      throw error;
    }
  };

  // Execute swap
  const executeSwap = async ({ 
    tokenASymbol, 
    tokenBSymbol, 
    amountIn, 
    slippage = 2.5,
    deadline = 20 
  }: SwapParams): Promise<string> => {
    const tokenAAddress = getTokenAddress(tokenASymbol, base.id);
    const tokenBAddress = getTokenAddress(tokenBSymbol, base.id);
    const tokenADecimals = getTokenDecimals(tokenASymbol, base.id);

    if (!tokenAAddress || !tokenBAddress || !address) {
      throw new Error("Token addresses or user address not found");
    }

    setSwapState(prev => ({ ...prev, isSwapping: true, error: undefined }));

    try {
      const walletClient = await getWalletClient();
      const amountInBigInt = parseUnits(amountIn, tokenADecimals);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
      
      // V3 doesn't use routes - it uses direct token pairs with tick spacing
      // FOUND: Correct tick spacing is 10 for USDC/cNGN pool
      const tickSpacing = 10; // ✅ Confirmed working tick spacing
      
      // Get live exchange rate instead of hardcoding
      console.log("🔍 Fetching live V3 exchange rate...");
      console.log(`💱 Converting: ${tokenASymbol} → ${tokenBSymbol}`);
      
      let effectiveRate = 1505.36; // Fallback USDC to cNGN rate
      let rateSource = "Emergency Fallback";
      
      try {
        const liveRate = await getLiveExchangeRate();
        
        // Validate rate before using
        if (liveRate && liveRate.usdcTocNGN && !isNaN(liveRate.usdcTocNGN) && liveRate.usdcTocNGN > 0) {
          effectiveRate = liveRate.usdcTocNGN;
          rateSource = liveRate.source || "Live Rate";
          console.log(`✅ Using live rate: 1 USDC = ${effectiveRate} cNGN from ${rateSource}`);
        } else {
          console.log(`⚠️ Invalid live rate (${liveRate?.usdcTocNGN}), using fallback: ${effectiveRate}`);
        }
      } catch (rateError) {
        console.error("❌ Rate fetching failed:", rateError);
        console.log(`⚠️ Using fallback rate: ${effectiveRate}`);
      }
      
      if (!amountIn || amountIn === "0" || isNaN(parseFloat(amountIn))) {
        throw new Error(`Invalid amount input: ${amountIn}`);
      }
      
      // Calculate output based on conversion direction
      let estimatedOutputAmount: number;
      
      if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
        // USDC → CNGN: multiply by rate
        estimatedOutputAmount = parseFloat(amountIn) * effectiveRate;
        console.log(`📊 USDC → CNGN: ${amountIn} * ${effectiveRate} = ${estimatedOutputAmount}`);
      } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
        // CNGN → USDC: divide by rate
        estimatedOutputAmount = parseFloat(amountIn) / effectiveRate;
        console.log(`📊 CNGN → USDC: ${amountIn} / ${effectiveRate} = ${estimatedOutputAmount}`);
      } else {
        throw new Error(`Unsupported conversion pair: ${tokenASymbol} → ${tokenBSymbol}`);
      }
      
      if (isNaN(estimatedOutputAmount)) {
        throw new Error(`Calculated output amount is NaN: ${parseFloat(amountIn)} * ${effectiveRate} = ${estimatedOutputAmount}`);
      }
      
      // Safely convert to BigInt with validation
      const outputAmountString = estimatedOutputAmount.toString();
      const tokenBDecimals = getTokenDecimals(tokenBSymbol, base.id);
      
      try {
        const estimatedOutputBigInt = parseUnits(outputAmountString, tokenBDecimals);
        
        // Display rate information based on conversion direction
        if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
          console.log(`📈 Live rate: 1 USDC = ${effectiveRate.toFixed(4)} cNGN (${rateSource})`);
        } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
          const reverseRate = 1 / effectiveRate;
          console.log(`📈 Live rate: 1 cNGN = ${reverseRate.toFixed(8)} USDC (${rateSource})`);
          console.log(`📈 (Equivalent: 1 USDC = ${effectiveRate.toFixed(4)} cNGN)`);
        }
        
        // Calculate minimum amount out with slippage protection
        const slippageMultiplier = BigInt(Math.floor((100 - slippage) * 100));
        const amountOutMin = estimatedOutputBigInt * slippageMultiplier / BigInt(10000);

        console.log("💱 Estimated V3 output:", estimatedOutputBigInt.toString());
        console.log("💱 Minimum output (with slippage):", amountOutMin.toString());

              // V3 ExactInputSingle parameters
        const exactInputSingleParams = {
          tokenIn: tokenAAddress as `0x${string}`,
          tokenOut: tokenBAddress as `0x${string}`,
          tickSpacing,
          recipient: address as `0x${string}`,
          deadline: BigInt(deadlineTimestamp),
          amountIn: amountInBigInt,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: BigInt(0) // No price limit
        };

        console.log("🔄 Executing V3 swap with exactInputSingle:", {
          tokenIn: exactInputSingleParams.tokenIn,
          tokenOut: exactInputSingleParams.tokenOut,
          tickSpacing: exactInputSingleParams.tickSpacing,
          amountIn: exactInputSingleParams.amountIn.toString(),
          amountOutMinimum: exactInputSingleParams.amountOutMinimum.toString(),
          deadline: exactInputSingleParams.deadline.toString()
        });

        const hash = await walletClient.writeContract({
          address: AERODROME_V3_SWAP_ROUTER as `0x${string}`,
          abi: AERODROME_V3_ROUTER_ABI,
          functionName: "exactInputSingle",
          args: [exactInputSingleParams],
          account: address as `0x${string}`,
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash });
        
        setSwapState(prev => ({ 
          ...prev, 
          isSwapping: false, 
          swapHash: hash,
          successHandled: false 
        }));
        return hash;
        
      } catch (parseUnitsError) {
        console.error("❌ Error in parseUnits or swap execution:", parseUnitsError);
        throw new Error(`Failed to process swap amounts: ${parseUnitsError.message}`);
      }

    } catch (error) {
      console.error("Error executing swap:", error);
      setSwapState(prev => ({ 
        ...prev, 
        isSwapping: false, 
        error: error instanceof Error ? error.message : "Swap failed" 
      }));
      throw error;
    }
  };

  // Main swap function that handles approval and swap
  const swap = async (params: SwapParams) => {
    if (!address || !isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      setSwapState(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Check if we need approval first
      const needsApproval = !(await checkAllowance(params.tokenASymbol, params.amountIn));
      
      if (needsApproval) {
        console.log("🔐 Token approval needed, requesting approval...");
        await approveToken(params.tokenASymbol, params.amountIn);
        console.log("✅ Token approved successfully");
      }

      // Execute the swap
      console.log("🔄 Starting swap...");
      const swapHash = await executeSwap(params);
      console.log("✅ Swap completed successfully!", { hash: swapHash });

    } catch (error) {
      console.error("❌ Swap failed:", error);
      throw error;
    } finally {
      setSwapState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Get estimated output amount from Aerodrome router
  const getQuote = useCallback(async (tokenASymbol: string, tokenBSymbol: string, amountIn: string) => {
    const tokenAAddress = getTokenAddress(tokenASymbol, base.id);
    const tokenBAddress = getTokenAddress(tokenBSymbol, base.id);
    const tokenADecimals = getTokenDecimals(tokenASymbol, base.id);
    const tokenBDecimals = getTokenDecimals(tokenBSymbol, base.id);

    if (!tokenAAddress || !tokenBAddress || !amountIn || amountIn === "0") {
      return null;
    }

    try {
      const amountInBigInt = parseUnits(amountIn, tokenADecimals);
      
      console.log("🔍 Getting quote for:", amountIn, tokenASymbol, "->", tokenBSymbol);
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
        const quote = await getV3Quote(amountIn, tokenASymbol, tokenBSymbol);
        
        console.log("✅ Live V3 quote:", amountIn, tokenASymbol, "=>", quote.amountOut, tokenBSymbol);
        console.log("📈 Live exchange rate:", 1, tokenASymbol, "=", quote.rate, tokenBSymbol);
        console.log("🔧 Source:", quote.source);
        
        return {
          amountOut: quote.amountOut, // Already formatted with proper decimals
          rate: quote.rate, // Already formatted with proper decimals
          source: quote.source,
          timestamp: quote.timestamp,
          isV3: true,
          isLive: quote.success
        };
        
      } catch (routerError) {
        console.error("❌ Live V3 quote failed:", routerError);
        
        // Fallback - handle both directions
        const fallbackRate = 1505.36; // USDC to cNGN rate
        let amountOut: number;
        let displayRate: string;
        
        if (tokenASymbol === "USDC" && tokenBSymbol === "CNGN") {
          // USDC → CNGN: multiply by rate
          amountOut = parseFloat(amountIn) * fallbackRate;
          displayRate = fallbackRate.toFixed(4);
          console.log(`📍 Using emergency fallback: ${amountIn} USDC * ${fallbackRate} = ${amountOut} CNGN`);
        } else if (tokenASymbol === "CNGN" && tokenBSymbol === "USDC") {
          // CNGN → USDC: divide by rate
          amountOut = parseFloat(amountIn) / fallbackRate;
          displayRate = (1 / fallbackRate).toFixed(8);
          console.log(`📍 Using emergency fallback: ${amountIn} CNGN / ${fallbackRate} = ${amountOut} USDC`);
        } else {
          // Unsupported pair
          amountOut = 0;
          displayRate = "0";
          console.log(`❌ Unsupported conversion pair: ${tokenASymbol} → ${tokenBSymbol}`);
        }
        
        return {
          amountOut: amountOut.toFixed(tokenBSymbol === "USDC" ? 8 : 4),
          rate: displayRate,
          source: "Emergency Fallback",
          isV3: true,
          isFallback: true
        };
      }
    } catch (error) {
      console.error("Error getting quote:", error);
      return null;
    }
  }, []);

  // Check if approval is successful and ready to swap
  const isApprovalSuccess = swapState.approvalHash && !swapState.isApproving;
  
  // Check if swap is successful 
  const isSwapSuccess = swapState.swapHash && !swapState.isSwapping && !swapState.successHandled;

  // Function to mark success as handled to prevent infinite loops
  const markSuccessHandled = useCallback(() => {
    setSwapState(prev => ({ ...prev, successHandled: true }));
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
    markSuccessHandled
  };
}