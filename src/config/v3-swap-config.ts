/**
 * Central config for V3 swap (Aerodrome SlipStream) and MixedQuoter.
 * Single source of truth for router address, quoter address, tick spacing, and ABIs.
 */

/** V3 SwapRouter (Aerodrome SlipStream) – can be overridden via env */
export const V3_SWAP_ROUTER =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_V3_SWAP_ROUTER?.startsWith("0x") &&
    process.env.NEXT_PUBLIC_V3_SWAP_ROUTER) ||
  "0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5";

/** Aerodrome MixedQuoter for V3 quotes – can be overridden via env */
export const V3_MIXED_QUOTER =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_V3_MIXED_QUOTER?.startsWith("0x") &&
    process.env.NEXT_PUBLIC_V3_MIXED_QUOTER) ||
  "0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6";

/** Tick spacing for 0.05% fee tier (e.g. USDC/cNGN pool) – can be overridden via env */
export const V3_TICK_SPACING = (() => {
  const env = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_V3_TICK_SPACING;
  if (env != null) {
    const n = parseInt(env, 10);
    if (!isNaN(n)) return n;
  }
  return 10;
})();

/** Fee tier in basis points (500 = 0.05%) */
export const V3_FEE_BPS = 500;

/** V3 SwapRouter ABI (exactInputSingle + factory) */
export const V3_SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "int24", name: "tickSpacing", type: "int24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          {
            internalType: "uint256",
            name: "amountOutMinimum",
            type: "uint256",
          },
          {
            internalType: "uint160",
            name: "sqrtPriceLimitX96",
            type: "uint160",
          },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/** MixedQuoter ABI (quoteExactInputSingleV3) */
export const V3_MIXED_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "int24", name: "tickSpacing", type: "int24" },
          {
            internalType: "uint160",
            name: "sqrtPriceLimitX96",
            type: "uint160",
          },
        ],
        internalType: "struct IMixedRouteQuoterV1.QuoteExactInputSingleV3Params",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingleV3",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      {
        internalType: "uint32",
        name: "initializedTicksCrossed",
        type: "uint32",
      },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
