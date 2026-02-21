"use client";
import { Button } from "@/src/components/ui/button";
import { useAmountStore } from "@/src/store/amount-store";
import { useNetworkStore } from "@/src/store/network";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { Country } from "@/types";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useMutation } from "@tanstack/react-query";
import { createQuoteIn } from "@/src/actions/quote";
import { createTransferIn } from "@/src/actions/transfer";
import { AppState, OrderStep, QuoteRequest } from "@/types";
import { countries } from "@/data/countries";
import {
  useBuyRatesSuspense,
  useBuyInstitutionsSuspense,
} from "./hooks/use-buy-suspense";
import { useKYCStore } from "@/src/store/kyc-store";
import {
  getCNGNDefaultAmount,
  getCNGNKYCThreshold,
} from "@/src/lib/exchange-rates-data";
import { toast } from "sonner";
import { verifyKYC } from "@/src/utils/kyc-verification";
import { BYPASS_NG_PHONE_VALIDATION } from "@/constants";
import SelectCountryModal from "@/src/components/modals/select-country-modal";
import BuyValueInput from "@/src/components/inputs/BuyValueInput";
import ExchangeRateComponent from "@/src/components/exchange-rate-component";
import SelectInstitution from "@/src/components/select-institution";
import { SwipeToBuyButton } from "@/src/components/payment/swipe-to-buy";
import { CountryCurrencyModal } from "@/src/components/modals/CountryCurrencyModal";
import { TokenSelectModal } from "@/src/components/modals/TokenSelectModal";
import { useKYCStatusSuspense } from "@/src/hooks/useKYCSuspense";

// Reuse the same country list from withdrawPanel
export const countryCurrencies = [
  { name: "Nigeria", logo: "/logos/nigeria.png" },
  { name: "Kenya", logo: "/logos/kenya.png" },
  { name: "Ghana", logo: "/logos/ghana.png" },
  { name: "Zambia", logo: "/logos/zambia.png" },
  { name: "Uganda", logo: "/logos/uganda.png" },
  { name: "Tanzania", logo: "/logos/tanzania.png" },
];

// Country-specific institution lists

export function BuyInterface() {
  // Local selection states removed; we route via unified modal flow
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  // const [showKYCModal, setShowKYCModal] = useState(false);
  // const [kycTriggered, setKycTriggered] = useState(false);
  const [swipeButtonReset, setSwipeButtonReset] = useState(false);
  const {
    updateSelection,
    country,
    paymentMethod,
    asset,
    appState,
    institution,
  } = useUserSelectionStore();
  const { currentNetwork } = useNetworkStore();

  const { amount, setAmount } = useAmountStore();

  const { setShowKYCModal } = useKYCStore();

  // Get payment method for exchange rates
  const currentPaymentMethod = paymentMethod || "momo";

  // Fetch exchange rates via suspense hook
  const { data: exchangeRates, isLoading: isExchangeRateLoading } =
    useBuyRatesSuspense({
      orderType: "buying",
      providerType: currentPaymentMethod,
    });

  // Extract exchange rate for selected country from suspense data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !exchangeRates) return undefined;
    return exchangeRates[country.countryCode];
  }, [country?.countryCode, exchangeRates]);

  // Extract Nigeria rate for cNGN cross-rate conversions
  const nigeriaRate = useMemo(() => {
    if (!exchangeRates) return undefined;
    return exchangeRates["NG"];
  }, [exchangeRates]);

  // Fetch institutions via suspense hook
  const institutionsSuspenseData = useBuyInstitutionsSuspense({
    method: "buy",
  });

  // Extract institutions for selected country from suspense data
  const institutionsForCountry = useMemo(() => {
    if (!country?.countryCode || !institutionsSuspenseData.data) return [];
    return institutionsSuspenseData.data[country.countryCode] || [];
  }, [country?.countryCode, institutionsSuspenseData.data]);

  // New states for recipient details
  // Old review modal state removed in favor of swipe flow
  const { setQuote } = useQuoteStore();
  const { setTransfer } = useTransferStore();
  const { address, isConnected } = useWalletGetInfo();
  // const { kycData } = useKYCStore();
  const { data: kycData } = useKYCStatusSuspense({ address: address || "" });

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

  // Exchange rate is now fetched via suspense hook above - no need for useEffect

  // Placeholder to satisfy linter (legacy handler kept for potential future use)

  // Create quote + transfer for buy and route into unified modal flow
  const createBuyFlow = useMutation({
    mutationFn: async () => {
      if (!country || !asset || !currentNetwork || !amount) {
        throw new Error("Missing form details");
      }
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      // Nigeria phone validation is now handled in SelectInstitution component
      // No need to validate here since the user can't proceed without valid KYC

      // Build quote payload (buy is quote-in, using cryptoAmount entry like SelectInstitution when country panel on top)
      const payload: QuoteRequest = {
        fiatType: country.currency,
        cryptoType: asset.symbol,
        network: currentNetwork.name.toLowerCase(),
        ...(asset.symbol === "cNGN"
          ? { fiatAmount: amount }
          : { cryptoAmount: amount }),
        country: country.countryCode,
        address: address as string,
      };

      const quoteResp = await createQuoteIn(payload);
      if (!quoteResp?.quote?.quoteId) {
        throw new Error("No quote ID received");
      }

      // Prepare userDetails consistent with TransactionReviewModal/select-institution
      // Access stores outside React via getState to avoid hook usage here
      const { useKYCStore } = await import("@/src/store/kyc-store");
      const { useUserSelectionStore: selectionStore } = await import(
        "@/src/store/user-selection"
      );
      const { kycData } = useKYCStore.getState();
      const {
        institution: inst,
        accountNumber: acctNum,
        accountName: acctName,
        paymentMethod: pm,
      } = selectionStore.getState();
      const fullKYC = kycData?.fullKYC;

      // Allow MoMo transactions under the asset-specific ~$100 threshold to bypass full KYC
      const numericAmount = parseFloat(String(amount));
      const cngnThreshold = getCNGNKYCThreshold(); // Dynamic: ~$1000 in NGN based on current exchange rate
      const usdThreshold = 100;
      const threshold = asset.symbol === "cNGN" ? cngnThreshold : usdThreshold;
      const allowKycBypassForMomo =
        pm === "momo" && numericAmount > 0 && numericAmount < threshold;

      const {
        fullName = "",
        nationality = "",
        dateOfBirth = "",
        documentNumber = "",
        documentType = "",
        documentSubType = "",
        phoneNumber = "",
      } = fullKYC ||
      ({} as unknown as import("@/types").KYCVerificationResponse["fullKYC"]);

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
        name:
          country.countryCode === "NG" && acctName
            ? (acctName as string)
            : fullName,
        country: country.countryCode || "",
        address: nationality || country.name || "",
        phone: acctNum || phoneNumber || "",
        dob: allowKycBypassForMomo ? "" : dateOfBirth,
        idNumber: allowKycBypassForMomo ? "" : documentNumber,
        idType: allowKycBypassForMomo ? "" : updatedDocumentType,
        additionalIdType: allowKycBypassForMomo ? "" : updatedDocumentType,
        additionalIdNumber: allowKycBypassForMomo
          ? ""
          : updatedDocumentTypeSubType,
      };

      let transferPayload:
        | import("@/types").TransferMomoRequest
        | import("@/types").TransferBankRequest;

      if (paymentMethod === "momo") {
        if (country.countryCode === "NG") {
          // Nigeria: Submit empty bank fields for simplified flow
          transferPayload = {
            bank: {
              code: "",
              accountNumber: "",
              accountName: "",
            },
            operator: "bank",
            quoteId: quoteResp.quote.quoteId,
            userDetails: {
              ...userDetails,
              phone: (phoneNumber || "") as string,
            },
          };
        } else if (country.countryCode === "ZA") {
          // South Africa: keep existing behavior (empty bank fields)
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
        if (country.countryCode === "NG") {
          // Nigeria: Submit empty bank fields for simplified flow
          transferPayload = {
            bank: {
              code: "",
              accountNumber: "",
              accountName: "",
            },
            operator: "bank",
            quoteId: quoteResp.quote.quoteId,
            userDetails: {
              ...userDetails,
              phone: (phoneNumber || "") as string,
            },
          };
        } else {
          if (!inst) throw new Error("Institution required");
          const accountName = acctName || fullName;
          if (country.countryCode === "ZA") {
            // South Africa: keep previous behavior using provided account details
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
        }
      } else {
        throw new Error("Unsupported payment method");
      }

      console.log("transferPayload", transferPayload);

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
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to start purchase";
      toast.error(message);
    },
  });

  // Handle KYC completion and auto-retry buy
  // useEffect(() => {
  //   if (kycTriggered && kycData && kycData.kycStatus === "VERIFIED") {
  //     setKycTriggered(false);
  //     setShowKYCModal(false);
  //     // Auto-retry the buy flow after KYC completion
  //     createBuyFlow.mutate();
  //   }
  // }, [kycTriggered, kycData, createBuyFlow]);

  // Prefill minimum amount when switching assets (reset per-asset floor)
  useEffect(() => {
    if (!asset?.symbol) return;
    const minByAsset: Record<string, string> = {
      cNGN: getCNGNDefaultAmount().toString(),
      USDC: "1",
      USDT: "1",
    };
    setAmount(minByAsset[asset.symbol] ?? "1");
  }, [asset?.symbol, setAmount]);

  // Reset buy state function (similar to resetPaymentState in payment interface)
  // const resetBuyState = () => {
  //   setShowKYCModal(false);
  //   setKycTriggered(false);
  // };

  // Handle buy completion with KYC verification
  const handleBuyComplete = () => {
    // Use global KYC verification utility
    const kycResult = verifyKYC({
      amount: amount || 0,
      country: country || null,
      asset: asset || null,
      paymentMethod: paymentMethod || null,
      kycData: kycData || null,
      orderType: "buying",
    });

    // If KYC check fails, show modal and reset button
    if (!kycResult.shouldProceed) {
      // Reset swipe button to roll back to initial position
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100);

      // Set flag to indicate KYC was triggered
      // setKycTriggered(true);
      setShowKYCModal(true);

      // Show error message with the reason from verification
      toast.error(kycResult.reason || "KYC verification required");
      return;
    }

    // If KYC is verified or bypass is allowed, proceed with the purchase
    createBuyFlow.mutate(); // TODO: Uncomment this when ready to proceed
  };

  const isBuyDisabled = useMemo(() => {
    if (!country || !asset || !currentNetwork || !amount) return true;
    if (!isConnected || !address) return true;
    if (appState === AppState.Processing) return true; // block swipe during account verification

    // Nigeria-specific phone validation, toggled by feature flag
    if (country.countryCode === "NG") {
      if (!BYPASS_NG_PHONE_VALIDATION) {
        const kycPhone = kycData?.fullKYC?.phoneNumber || "";
        const isValidNigerianPhone = (input?: string | null) => {
          if (!input) return false;
          const phone = String(input).replace(/\s|-/g, "");
          // Accept: +234XXXXXXXXXX (10 digits after country code), 234XXXXXXXXXX, or 0XXXXXXXXXX (11 digits)
          const patterns = [/^\+234\d{10}$/i, /^234\d{10}$/i, /^0\d{10}$/];
          return patterns.some((re) => re.test(phone));
        };
        if (!isValidNigerianPhone(kycPhone)) return true;
      }
    } else {
      // For non-Nigeria countries, require institution selection
      if (!institution) return true;
    }

    return false;
  }, [
    country,
    asset,
    currentNetwork,
    amount,
    isConnected,
    address,
    appState,
    kycData,
    institution,
  ]);

  // Nigeria-specific KYC phone validation to show an inline message (since institution/account inputs are hidden)
  const isNgPhoneInvalid = useMemo(() => {
    if (BYPASS_NG_PHONE_VALIDATION) return false;
    if (country?.countryCode !== "NG") return false;
    const kycPhone = kycData?.fullKYC?.phoneNumber || "";
    const phone = String(kycPhone).replace(/\s|-/g, "");
    const patterns = [/^\+234\d{10}$/i, /^234\d{10}$/i, /^0\d{10}$/];
    return !patterns.some((re) => re.test(phone));
  }, [country?.countryCode, kycData]);

  const handleCountrySelect = (selectedCountry: Country) => {
    // Use exchange rate from suspense data if available, otherwise fallback to country default
    const rate =
      exchangeRates?.[selectedCountry.countryCode]?.exchange ??
      selectedCountry.exchangeRate;

    // If the selected country is Nigeria, set the payment method to bank
    if (selectedCountry.countryCode === "NG") {
      updateSelection({ paymentMethod: "bank" });
    }

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
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-3xl min-h-[400px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 border !border-[#232323]">
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
              exchangeRate={exchangeRate}
              nigeriaRate={nigeriaRate}
              isLoading={isExchangeRateLoading}
            />
          )}
        </>
      )}

      {/* Always allow selecting institution once a country is chosen, except for Nigeria buy flow */}
      {country && country.countryCode !== "NG" && (
        <SelectInstitution
          buy
          disableSubmit={true}
          institutions={institutionsForCountry}
        />
      )}

      {/* Show swipe button as soon as a country is picked; stays disabled until all requirements are met */}
      {country && (
        <div className="mt-4">
          {isNgPhoneInvalid && country.countryCode === "NG" && (
            <p className="text-red-500 text-xs mb-2 text-center">
              Invalid Nigerian phone number in KYC.
            </p>
          )}
          <SwipeToBuyButton
            onBuyComplete={handleBuyComplete}
            isLoading={createBuyFlow.isPending}
            disabled={isBuyDisabled}
            stepMessage={
              createBuyFlow.isPending ? "Setting up purchase..." : undefined
            }
            reset={swipeButtonReset}
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
    </div>
  );
}
