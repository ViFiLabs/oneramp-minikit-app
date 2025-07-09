export interface Network {
  id: string;
  name: string;
  network: string;
  chainId: number;
  chainNamespace: "eip155" | "solana" | "bip122" | "polkadot" | "cosmos";
  caipNetworkId:
    | `eip155:${string}`
    | `eip155:${number}`
    | `solana:${string}`
    | `solana:${number}`
    | `bip122:${string}`
    | `bip122:${number}`
    | `polkadot:${string}`
    | `polkadot:${number}`
    | `cosmos:${string}`
    | `cosmos:${number}`;
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet: boolean;
  logo: string;
  type: "evm" | "starknet";
}
