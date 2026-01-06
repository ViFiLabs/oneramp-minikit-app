import { useEffect, useState, useRef } from "react";

export type HapticStrength = "light" | "medium" | "heavy";

/**
 * Enhanced haptic feedback hook that uses Farcaster MiniApp SDK haptics when available,
 * with fallback to navigator.vibrate for other environments.
 *
 * Automatically detects if running in a Farcaster MiniApp environment and uses
 * the appropriate haptic API for the best user experience.
 */
export function useHaptics() {
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const sdkRef = useRef<any>(null);
  const detectionAttemptedRef = useRef(false);

  // Detect MiniApp environment once on mount
  useEffect(() => {
    if (detectionAttemptedRef.current) return;
    detectionAttemptedRef.current = true;

    const detectMiniApp = async () => {
      try {
        // Dynamic import to avoid errors in non-miniapp environments
        const mod = await import("@farcaster/miniapp-sdk");
        // Try default export first, then named export
        const sdk = mod.default || mod.sdk || mod;
        sdkRef.current = sdk;

        if (sdk?.isInMiniApp) {
          const inMini = await sdk.isInMiniApp();
          setIsMiniApp(inMini);
        } else {
          setIsMiniApp(false);
        }
      } catch (error) {
        // Not in miniapp environment or SDK not available
        setIsMiniApp(false);
      }
    };

    detectMiniApp();
  }, []);

  // Fallback vibrate function for non-miniapp environments
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

  // Light haptic feedback
  const light = () => {
    if (isMiniApp && sdkRef.current?.haptics?.impactOccurred) {
      sdkRef.current.haptics.impactOccurred("light").catch(() => {
        // Fallback to vibrate if SDK call fails
        vibrate(8);
      });
    } else {
      vibrate(8);
    }
  };

  // Success notification haptic feedback
  const success = () => {
    if (isMiniApp && sdkRef.current?.haptics?.notificationOccurred) {
      sdkRef.current.haptics.notificationOccurred("success").catch(() => {
        // Fallback to vibrate if SDK call fails
        vibrate(15);
      });
    } else {
      vibrate(15);
    }
  };

  // Impact haptic feedback with variable strength
  const impact = (strength: HapticStrength = "light") => {
    if (isMiniApp && sdkRef.current?.haptics?.impactOccurred) {
      // Map our strength types to SDK types
      const sdkStrength: "light" | "medium" | "heavy" | "soft" | "rigid" =
        strength === "heavy"
          ? "heavy"
          : strength === "medium"
          ? "medium"
          : "light";

      sdkRef.current.haptics.impactOccurred(sdkStrength).catch(() => {
        // Fallback to vibrate if SDK call fails
        switch (strength) {
          case "medium":
            vibrate([10, 30, 10]);
            break;
          case "heavy":
            vibrate([20, 50, 20]);
            break;
          default:
            vibrate(8);
        }
      });
    } else {
      // Fallback to vibrate patterns
      switch (strength) {
        case "medium":
          vibrate([10, 30, 10]);
          break;
        case "heavy":
          vibrate([20, 50, 20]);
          break;
        default:
          vibrate(8);
      }
    }
  };

  // Selection changed haptic (useful for UI element selections)
  const selectionChanged = () => {
    if (isMiniApp && sdkRef.current?.haptics?.selectionChanged) {
      sdkRef.current.haptics.selectionChanged().catch(() => {
        // Fallback to light vibrate if SDK call fails
        vibrate(8);
      });
    } else {
      vibrate(8);
    }
  };

  return { vibrate, light, success, impact, selectionChanged };
}
