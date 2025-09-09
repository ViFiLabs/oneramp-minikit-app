import { Country } from "@/types";
import Image from "next/image";
import { countries } from "@/data/countries";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  VisuallyHidden,
} from "@/app/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useUserSelectionStore } from "@/store/user-selection";
import { Button } from "@/app/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMemo } from "react";
import { usePreFetchInstitutions } from "@/hooks/useExchangeRate";
import { useQueryClient } from "@tanstack/react-query";
import { getInstitutions } from "@/actions/institutions";

interface CountryCurrencyModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  filteredCountries?: Country[];
}

// Check if a country is disabled
const isCountryDisabled = (country: Country) => {
  return country.countryCode === "GHA"; // Ghana is disabled
};

export function CountryCurrencyModal({
  open,
  onClose,
  onSelect,
  filteredCountries,
}: CountryCurrencyModalProps) {
  const { country } = useUserSelectionStore();
  const { countryCode: userCountryCode, isLoading: isLocationLoading } =
    useUserLocation();
  const queryClient = useQueryClient();

  const selectedCurrency = country;
  const baseCountries = filteredCountries || countries;

  // Pre-fetch institutions for Kenya and Uganda on initial load
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: kenyaInstitutions } = usePreFetchInstitutions("KE", "buy");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: ugandaInstitutions } = usePreFetchInstitutions("UG", "buy");

  // Sort countries to show user's country first (if it's in the list)
  // but keep disabled countries (like Ghana) at the end
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

    // Get user's country and check if it's disabled
    const userCountry = baseCountries[userCountryIndex];
    const otherCountries = baseCountries.filter(
      (_, index) => index !== userCountryIndex
    );

    // Separate disabled and enabled countries
    const enabledCountries = otherCountries.filter(c => !isCountryDisabled(c));
    const disabledCountries = otherCountries.filter(c => isCountryDisabled(c));

    // If user's country is disabled, don't put it at the front
    if (isCountryDisabled(userCountry)) {
      return [...enabledCountries, ...disabledCountries, userCountry];
    }

    return [userCountry, ...enabledCountries, ...disabledCountries];
  }, [baseCountries, userCountryCode, isLocationLoading]);

  // Enhanced country selection handler that triggers pre-fetching
  const handleCountrySelect = (selectedCountry: Country) => {
    // Prevent selecting disabled countries
    if (isCountryDisabled(selectedCountry)) {
      return;
    }

    // Pre-fetch institutions for the selected country in the background
    // This will cache the institutions for when the user opens the institution modal
    queryClient.prefetchQuery({
      queryKey: ["institutions", selectedCountry.countryCode, "buy"],
      queryFn: () => getInstitutions(selectedCountry.countryCode, "buy"),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    queryClient.prefetchQuery({
      queryKey: ["institutions", selectedCountry.countryCode, "sell"],
      queryFn: () => getInstitutions(selectedCountry.countryCode, "sell"),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Call the original onSelect handler
    onSelect(selectedCountry);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-lg" />
        <DialogPrimitive.Content
          className="fixed z-50 bg-[#181818] border-none text-white p-0 m-0 w-full max-w-none shadow-2xl overflow-hidden
          /* Mobile: bottom sheet behavior */
          bottom-0 left-0 right-0 rounded-t-2xl animate-slide-up-smooth
          /* Desktop: centered modal */
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-2xl md:animate-in md:fade-in md:duration-200
          desktop-modal-center"
          style={{
            padding: 0,
            maxHeight: "60vh",
            minHeight: "auto",
            height: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <VisuallyHidden>
            <DialogPrimitive.Title>Select Country</DialogPrimitive.Title>
          </VisuallyHidden>
          <div className="flex flex-col h-full w-full">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[#232323] bg-[#181818] sticky top-0 z-10 rounded-t-2xl">
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
              className="overflow-y-auto overflow-x-hidden px-4 py-2 scroll-smooth scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-transparent flex-1"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
                scrollbarColor: "#525252 transparent",
                maxHeight: "calc(60vh - 120px)",
              }}
            >
              <div className="flex flex-col gap-3 pb-4">
                {sortedCountries.map((country) => {
                  // const isUserCountry =
                  //   !isLocationLoading &&
                  //   userCountryCode === country.countryCode;
                  const isSelected = selectedCurrency?.name === country.name;
                  const isDisabled = isCountryDisabled(country);

                  return (
                    <Button
                      key={country.name}
                      variant="ghost"
                      disabled={isDisabled}
                      className={`flex text-sm items-center justify-between w-full px-4 py-4 rounded-2xl transition-all duration-200 text-left shadow-sm ${
                        isDisabled
                          ? "bg-[#1a1a1a] opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-[#353545] border border-[#4a4a5a] scale-[0.98]"
                          : "hover:bg-[#23232f] border border-transparent hover:scale-[0.99]"
                      }`}
                      onClick={() => handleCountrySelect(country)}
                      style={{ minHeight: 60 }}
                    >
                      <span className="flex items-center gap-4">
                        <Image
                          src={country.logo}
                          alt={country.name}
                          width={35}
                          height={35}
                          className={`rounded-full ${isDisabled ? "grayscale opacity-70" : ""}`}
                        />
                        <span className="flex flex-col">
                          <span className={`font-medium text-base ${isDisabled ? "text-neutral-500" : "text-white"}`}>
                            {country.name}
                          </span>
                          {/* {isUserCountry && index === 0 && (
                        <span className="text-xs text-green-400 font-medium">
                          Recommended for you
                        </span>
                      )} */}
                        </span>
                      </span>
                      {isDisabled ? (
                        <svg
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                          className="text-neutral-500"
                        >
                          <path
                            d="M6 10v-4a6 6 0 1 1 12 0v4M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : isSelected ? (
                        <svg
                          width="28"
                          height="28"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="#bcbcff"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
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
