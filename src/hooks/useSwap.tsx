"use client";

/**
 * Swap hook abstraction. UI (e.g. SwapPanel) imports this instead of a
 * DEX-specific hook so the panel stays DEX-agnostic and the implementation
 * can be swapped (e.g. Aerodrome today, another router later).
 */
export { useAerodromeSwap as useSwap } from "@/src/hooks/useAerodromeSwap";
