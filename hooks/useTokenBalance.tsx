"use client";

import { getTokenAddress, getTokenDecimals } from "@/data/token-config";
import { useNetworkStore } from "@/store/network";
import { ChainTypes } from "@/types";
import { useAccount } from "@starknet-react/core";
import { useEffect, useState } from "react";
import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { base, celo, mainnet, polygon } from "viem/chains";
import useWalletGetInfo from "./useWalletGetInfo";

export interface TokenBalanceResult {
  balance: string;
  formatted: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Multi-network balances
  allNetworkBalances?: Record<number, {
    balance: string;
    formatted: string;
    decimals: number;
    isLoading: boolean;
    error: string | null;
  }>;
}

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY

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

export function useTokenBalance(tokenSymbol: string, specificChainId?: number): TokenBalanceResult {
  const { address, isConnected } = useWalletGetInfo();
  const { currentNetwork } = useNetworkStore();
  const { address: starknetAddress } = useAccount();
  
  const [starknetBalance, setStarknetBalance] = useState<string>("0");
  const [starknetLoading, setStarknetLoading] = useState(false);
  const [starknetError, setStarknetError] = useState<string | null>(null);
  
  // Multi-network EVM balances
  const [evmBalances, setEvmBalances] = useState<Record<number, {
    balance: string;
    formatted: string;
    decimals: number;
    isLoading: boolean;
    error: string | null;
  }>>({});

  const currentChainId = specificChainId || currentNetwork?.chainId;
  const isStarknet = currentNetwork?.type === ChainTypes.Starknet;

  // Create public clients for all EVM networks
  const createNetworkClient = (chainId: number) => {
    return createPublicClient({
      chain: CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS],
      transport: http(RPC_URLS[chainId as keyof typeof RPC_URLS]),
    });
  };

  // Fetch balance for a specific EVM network
  const fetchEVMBalance = async (chainId: number) => {
    if (!address || !isConnected) return null;

    const tokenAddress = getTokenAddress(tokenSymbol, chainId);
    if (!tokenAddress) return null;

    const decimals = getTokenDecimals(tokenSymbol, chainId);
    
    try {
      setEvmBalances(prev => ({
        ...prev,
        [chainId]: { ...prev[chainId], isLoading: true, error: null }
      }));

      const client = createNetworkClient(chainId);
      
      const balance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const balanceString = balance.toString();
      const formatted = parseFloat(formatUnits(balance, decimals)).toFixed(2);

      setEvmBalances(prev => ({
        ...prev,
        [chainId]: {
          balance: balanceString,
          formatted,
          decimals,
          isLoading: false,
          error: null,
        }
      }));

      return { balance: balanceString, formatted, decimals };
    } catch (error) {
      console.error(`Error fetching balance for chain ${chainId}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch balance";
      
      setEvmBalances(prev => ({
        ...prev,
        [chainId]: {
          balance: "0",
          formatted: "0.00",
          decimals,
          isLoading: false,
          error: errorMessage,
        }
      }));
      
      return null;
    }
  };

  // Fetch balances for all EVM networks
  const fetchAllEVMBalances = async () => {
    if (!address || !isConnected || isStarknet) return;

    const supportedChains = Object.keys(RPC_URLS).map(Number);
    
    // Fetch balances in parallel for all supported chains
    await Promise.all(
      supportedChains.map(chainId => fetchEVMBalance(chainId))
    );
  };

  // Starknet balance fetching
  useEffect(() => {
    if (
      !starknetAddress || 
      !isConnected || 
      currentNetwork?.type !== ChainTypes.Starknet
    ) {
      return;
    }

    const fetchStarknetBalance = async () => {
      setStarknetLoading(true);
      setStarknetError(null);
      
      try {
        const { RpcProvider } = await import("starknet");
        
        const provider = new RpcProvider({
          nodeUrl: `https://starknet-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        });

        const tokenAddress = getTokenAddress(tokenSymbol, currentNetwork.chainId);
        if (!tokenAddress) {
          throw new Error("Token not supported on Starknet");
        }

        const result = await provider.callContract({
          contractAddress: tokenAddress,
          entrypoint: "balanceOf",
          calldata: [starknetAddress],
        });

        const balance = BigInt(result[0]).toString();
        setStarknetBalance(balance);
      } catch (error) {
        console.error("Error fetching Starknet balance:", error);
        setStarknetError(error instanceof Error ? error.message : "Failed to fetch balance");
        setStarknetBalance("0");
      } finally {
        setStarknetLoading(false);
      }
    };

    fetchStarknetBalance();
  }, [starknetAddress, tokenSymbol, isConnected, currentNetwork]);

  // Fetch EVM balances when relevant dependencies change
  useEffect(() => {
    if (address && isConnected && !isStarknet) {
      fetchAllEVMBalances();
    }
  }, [address, isConnected, tokenSymbol, isStarknet]);

  const refetchAll = () => {
    if (isStarknet) {
      // Trigger Starknet refetch
      setStarknetBalance("0");
    } else {
      // Trigger EVM refetch
      fetchAllEVMBalances();
    }
  };

  // Return appropriate data based on network type
  if (isStarknet) {
    const decimals = currentChainId ? getTokenDecimals(tokenSymbol, currentChainId) : 18;
    const formatted = formatUnits(BigInt(starknetBalance), decimals);
    
    return {
      balance: starknetBalance,
      formatted: parseFloat(formatted).toFixed(2),
      decimals,
      isLoading: starknetLoading,
      error: starknetError,
      refetch: refetchAll,
      allNetworkBalances: evmBalances,
    };
  }

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
    isLoading: currentBalance.isLoading,
    error: currentBalance.error,
    refetch: refetchAll,
    allNetworkBalances: evmBalances,
  };
} 