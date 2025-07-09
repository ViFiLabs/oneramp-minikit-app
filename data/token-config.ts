import { ChainTypes } from "@/types";

export interface TokenConfig {
  symbol: string;
  decimals: number;
  addresses: {
    [chainId: number]: string;
  };
}

// Token configurations with addresses and decimals
export const TOKEN_CONFIGS: Record<string, TokenConfig> = {
  USDC: {
    symbol: "USDC",
    decimals: 6,
    addresses: {
      // Base
      8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      // Ethereum
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      // Polygon
      137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      // Celo
      42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      // Starknet (converted from hex)
      [0x534e5f4d41494e]: "0x053C91253BC9682c04929cA02ED00b3E423f6710D2ee7e0D5EBB06F3eCF368A8",
    },
  },
  USDT: {
    symbol: "USDT",
    decimals: 6, // USDT on most networks uses 6 decimals except Ethereum mainnet
    addresses: {
      // Ethereum (18 decimals)
      1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      // Polygon (6 decimals)
      137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      // Celo (6 decimals)
      42220: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
      // Starknet (converted from hex)
      [0x534e5f4d41494e]: "0x068F5c6a61780768455de69077E07e89787839bf8166dEcfBf92B645209c0fB8",
    },
  },
};

// Special case for USDT decimals on Ethereum mainnet
export const getTokenDecimals = (symbol: string, chainId: number): number => {
  if (symbol === "USDT" && chainId === 1) {
    return 6; // USDT on Ethereum is 6 decimals
  }
  return TOKEN_CONFIGS[symbol]?.decimals || 18;
};

// Get token address for a specific network
export const getTokenAddress = (symbol: string, chainId: number): string | undefined => {
  return TOKEN_CONFIGS[symbol]?.addresses[chainId];
};

// Check if a token is supported on a network
export const isTokenSupported = (symbol: string, chainId: number): boolean => {
  return !!getTokenAddress(symbol, chainId);
};

// Get supported tokens for a network
export const getSupportedTokens = (chainId: number): string[] => {
  return Object.keys(TOKEN_CONFIGS).filter(token => 
    isTokenSupported(token, chainId)
  );
};

// Network-specific token support
export const NETWORK_TOKEN_SUPPORT = {
  // Base - only USDC
  8453: ["USDC"],
  // Ethereum - USDC and USDT
  1: ["USDC", "USDT"],
  // Polygon - USDC and USDT
  137: ["USDC", "USDT"],
  // Celo - USDC and USDT
  42220: ["USDC", "USDT"],
  // Starknet - USDC and USDT
  [0x534e5f4d41494e]: ["USDC", "USDT"],
}; 