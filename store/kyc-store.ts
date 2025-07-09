import { KYCVerificationResponse } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KYCStore {
  kycData: KYCVerificationResponse | null;
  setKycData: (kycData: KYCVerificationResponse) => void;
  clearKycData: () => void;
  isCheckingKyc: boolean;
  setIsCheckingKyc: (isCheckingKyc: boolean) => void;
}

export const useKYCStore = create<KYCStore>()(
  persist(
    (set) => ({
      kycData: null,
      setKycData: (kycData: KYCVerificationResponse) => set({ kycData }),
      clearKycData: () => set({ kycData: null }),
      isCheckingKyc: false,
      setIsCheckingKyc: (isCheckingKyc: boolean) => set({ isCheckingKyc }),
    }),
    { name: "kyc-store" }
  )
);
