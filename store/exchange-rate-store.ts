import { create } from "zustand";

interface ExchangeRateResponse {
  country: string;
  exchange: number;
  conversionResponse: {
    chargeFeeInFiat: number;
    chargeFeeInUsd: number;
    cryptoAmount: number;
    exchangeRate: number;
    fiatAmount: number;
    gasFeeInFiat: number;
    providerPayoutAmount: number;
    success: boolean;
  };
}

interface ExchangeRateStore {
  exchangeRate: ExchangeRateResponse | null;
  isLoading: boolean;
  error: string | null;
  setExchangeRate: (rate: ExchangeRateResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  exchangeRate: null,
  isLoading: false,
  error: null,
};

export const useExchangeRateStore = create<ExchangeRateStore>((set) => ({
  ...initialState,
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
