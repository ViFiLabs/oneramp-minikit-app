import SelectCNGNAction from "@/app/components/cNGN/SelectCNGNAction";
import type { ComponentType } from "react";

type AssetSymbol = "cNGN" | "USDC";

type AssetUIMap = Record<AssetSymbol, { component: ComponentType | null }>;

export const supportedAssetsUI: AssetUIMap = {
  cNGN: { component: SelectCNGNAction },
  USDC: { component: null }, // Placeholder for future USDC-specific UI
};
