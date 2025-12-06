import { Quote } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuoteStore {
  quote: Quote | null;
  setQuote: (quote: Quote) => void;
  resetQuote: () => void;
}

const initialState = {
  quote: null,
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set) => ({
      ...initialState,
      setQuote: (quote: Quote) => set({ quote }),
      resetQuote: () => set(initialState),
    }),
    { name: "quote" }
  )
);
