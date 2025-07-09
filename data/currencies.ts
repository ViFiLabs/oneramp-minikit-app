import { Asset, ChainTypes } from "@/types";
import { base, celo, mainnet, polygon } from "@reown/appkit/networks";
import { mainnet as starknet } from "@starknet-react/chains";

export const currencies = [
  { symbol: "USDC", logo: "/logos/USDC.svg" },
  { symbol: "USDT", logo: "/logos/USDT.svg" },
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
      Starknet: {
        name: "Starknet",
        id: starknet.id.toString(),
        chainId: Number(starknet.id),
        chainNamespace: "eip155" as const,
        caipNetworkId: `eip155:${starknet.id}` as const,
        logo: "/logos/starknet.png",
        type: ChainTypes.Starknet,
        tokenAddress:
          "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
        explorers: {
          starkscan: ["https://starkscan.co"],
          voyager: ["https://voyager.online"],
        },
        nativeCurrency: {
          name: "Starknet",
          symbol: "STRK",
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: ["https://starknet-mainnet.public.blastapi.io"],
          },
        },
      },
      //   .... more networks
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
      Starknet: {
        name: "Starknet",
        id: starknet.id.toString(),
        chainId: Number(starknet.id),
        chainNamespace: "eip155" as const,
        caipNetworkId: `eip155:${starknet.id}` as const,
        logo: "/logos/starknet.png",
        type: ChainTypes.Starknet,
        tokenAddress:
          "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
        explorers: {
          starkscan: ["https://starkscan.co"],
          voyager: ["https://voyager.online"],
        },
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: {
          default: {
            http: ["https://starknet-mainnet.public.blastapi.io"],
          },
        },
      },
      //   .... more networks
    },
  } as any, // Temporary type assertion to bypass strict typing
];
