import { Country } from "@/types";
import Image from "next/image";
import { countries } from "@/data/countries";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserSelectionStore } from "@/store/user-selection";
import { Button } from "@/components/ui/button";

interface CountryCurrencyModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

export function CountryCurrencyModal({
  open,
  onClose,
  onSelect,
}: CountryCurrencyModalProps) {
  const { country } = useUserSelectionStore();

  const selectedCurrency = country;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="fixed inset-0 z-50 bg-[#181818] border-none text-white p-0 m-0 w-screen h-screen max-w-none max-h-none rounded-none shadow-none flex flex-col animate-slide-in-top"
        style={{ padding: 0 }}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#232323]">
            <h2 className="text-xl font-bold">Select Country</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 by-6 flex flex-col gap-4">
            {countries.map((country) => (
              <Button
                key={country.name}
                variant="ghost"
                className={`flex text-sm items-center justify-between w-full px-4 py-5 rounded-xl transition-colors text-left ${
                  selectedCurrency?.name === country.name
                    ? "bg-[#353545] border border-[#4a4a5a]"
                    : "hover:bg-[#23232f] border border-transparent"
                }`}
                onClick={() => onSelect(country)}
                style={{ minHeight: 50 }}
              >
                <span className="flex items-center gap-4">
                  <Image
                    src={country.logo}
                    alt={country.name}
                    width={35}
                    height={35}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium text-base">
                    {country.name}
                  </span>
                </span>
                {selectedCurrency?.name === country.name && (
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
