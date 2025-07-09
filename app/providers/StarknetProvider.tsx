"use client";
import React, { useMemo } from "react";
import {
  mainnet as starknetMainnet,
  sepolia as starknetTestnet,
} from "@starknet-react/chains";
import { StarknetConfig, publicProvider, voyager } from "@starknet-react/core";

import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import { Connector } from "@starknet-react/core";
import { ArgentMobileConnector } from "starknetkit/argentMobile";

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY

export default function StarknetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const connectors = useMemo(() => {
    if (typeof window === "undefined") return []; // SSR-safe

    return [
      new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
      new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
      ArgentMobileConnector.init({
        options: {
          dappName: "OneRamp",
          projectId: "72d9f10ab6e67c3e8ed81cb9fc7d6c29",
          // chainId: "mainnet" as "mainnet" | "testnet", // mainnet
          url: window.location.hostname, // ✅ safe now
          icons: ["https://your-icon-url.com"],
          rpcUrl:
            `https://starknet-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        },
        inAppBrowserOptions: {},
      }) as Connector,
      new InjectedConnector({ options: { id: "keplr", name: "Keplr" } }),
      new InjectedConnector({ options: { id: "okxwallet", name: "OKX" } }),
      new WebWalletConnector({ url: "https://web.argent.xyz" }),
    ];
  }, []);

  return (
    <StarknetConfig
      chains={[starknetMainnet, starknetTestnet]}
      provider={publicProvider()}
      connectors={connectors as Connector[]}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
