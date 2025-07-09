import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Network } from "@/types";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";

interface NetworkState {
  currentNetwork: Network | null;
  supportedNetworks: Network[];
  connectedNetworks: Network[];
  setCurrentNetwork: (network: Network | null) => void;
  updateNetworks: (networks: Network[]) => void;
  addConnectedNetwork: (network: Network) => void;
  removeConnectedNetwork: (network: Network) => void;
  clearConnectedNetworks: () => void;
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      currentNetwork: SUPPORTED_NETWORKS_WITH_RPC_URLS[0],
      supportedNetworks: SUPPORTED_NETWORKS_WITH_RPC_URLS,
      connectedNetworks: [],
      setCurrentNetwork: (network) => {
        set({ currentNetwork: network });
      },
      updateNetworks: (networks) => set({ supportedNetworks: networks }),
      addConnectedNetwork: (network) =>
        set((state) => ({
          connectedNetworks: [...state.connectedNetworks, network],
        })),
      removeConnectedNetwork: (network) =>
        set((state) => ({
          connectedNetworks: state.connectedNetworks.filter(
            (n) => n.id !== network.id
          ),
        })),
      clearConnectedNetworks: () => set({ connectedNetworks: [] }),
    }),
    {
      name: "network-storage",
    }
  )
);
