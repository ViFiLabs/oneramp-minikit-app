import { ChainTypes, Network } from "@/types";
import { mainnet, polygon, celo, base } from "@reown/appkit/networks";

export const SUPPORTED_NETWORKS = [mainnet, polygon, celo, base];
export const SUPPORTED_NETWORK_NAMES = SUPPORTED_NETWORKS.map(
  (network) => network.name
);

export const SUPPORTED_NETWORKS_WITH_RPC_URLS: Network[] = [
  {
    ...base,
    id: base.id,
    chainId: Number(base.id),
    chainNamespace: "eip155" as const,
    caipNetworkId: `eip155:${base.id}` as const,
    logo: "/logos/base.png",
    type: ChainTypes.EVM,
  },
];
