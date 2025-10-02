import { Asset, ChainTypes } from "@/types";
import { base, celo, mainnet, polygon } from "@reown/appkit/networks";

export const currencies = [
  { symbol: "USDC", logo: "/logos/USDC.svg" },
  { symbol: "USDT", logo: "/logos/USDT.svg" },
  { symbol: "CNGN", logo: "/logos/CNGN.svg" },
];

export const assets: Asset[] = [
  {
    name: "USDC",
    logo: "/logos/USDC.svg",
    symbol: "USDC",
    network: "Ethereum",
    networks: {
      Ethereum: {
        ...mainnet,
        logo: "/logos/ethereum.png",
        type: ChainTypes.EVM,
        chainId: 1,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:1",
        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      Polygon: {
        ...polygon,
        logo: "/logos/polygon.png",
        type: ChainTypes.EVM,
        chainId: 137,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:137",
        tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      },
      Celo: {
        ...celo,
        logo: "/logos/celo-logo.png",
        type: ChainTypes.EVM,
        chainId: 42220,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:42220",
        tokenAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      },
      Base: {
        ...base,
        logo: "/logos/base.png",
        type: ChainTypes.EVM,
        chainId: 8453,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:8453",
        tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      },
    },
  },

  {
    name: "USDT",
    logo: "/logos/USDT.svg",
    symbol: "USDT",
    network: "Ethereum",
    networks: {
      Ethereum: {
        ...mainnet,
        logo: "/logos/ethereum.png",
        type: ChainTypes.EVM,
        chainId: 1,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:1",
        tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
      Polygon: {
        ...polygon,
        logo: "/logos/polygon.png",
        type: ChainTypes.EVM,
        chainId: 137,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:137",
        tokenAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      },
      Celo: {
        ...celo,
        logo: "/logos/celo-logo.png",
        type: ChainTypes.EVM,
        chainId: 42220,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:42220",
        tokenAddress: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
      },
      Base: {
        ...base,
        logo: "/logos/base.png",
        type: ChainTypes.EVM,
        chainId: 8453,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:8453",
        tokenAddress: "", // USDT not supported on Base
      },
    },
  },

  {
    name: "cNGN",
    logo: "/logos/cngn.png",
    symbol: "cNGN",
    network: "Ethereum",
    networks: {
      Ethereum: {
        ...mainnet,
        logo: "/logos/ethereum.png",
        type: ChainTypes.EVM,
        chainId: 1,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:1",
        tokenAddress: "0x17CDB2a01e7a34CbB3DD4b83260B05d0274C8dab", // placeholder if not available
      },
      Polygon: {
        ...polygon,
        logo: "/logos/polygon.png",
        type: ChainTypes.EVM,
        chainId: 137,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:137",
        tokenAddress: "0x52828daa48C1a9A06F37500882b42daf0bE04C3B", // placeholder
      },
      Base: {
        ...base,
        logo: "/logos/base.png",
        type: ChainTypes.EVM,
        chainId: 8453,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:8453",
        tokenAddress: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F", // placeholder
      },
    },
  },

  // CNGN

  {
    name: "CNGN",
    logo: "/logos/CNGN.svg",
    symbol: "CNGN",
    network: "Base", // Primary network for CNGN
    networks: {
      Ethereum: {
        ...mainnet,
        logo: "/logos/ethereum.png",
        type: ChainTypes.EVM,
        chainId: 1,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:1",
        tokenAddress: "", // CNGN not available on Ethereum yet
      },
      Polygon: {
        ...polygon,
        logo: "/logos/polygon.png",
        type: ChainTypes.EVM,
        chainId: 137,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:137",
        tokenAddress: "", // CNGN not available on Polygon yet
      },
      Celo: {
        ...celo,
        logo: "/logos/celo-logo.png",
        type: ChainTypes.EVM,
        chainId: 42220,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:42220",
        tokenAddress: "", // CNGN not available on Celo yet
      },
      Base: {
        ...base,
        logo: "/logos/base.png",
        type: ChainTypes.EVM,
        chainId: 8453,
        chainNamespace: "eip155",
        caipNetworkId: "eip155:8453",
        tokenAddress: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F", // cNGN token address on Base
      },
    },
  },
];
