import { assets } from "@/data/currencies";
import { AppState, OrderStep, UserSelectionGlobalState } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserSelectionStore extends UserSelectionGlobalState {
  updateSelection: (updates: Partial<UserSelectionGlobalState>) => void;
  resetSelection: () => void;
  reset: () => void;
  resetToDefault: () => void;
  setAppState: (state: AppState) => void;
}

const initialState: UserSelectionGlobalState = {
  country: undefined,
  network: undefined,
  asset: undefined,
  cryptoAmount: undefined,
  fiatAmount: undefined,
  address: undefined,
  paymentMethod: "momo",
  institution: undefined,
  accountNumber: undefined,
  orderStep: OrderStep.Initial,
  appState: AppState.Idle,
  pastedAddress: undefined,
};

const defaultState = {
  ...initialState,
  asset: assets[0],
};

export const useUserSelectionStore = create<UserSelectionStore>()(
  persist(
    (set) => ({
      ...defaultState,
      updateSelection: (updates) =>
        set((state) => ({
          ...state,
          ...updates,
        })),
      resetSelection: () => set(initialState),
      reset: () => set(initialState),
      resetToDefault: () => set(defaultState),
      setOrderStep: (step: OrderStep) =>
        set((state) => ({ ...state, orderStep: step })),
      setAppState: (newState: AppState) =>
        set((state) => ({ ...state, appState: newState })),
    }),
    {
      name: "user-selection",
    }
  )
);
