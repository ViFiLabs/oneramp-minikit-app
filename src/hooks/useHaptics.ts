export type HapticStrength = "light" | "medium" | "heavy";

/**
 * Cross-browser safe haptic feedback hook using navigator.vibrate when available.
 * Falls back to no-op on unsupported platforms (e.g., desktop Safari/iOS without PWA context).
 */
export function useHaptics() {
  const vibrate = (pattern: number | number[] = 10) => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        (
          navigator as unknown as { vibrate?: (p: number | number[]) => void }
        ).vibrate?.(pattern);
      }
    } catch {
      // Silently ignore if not supported
    }
  };

  const light = () => vibrate(8);
  const success = () => vibrate(15);
  const impact = (strength: HapticStrength = "light") => {
    switch (strength) {
      case "medium":
        vibrate([10, 30, 10]);
        break;
      case "heavy":
        vibrate([20, 50, 20]);
        break;
      default:
        light();
    }
  };

  return { vibrate, light, success, impact };
}
