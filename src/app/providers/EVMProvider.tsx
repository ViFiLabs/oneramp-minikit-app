"use client";

import { wagmiAdapter, projectId } from "@/src/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { mainnet, celo, base, polygon } from "@reown/appkit/networks";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Set up metadata
const metadata = {
  name: "OneRamp",
  description: "Spend Crypto in Africa - Anytime, Anywhere",
  url: "https://oneramp.io", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Base-compatible featured wallets
const WalletIds = [
  "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a", // Uniswap Wallet
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
  "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393", // phantom Wallet
];

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base, celo, mainnet, polygon],
  defaultNetwork: base,
  metadata: metadata,
  features: {
    analytics: true,
    email: false,
    socials: ["google", "farcaster"],
    emailShowWallets: true,
    swaps: false,
    onramp: false,
  },
  featuredWalletIds: WalletIds,
  includeWalletIds: WalletIds, // Only show these wallets
  themeMode: "dark",
  // themeVariables: {
  //   "--w3m-color-mix": "#00d4aa",
  //   "--w3m-accent": "#2563eb",
  //   "--w3m-color-mix-strength": 20,
  // },
});

function EVMProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      // config={wagmiAdapter.wagmiConfig as Config}
      config={
        wagmiAdapter.wagmiConfig as unknown as Parameters<
          typeof WagmiProvider
        >[0]["config"]
      }
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default EVMProvider;
