import { KYCVerificationResponse } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KYCStore {
  kycData: KYCVerificationResponse | null;
  setKycData: (kycData: KYCVerificationResponse) => void;
  clearKycData: () => void;
  isCheckingKyc: boolean;
  setIsCheckingKyc: (isCheckingKyc: boolean) => void;
  isPolling: boolean;
  setIsPolling: (isPolling: boolean) => void;
  isInDelayedPhase: boolean;
  setIsInDelayedPhase: (isInDelayedPhase: boolean) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useKYCStore = create<KYCStore>()(
  persist(
    (set) => ({
      kycData: null,
      setKycData: (kycData: KYCVerificationResponse) => set({ kycData }),
      clearKycData: () => set({ kycData: null }),
      isCheckingKyc: false,
      setIsCheckingKyc: (isCheckingKyc: boolean) => set({ isCheckingKyc }),
      isPolling: false,
      setIsPolling: (isPolling: boolean) => set({ isPolling }),
      isInDelayedPhase: false,
      setIsInDelayedPhase: (isInDelayedPhase: boolean) =>
        set({ isInDelayedPhase }),
      startPolling: () => set({ isPolling: true }),
      stopPolling: () => set({ isPolling: false }),
    }),
    { name: "kyc-store" }
  )
);
