import { KYCVerificationResponse } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KYCStore {
  kycData: KYCVerificationResponse | null;
  setKycData: (kycData: KYCVerificationResponse) => void;
  kycLink: string | null;
  showKYCModal: boolean;
  setShowKYCModal: (showKYCModal: boolean) => void;
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

const initialState = {
  kycData: null,
  kycLink:
    "https://signup.metamap.com/?merchantToken=671a3cf5673134001da20657&flowId=671a3cf5673134001da20656",
  showKYCModal: false,
  isCheckingKyc: false,
  isPolling: false,
  isInDelayedPhase: false,
};

export const useKYCStore = create<KYCStore>()(
  persist(
    (set) => ({
      ...initialState,
      setKycData: (kycData: KYCVerificationResponse) => set({ kycData }),
      showKYCModal: false,
      setShowKYCModal: (showKYCModal: boolean) => set({ showKYCModal }),
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
