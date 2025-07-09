import { Button } from "@/components/ui/button";
import { Country } from "@/types";
import Image from "next/image";
import { CountryCurrencyModal } from "./CountryCurrencyModal";
import { useUserSelectionStore } from "@/store/user-selection";
import { useState } from "react";

interface SelectCountryModalProps {
  handleCountrySelect: (country: Country) => void;
}

const SelectCountryModal = ({
  handleCountrySelect,
}: SelectCountryModalProps) => {
  const [showCountryCurrencyModal, setShowCountryCurrencyModal] =
    useState(false);
  const { country } = useUserSelectionStore();
  return (
    <>
      <Button
        variant="default"
        className="flex items-center gap-2 bg-black border-none px-4 py-2 rounded-full min-w-[140px]"
        onClick={() => setShowCountryCurrencyModal(true)}
      >
        {country ? (
          <>
            <Image
              src={country.logo}
              alt={country.name}
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-white font-medium">{country.name}</span>
          </>
        ) : (
          <span className="text-neutral-400 font-medium">Select Country</span>
        )}
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 10l5 5 5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>

      <CountryCurrencyModal
        open={showCountryCurrencyModal}
        onClose={() => setShowCountryCurrencyModal(false)}
        onSelect={(country) => {
          handleCountrySelect(country);
          setShowCountryCurrencyModal(false);
        }}
      />
    </>
  );
};

export default SelectCountryModal;
