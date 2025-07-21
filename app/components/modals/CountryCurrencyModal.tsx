import { Country } from "@/types";
import Image from "next/image";
import { countries } from "@/data/countries";
import { Dialog, DialogContent, DialogPortal, DialogOverlay, VisuallyHidden } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useUserSelectionStore } from "@/store/user-selection";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMemo } from "react";

interface CountryCurrencyModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  filteredCountries?: Country[];
}

export function CountryCurrencyModal({
  open,
  onClose,
  onSelect,
  filteredCountries,
}: CountryCurrencyModalProps) {
  const { country } = useUserSelectionStore();
  const { countryCode: userCountryCode, isLoading: isLocationLoading } = useUserLocation();

  const selectedCurrency = country;
  const baseCountries = filteredCountries || countries;

  // Sort countries to show user's country first (if it's in the list)
  const sortedCountries = useMemo(() => {
    if (isLocationLoading || !userCountryCode) {
      return baseCountries;
    }

    // Find if user's country is in the available countries
    const userCountryIndex = baseCountries.findIndex(
      (c) => c.countryCode === userCountryCode
    );

    if (userCountryIndex === -1) {
      // User's country not in the list, return original order
      return baseCountries;
    }

    // Move user's country to the front
    const userCountry = baseCountries[userCountryIndex];
    const otherCountries = baseCountries.filter((_, index) => index !== userCountryIndex);
    
    return [userCountry, ...otherCountries];
  }, [baseCountries, userCountryCode, isLocationLoading]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg" />
                <DialogPrimitive.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-none text-white p-0 m-0 w-full max-w-none rounded-t-[2.5rem] shadow-2xl animate-slide-up-smooth overflow-hidden"
          style={{ padding: 0, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select Country</DialogPrimitive.Title>
          </VisuallyHidden>
          <div className="flex flex-col h-full w-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#232323] bg-[#181818] sticky top-0 z-10 rounded-t-[2.5rem]">
            <h2 className="text-xl font-bold">Select Country</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-2 rounded-full hover:bg-[#232323]"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          
          {/* Drag indicator for mobile */}
          <div className="flex justify-center pt-1 pb-1">
            <div className="w-12 h-1 bg-neutral-600 rounded-full"></div>
          </div>

          {/* Scrollable content area */}
          <div 
            className="overflow-y-auto overflow-x-hidden px-4 py-2 scroll-smooth scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#525252 transparent',
              maxHeight: '60vh'
            }}
          >
            <div className="flex flex-col gap-3 pb-4">
            {sortedCountries.map((country, index) => {
              const isUserCountry = !isLocationLoading && userCountryCode === country.countryCode;
              const isSelected = selectedCurrency?.name === country.name;
              
              return (
                <Button
                  key={country.name}
                  variant="ghost"
                  className={`flex text-sm items-center justify-between w-full px-4 py-4 rounded-2xl transition-all duration-200 text-left shadow-sm ${
                    isSelected
                      ? "bg-[#353545] border border-[#4a4a5a] scale-[0.98]"
                      : "hover:bg-[#23232f] border border-transparent hover:scale-[0.99]"
                  }`}
                  onClick={() => onSelect(country)}
                  style={{ minHeight: 60 }}
                >
                  <span className="flex items-center gap-4">
                    <Image
                      src={country.logo}
                      alt={country.name}
                      width={35}
                      height={35}
                      className="rounded-full"
                    />
                    <span className="flex flex-col">
                      <span className="text-white font-medium text-base">
                        {country.name}
                      </span>
                      {/* {isUserCountry && index === 0 && (
                        <span className="text-xs text-green-400 font-medium">
                          Recommended for you
                        </span>
                      )} */}
                    </span>
                  </span>
                  {isSelected && (
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#bcbcff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Button>
              );
            })}
            </div>
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
    </Dialog>
  );
}
