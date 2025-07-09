import { Transfer } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TransferStore {
  transfer: Transfer | null;
  transactionHash: string | null;
  setTransactionHash: (transactionHash: string) => void;
  setTransfer: (transfer: Transfer) => void;
  resetTransfer: () => void;
}

const initialState = {
  transfer: null,
  transactionHash: null,
};

export const useTransferStore = create<TransferStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTransfer: (transfer: Transfer) => set({ transfer }),
      setTransactionHash: (transactionHash: string) => set({ transactionHash }),
      resetTransfer: () => set(initialState),
    }),
    { name: "transfer" }
  )
);
