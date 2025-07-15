import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AmountStore {
  amount: string;
  fiatAmount: string;
  isValid: boolean;
  setAmount: (amount: string) => void;
  setFiatAmount: (fiatAmount: string) => void;
  setIsValid: (isValid: boolean) => void;
  message: string;
  cryptoAmount: string;
  setCryptoAmount: (cryptoAmount: string) => void;
  setMessage: (message: string) => void;
  resetAmount: () => void;
}

const initialState = {
  amount: "1",
  fiatAmount: "1",
  isValid: true,
  message: "",
  cryptoAmount: "0",
};

export const useAmountStore = create<AmountStore>()(
  persist(
    (set) => ({
      ...initialState,
      setAmount: (amount: string) => set({ amount }),
      setFiatAmount: (fiatAmount: string) => set({ fiatAmount }),
      setIsValid: (isValid: boolean) => set({ isValid }),
      setMessage: (message: string) => set({ message }),
      setCryptoAmount: (cryptoAmount: string) => set({ cryptoAmount }),
      resetAmount: () => set(initialState),
    }),
    { name: "amount-store" }
  )
);
