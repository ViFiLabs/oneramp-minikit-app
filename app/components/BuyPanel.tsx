"use client";
import { getCountryExchangeRate } from "@/actions/rates";
import { Button } from "@/components/ui/button";
import { useAmountStore } from "@/store/amount-store";
import { useExchangeRateStore } from "@/store/exchange-rate-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { Country, Institution } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import ExchangeRateComponent from "./exchange-rate-component";
import BuyValueInput from "./inputs/BuyValueInput";
import { BuyTransactionReviewModal } from "./modals/BuyTransactionReviewModal";
import { CountryCurrencyModal } from "./modals/CountryCurrencyModal";
import SelectCountryModal from "./modals/select-country-modal";
import { TokenSelectModal } from "./modals/TokenSelectModal";
import SelectInstitution from "./select-institution";

// Reuse the same country list from SwapPanel
export const countryCurrencies = [
  { name: "Nigeria", logo: "/logos/nigeria.png" },
  { name: "Kenya", logo: "/logos/kenya.png" },
  { name: "Ghana", logo: "/logos/ghana.png" },
  { name: "Zambia", logo: "/logos/zambia.png" },
  { name: "Uganda", logo: "/logos/uganda.png" },
  { name: "Tanzania", logo: "/logos/tanzania.png" },
];

// Country-specific institution lists

export function BuyPanel() {
  const [selectedCountry, setSelectedCountry] = useState<null | {
    name: string;
    logo: string;
  }>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedToken] = useState<null | {
    symbol: string;
    name: string;
    logo: string;
    network: string;
    networkLogo: string;
  }>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { institution, updateSelection, country, paymentMethod, asset } =
    useUserSelectionStore();
  const { exchangeRate, setExchangeRate, setError } = useExchangeRateStore();
  const { currentNetwork } = useNetworkStore();

  const { amount, setAmount } = useAmountStore();

  // New states for recipient details
  const [accountNumber] = useState("");
  const [description] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch exchange rate when country or payment method changes
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!country?.countryCode || !paymentMethod) return;

      try {
        const response = await getCountryExchangeRate({
          country: country.countryCode,
          orderType: "buying",
          providerType: paymentMethod,
        });

        setExchangeRate(response);
        setError(null);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch exchange rate"
        );
        setExchangeRate(null);
      }
    };

    fetchExchangeRate();
  }, [country?.countryCode, paymentMethod, setExchangeRate, setError]);

  // Handler for buy confirmation
  const handleConfirmBuy = () => {};

  const handleCountrySelect = (selectedCountry: Country) => {
    const rate = exchangeRate?.exchange ?? selectedCountry.exchangeRate;

    updateSelection({
      country: {
        ...selectedCountry,
        exchangeRate: rate,
      },
      // Reset related fields when country changes
      institution: undefined,
      address: undefined,
      accountNumber: undefined,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-2xl min-h-[450px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 border !border-[#232323]">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <span className="text-neutral-400 text-base md:text-lg">
          You&apos;re buying
        </span>
        <SelectCountryModal handleCountrySelect={handleCountrySelect} />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-[280px] md:max-w-[300px] flex justify-center">
            <BuyValueInput />
          </div>
        </div>
        <Button
          variant="default"
          className="bg-white  hover:bg-gray-100 text-black px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-medium flex items-center gap-2"
          onClick={() => setShowTokenModal(true)}
        >
          {asset && currentNetwork ? (
            <>
              <Image
                src={asset.logo}
                alt={asset.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="font-medium">{asset.symbol}</span>
              {currentNetwork && (
                <span className="text-gray-500 text-xs">
                  on {currentNetwork.name}
                </span>
              )}
            </>
          ) : (
            <span className="pl-4">Select a token</span>
          )}
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M7 10l5 5 5-5"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        {/* Quick amount buttons */}
        <div className="flex gap-2 md:gap-4 mt-1 md:mt-2">
          <Button
            variant="outline"
            className="rounded-full px-4 md:px-6 py-2 text-sm md:text-base text-white bg-[#232323] border-none hover:bg-[#3a4155]"
            onClick={() => setAmount("100")}
          >
            $100
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-4 md:px-6 py-2 text-sm md:text-base text-white bg-[#232323] border-none hover:bg-[#3a4155]"
            onClick={() => setAmount("300")}
          >
            $300
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-4 md:px-6 py-2 text-sm md:text-base text-white bg-[#232323] border-none hover:bg-[#3a4155]"
            onClick={() => setAmount("500")}
          >
            $500
          </Button>
        </div>
      </div>

      {/* Recipient Details - Only show when both country and token are selected */}
      {country && asset && (
        <>
          {/* Exchange Rate Info */}
          {country && currentNetwork && <ExchangeRateComponent default />}

          <SelectInstitution buy />
        </>
      )}

      {!country && !asset && (
        <Button
          className="w-full bg-[#232323] text-white text-sm md:text-base font-bold h-12 md:h-14 mt-2 rounded-2xl"
          disabled={true}
        >
          Select country and token
        </Button>
      )}

      {/* Country Selection Modal */}
      <CountryCurrencyModal
        open={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onSelect={(country) => {
          setSelectedCountry(country);
          setShowCountryModal(false);
        }}
      />

      {/* Token Selection Modal */}
      <TokenSelectModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />

      {/* Buy Transaction Review Modal */}
      {selectedToken && selectedCountry && (
        <BuyTransactionReviewModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmBuy}
          amount={amount}
          currency={selectedToken.symbol}
          currencyLogo={selectedToken.logo}
          totalValue={`${selectedCountry.name === "Kenya" ? "Ksh" : "NGN"} ${(
            parseFloat(amount) * 127.42
          ).toFixed(2)}`}
          recipient={
            accountNumber
              ? accountNumber.substring(0, 4) + "..."
              : "Not specified"
          }
          account={accountNumber || "Not specified"}
          institution={(institution as Institution) || "Not specified"}
          network={selectedToken.network}
          networkLogo={selectedToken.networkLogo}
          walletAddress={description || undefined}
        />
      )}
    </div>
  );
}
