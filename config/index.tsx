import { cookieStorage, createStorage, type Storage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId =
  process.env.REOWN_PROJECT_ID || "72d9f10ab6e67c3e8ed81cb9fc7d6c29";

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
});

export const config = {
  ...wagmiAdapter.wagmiConfig,
  autoConnect: true,
};
