"use client";

import SelectCountry from "../select-country";

interface ToPanelProps {
  selectedCountryCurrency?: {
    name: string;
    logo: string;
  } | null;
  onBeneficiarySelect?: () => void;
}

export function ToPanel({
  selectedCountryCurrency,
  onBeneficiarySelect,
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

      <SelectCountry />
    </div>
  );
}
