import { Institution } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Store recipient data per country
interface CountryRecipientData {
  institution?: Institution;
  accountNumber?: string;
  accountName?: string;
  paymentMethod?: "bank" | "momo";
  lastUpdated?: string;
}

interface RecipientStore {
  // Map of country code to recipient data
  recipientsByCountry: Record<string, CountryRecipientData>;

  // Save recipient data for a specific country
  saveRecipient: (
    countryCode: string,
    data: {
      institution?: Institution;
      accountNumber?: string;
      accountName?: string;
      paymentMethod?: "bank" | "momo";
    }
  ) => void;

  // Get recipient data for a specific country
  getRecipient: (countryCode: string) => CountryRecipientData | undefined;

  // Clear recipient data for a specific country
  clearRecipient: (countryCode: string) => void;

  // Clear all recipient data
  clearAllRecipients: () => void;
}

export const useRecipientStore = create<RecipientStore>()(
  persist(
    (set, get) => ({
      recipientsByCountry: {},

      saveRecipient: (countryCode, data) => {
        set((state) => ({
          recipientsByCountry: {
            ...state.recipientsByCountry,
            [countryCode]: {
              ...state.recipientsByCountry[countryCode],
              ...data,
              lastUpdated: new Date().toISOString(),
            },
          },
        }));
      },

      getRecipient: (countryCode) => {
        return get().recipientsByCountry[countryCode];
      },

      clearRecipient: (countryCode) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [countryCode]: _removed, ...rest } =
            state.recipientsByCountry;
          return { recipientsByCountry: rest };
        });
      },

      clearAllRecipients: () => {
        set({ recipientsByCountry: {} });
      },
    }),
    {
      name: "recipient-storage", // unique name for localStorage key
    }
  )
);
