import { Institution } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Data for each payment type
interface PaybillData {
  billNumber?: string;
  accountNumber?: string; // Business Number for Paybill
}

interface BuyGoodsData {
  tillNumber?: string;
}

interface SendMoneyData {
  phoneNumber?: string;
  accountName?: string;
  institution?: Institution;
}

// Store payment data per country
interface CountryPaymentData {
  paybill?: PaybillData;
  buyGoods?: BuyGoodsData;
  sendMoney?: SendMoneyData;
  lastUpdated?: string;
}

interface PayRecipientStore {
  // Map of country code to payment data
  paymentsByCountry: Record<string, CountryPaymentData>;

  // Save Paybill data for a specific country
  savePaybill: (countryCode: string, data: PaybillData) => void;

  // Save Buy Goods data for a specific country
  saveBuyGoods: (countryCode: string, data: BuyGoodsData) => void;

  // Save Send Money data for a specific country
  saveSendMoney: (countryCode: string, data: SendMoneyData) => void;

  // Get payment data for a specific country
  getPaymentData: (countryCode: string) => CountryPaymentData | undefined;

  // Clear payment data for a specific country
  clearPaymentData: (countryCode: string) => void;

  // Clear all payment data
  clearAllPaymentData: () => void;
}

export const usePayRecipientStore = create<PayRecipientStore>()(
  persist(
    (set, get) => ({
      paymentsByCountry: {},

      savePaybill: (countryCode, data) => {
        set((state) => ({
          paymentsByCountry: {
            ...state.paymentsByCountry,
            [countryCode]: {
              ...state.paymentsByCountry[countryCode],
              paybill: data,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      saveBuyGoods: (countryCode, data) => {
        set((state) => ({
          paymentsByCountry: {
            ...state.paymentsByCountry,
            [countryCode]: {
              ...state.paymentsByCountry[countryCode],
              buyGoods: data,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      saveSendMoney: (countryCode, data) => {
        set((state) => ({
          paymentsByCountry: {
            ...state.paymentsByCountry,
            [countryCode]: {
              ...state.paymentsByCountry[countryCode],
              sendMoney: data,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      getPaymentData: (countryCode) => {
        return get().paymentsByCountry[countryCode];
      },

      clearPaymentData: (countryCode) => {
        set((state) => {
          const { [countryCode]: _, ...rest } = state.paymentsByCountry;
          return { paymentsByCountry: rest };
        });
      },

      clearAllPaymentData: () => {
        set({ paymentsByCountry: {} });
      },
    }),
    {
      name: "pay-recipient-storage", // unique name for localStorage key
    }
  )
);
