"use client";

import { getTokenAddress, getTokenDecimals } from "@/data/token-config";
import { useNetworkStore } from "@/store/network";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base, celo, mainnet, polygon } from "viem/chains";
import useWalletGetInfo from "./useWalletGetInfo";
import { useQuery } from "@tanstack/react-query";

export interface TokenBalanceResult {
  balance: string;
  formatted: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Multi-network balances
  allNetworkBalances?: Record<
    number,
    {
      balance: string;
      formatted: string;
      decimals: number;
      isLoading: boolean;
      error: string | null;
    }
  >;
}

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;

// RPC configuration for each network
const RPC_URLS = {
  1: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`, // Ethereum
  8453: `https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`, // Base
  137: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`, // Polygon
  42220: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`, // Celo
};

// Chain configurations
const CHAIN_CONFIGS = {
  1: mainnet,
  8453: base,
  137: polygon,
  42220: celo,
};

// Create public clients for all EVM networks
const createNetworkClient = (chainId: number) => {
  return createPublicClient({
    chain: CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS],
    transport: http(RPC_URLS[chainId as keyof typeof RPC_URLS]),
  });
};

// Fetch balance for a specific EVM network
const fetchEVMBalance = async (
  chainId: number,
  address: string,
  tokenSymbol: string
) => {
  const tokenAddress = getTokenAddress(tokenSymbol, chainId);
  if (!tokenAddress) {
    throw new Error(`Token ${tokenSymbol} not supported on chain ${chainId}`);
  }

  const decimals = getTokenDecimals(tokenSymbol, chainId);

  const client = createNetworkClient(chainId);

  const balance = await client.readContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  const balanceString = balance.toString();
  const formatted = parseFloat(formatUnits(balance, decimals)).toFixed(2);

  return {
    balance: balanceString,
    formatted,
    decimals,
    chainId,
  };
};

// Fetch balances for all EVM networks
const fetchAllEVMBalances = async (address: string, tokenSymbol: string) => {
  const supportedChains = Object.keys(RPC_URLS).map(Number);

  // Fetch balances in parallel for all supported chains
  const results = await Promise.allSettled(
    supportedChains.map((chainId) =>
      fetchEVMBalance(chainId, address, tokenSymbol)
    )
  );

  // Process results and handle errors
  const balances: Record<
    number,
    {
      balance: string;
      formatted: string;
      decimals: number;
      isLoading: boolean;
      error: string | null;
    }
  > = {};

  results.forEach((result, index) => {
    const chainId = supportedChains[index];

    if (result.status === "fulfilled") {
      balances[chainId] = {
        balance: result.value.balance,
        formatted: result.value.formatted,
        decimals: result.value.decimals,
        isLoading: false,
        error: null,
      };
    } else {
      balances[chainId] = {
        balance: "0",
        formatted: "0.00",
        decimals: getTokenDecimals(tokenSymbol, chainId),
        isLoading: false,
        error: result.reason?.message || "Failed to fetch balance",
      };
    }
  });

  return balances;
};

export function useTokenBalance(
  tokenSymbol: string,
  specificChainId?: number
): TokenBalanceResult {
  const { address, isConnected } = useWalletGetInfo();
  const { currentNetwork } = useNetworkStore();

  const currentChainId = specificChainId || currentNetwork?.chainId;

  // Use React Query for caching balance data
  const {
    data: evmBalances = {},
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tokenBalance", address, tokenSymbol, isConnected],
    queryFn: () => {
      if (!address || !isConnected || !tokenSymbol) {
        throw new Error("Missing required parameters");
      }
      return fetchAllEVMBalances(address, tokenSymbol);
    },
    enabled: !!address && !!isConnected && !!tokenSymbol,
    staleTime: 30 * 1000, // 30 seconds - balance data is fresh for 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute for fresh balances
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting to network
  });

  // For EVM networks, return current network balance or specific chain balance
  const targetChainId = currentChainId || Object.keys(evmBalances)[0];
  const currentBalance = evmBalances[targetChainId as number] || {
    balance: "0",
    formatted: "0.00",
    decimals: getTokenDecimals(tokenSymbol, targetChainId as number),
    isLoading: false,
    error: null,
  };

  return {
    balance: currentBalance.balance,
    formatted: currentBalance.formatted,
    decimals: currentBalance.decimals,
    isLoading: isLoading || currentBalance.isLoading,
    error: error?.message || currentBalance.error,
    refetch,
    allNetworkBalances: evmBalances,
  };
}
