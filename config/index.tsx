import { cookieStorage, createStorage, type Storage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
// import { http } from "wagmi";
// import { coinbaseWallet, injected } from "wagmi/connectors";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.REOWN_PROJECT_ID || "72d9f10ab6e67c3e8ed81cb9fc7d6c29";
// process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694"; // this is a public projectId only to use on localhost

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [base] as [AppKitNetwork, ...AppKitNetwork[]];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  networks,
  storage: createStorage({
    storage: cookieStorage,
  }) as unknown as Storage,
  ssr: true,
  projectId,
  // multiInjectedProviderDiscovery: false,
  // connectors: [
  //   coinbaseWallet({
  //     preference: "smartWalletOnly",
  //   }),
  //   injected({}),
  // ],
  // chains: [base],
  // transports: {
  //   [base.id]: http(),
  // },
});

export const config = {
  ...wagmiAdapter.wagmiConfig,
  autoConnect: true,
};
