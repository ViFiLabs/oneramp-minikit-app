"use client";

import SelectCountry from "../select-country";
import { ExchangeRateResponse } from "@/types";

interface ToPanelProps {
  selectedCountryCurrency?: {
    name: string;
    logo: string;
  } | null;
  onBeneficiarySelect?: () => void;
  exchangeRate?: ExchangeRateResponse; // Optional exchange rate from suspense data for current country
  nigeriaRate?: ExchangeRateResponse; // Optional Nigeria rate from suspense data
  exchangeRates?: Record<string, ExchangeRateResponse>; // Optional all exchange rates map
}

export function ToPanel({
  selectedCountryCurrency,
  onBeneficiarySelect,
  exchangeRate,
  nigeriaRate,
  exchangeRates,
}: ToPanelProps) {
  return (
    <div className="mx-3 md:mx-4 my-1 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-neutral-200 text-base md:text-lg font-medium">
          To
        </span>
        {selectedCountryCurrency && (
          <span
            className="text-purple-400 text-xs md:text-sm font-medium cursor-pointer"
            onClick={onBeneficiarySelect}
          >
            Select beneficiary
          </span>
        )}
      </div>

      <SelectCountry
        exchangeRate={exchangeRate}
        nigeriaRate={nigeriaRate}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}
