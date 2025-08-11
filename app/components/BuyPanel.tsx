"use client";
import { getCountryExchangeRate } from "@/actions/rates";
import { Button } from "@/components/ui/button";
import { useAmountStore } from "@/store/amount-store";
import { useExchangeRateStore } from "@/store/exchange-rate-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { Country } from "@/types";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import ExchangeRateComponent from "./exchange-rate-component";
import BuyValueInput from "./inputs/BuyValueInput";
// import { BuyTransactionReviewModal } from "./modals/BuyTransactionReviewModal";
import { CountryCurrencyModal } from "./modals/CountryCurrencyModal";
import SelectCountryModal from "./modals/select-country-modal";
import { TokenSelectModal } from "./modals/TokenSelectModal";
import SelectInstitution from "./select-institution";
import { SwipeToBuyButton } from "./payment/swipe-to-buy";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useMutation } from "@tanstack/react-query";
import { createQuoteIn } from "@/actions/quote";
import { createTransferIn } from "@/actions/transfer";
import { AppState, OrderStep, QuoteRequest } from "@/types";
import { countries } from "@/data/countries";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { usePreFetchInstitutions } from "@/hooks/useExchangeRate";

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
  // Local selection states removed; we route via unified modal flow
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { updateSelection, country, paymentMethod, asset } =
    useUserSelectionStore();
  const { exchangeRate, setExchangeRate, setError } = useExchangeRateStore();
  const { currentNetwork } = useNetworkStore();

  const { amount, setAmount } = useAmountStore();

  // Pre-fetch data for better performance
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allExchangeRates } = useAllCountryExchangeRates({
    orderType: "buying",
    providerType: "momo",
  });

  // Pre-fetch institutions for Kenya and Uganda on initial load for better UX
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: kenyaInstitutions } = usePreFetchInstitutions("KE", "buy");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: ugandaInstitutions } = usePreFetchInstitutions("UG", "buy");

  // New states for recipient details
  // Old review modal state removed in favor of swipe flow
  const { setQuote } = useQuoteStore();
  const { setTransfer } = useTransferStore();
  const { address, isConnected } = useWalletGetInfo();

  // Countries disabled for BuyPanel testing
  const DISABLED_COUNTRIES_FOR_BUY = useMemo(
    () => ["Zambia", "South Africa"],
    []
  );

  // Filter out disabled countries for BuyPanel
  const buyPanelCountries = useMemo(() => {
    return countries.filter(
      (country) => !DISABLED_COUNTRIES_FOR_BUY.includes(country.name)
    );
  }, [DISABLED_COUNTRIES_FOR_BUY]);

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

  // Placeholder to satisfy linter (legacy handler kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfirmBuy = () => undefined;

  // Create quote + transfer for buy and route into unified modal flow
  const createBuyFlow = useMutation({
    mutationFn: async () => {
      if (!country || !asset || !currentNetwork || !amount) {
        throw new Error("Missing form details");
      }
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Build quote payload (buy is quote-in, using cryptoAmount entry like SelectInstitution when country panel on top)
      const payload: QuoteRequest = {
        fiatType: country.currency,
        cryptoType: asset.symbol,
        network: currentNetwork.name.toLowerCase(),
        cryptoAmount: amount,
        country: country.countryCode,
        address: address as string,
      };
      const quoteResp = await createQuoteIn(payload);
      if (!quoteResp?.quote?.quoteId) {
        throw new Error("No quote ID received");
      }

      // Prepare userDetails consistent with TransactionReviewModal/select-institution
      // Access stores outside React via getState to avoid hook usage here
      const { useKYCStore } = await import("@/store/kyc-store");
      const { useUserSelectionStore: selectionStore } = await import(
        "@/store/user-selection"
      );
      const { kycData } = useKYCStore.getState();
      const {
        institution: inst,
        accountNumber: acctNum,
        accountName: acctName,
      } = selectionStore.getState();
      const fullKYC = kycData?.fullKYC;
      if (!fullKYC) throw new Error("KYC not available");

      const {
        fullName,
        nationality,
        dateOfBirth,
        documentNumber,
        documentType,
        documentSubType,
        phoneNumber,
      } = fullKYC;

      let updatedDocumentType = documentType;
      let updatedDocumentTypeSubType = documentSubType;
      if (country.countryCode === "NG") {
        updatedDocumentTypeSubType = "BVN";
        updatedDocumentType = "NIN";
      } else if (documentType === "ID") {
        updatedDocumentType = "NIN";
      } else if (documentType === "P") {
        updatedDocumentType = "Passport";
      } else {
        updatedDocumentType = "License";
      }

      const userDetails = {
        name: fullName,
        country: country.countryCode || "",
        address: nationality || country.name || "",
        phone: acctNum || phoneNumber || "",
        dob: dateOfBirth,
        idNumber: documentNumber,
        idType: updatedDocumentType,
        additionalIdType: updatedDocumentType,
        additionalIdNumber: updatedDocumentTypeSubType,
      };

      let transferPayload:
        | import("@/types").TransferMomoRequest
        | import("@/types").TransferBankRequest;
      const isNigeriaOrSouthAfrican =
        country.countryCode === "NG" || country.countryCode === "ZA";

      if (paymentMethod === "momo") {
        if (isNigeriaOrSouthAfrican) {
          transferPayload = {
            bank: { code: "", accountNumber: "", accountName: "" },
            operator: "bank",
            quoteId: quoteResp.quote.quoteId,
            userDetails: {
              ...userDetails,
              phone: (phoneNumber || "") as string,
            },
          };
        } else {
          if (!inst) throw new Error("Institution required");
          // format phone number with country code similar to select-institution
          const acctNo = (acctNum || "").replace(/^0+/, "");
          const fullPhone = `${country.phoneCode}${acctNo}`;
          transferPayload = {
            phone: fullPhone,
            operator: inst.name.toLowerCase(),
            quoteId: quoteResp.quote.quoteId,
            userDetails,
          };
        }
      } else if (paymentMethod === "bank") {
        if (!inst) throw new Error("Institution required");
        const accountName = acctName || fullName;
        if (isNigeriaOrSouthAfrican) {
          transferPayload = {
            bank: {
              code: inst.code,
              accountNumber: (acctNum || "") as string,
              accountName,
            },
            operator: "bank",
            quoteId: quoteResp.quote.quoteId,
            userDetails: {
              ...userDetails,
              phone: (phoneNumber || acctNum || "") as string,
            },
          };
        } else {
          transferPayload = {
            bank: {
              code: inst.code,
              accountNumber: (acctNum || "") as string,
              accountName,
            },
            operator: "bank",
            quoteId: quoteResp.quote.quoteId,
            userDetails,
          };
        }
      } else {
        throw new Error("Unsupported payment method");
      }

      const transferResp = await createTransferIn(transferPayload);
      return { quoteResp, transferResp };
    },
    onSuccess: (data) => {
      if (data?.quoteResp?.quote) setQuote(data.quoteResp.quote);
      if (data?.transferResp) setTransfer(data.transferResp);
      // Enter processing modal flow
      useUserSelectionStore.getState().updateSelection({
        orderStep: OrderStep.ProcessingPayment,
        appState: AppState.Idle,
      });
    },
  });

  const isBuyDisabled = useMemo(() => {
    if (!country || !asset || !currentNetwork || !amount) return true;
    if (!isConnected || !address) return true;
    return false;
  }, [country, asset, currentNetwork, amount, isConnected, address]);

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
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-2xl min-h-[400px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 border !border-[#232323]">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <span className="text-neutral-400 text-base md:text-lg">
          You&apos;re buying
        </span>
        <SelectCountryModal
          handleCountrySelect={handleCountrySelect}
          filteredCountries={buyPanelCountries}
        />
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

      {/* Recipient Details - Exchange rate + swipe shown when both country and token are selected */}
      {country && asset && (
        <>
          {/* Exchange Rate Info */}
          {country && currentNetwork && (
            <ExchangeRateComponent
              default
              orderType="buying"
              showAmountConversion={true}
            />
          )}
        </>
      )}

      {/* Always allow selecting institution once a country is chosen */}
      {country && <SelectInstitution buy disableSubmit={true} />}

      {/* Show swipe button as soon as a country is picked; stays disabled until all requirements are met */}
      {country && (
        <div className="mt-4">
          <SwipeToBuyButton
            onBuyComplete={() => createBuyFlow.mutate()}
            isLoading={createBuyFlow.isPending}
            disabled={isBuyDisabled}
            stepMessage={
              createBuyFlow.isPending ? "Setting up purchase..." : undefined
            }
          />
        </div>
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
        onSelect={(selected) => {
          handleCountrySelect(selected);
          setShowCountryModal(false);
        }}
      />

      {/* Token Selection Modal */}
      <TokenSelectModal
        open={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />

      {/* Review modal disabled for swipe flow */}
    </div>
  );
}
