"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwipeToPayButton } from "./swipe-to-pay";
import { CountryCurrencyModal } from "../modals/CountryCurrencyModal";
import { InstitutionModal } from "../modals/InstitutionModal";

// Import app data and stores
import { assets } from "@/data/currencies";
import {
  getPaySupportedCountries,
  isPaymentTypeSupported,
  requiresInstitutionSelection,
} from "@/data/countries";

// Note: Actions are now handled by the useBillPayment hook

// Countries that support Pay functionality
const payEnabledCountries = getPaySupportedCountries();

import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useKYCStore } from "@/store/kyc-store";
import { Institution, AppState } from "@/types";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { usePreFetchInstitutions } from "@/hooks/useExchangeRate";
import { useAssetBalance } from "@/hooks/useAssetBalance";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useBillPayment, PaymentStep } from "@/hooks/useBillPayment";
import {
  OrderStep,
  ChainTypes,
  Transfer,
  Quote,
  Country,
  GetBusinessAccountNameRequest,
  GetBusinessAccountNameResponse,
} from "@/types";
import useEVMPay from "@/onchain/useEVMPay";
import Image from "next/image";
import {
  ExchangeRateSkeleton,
  CryptoAmountSkeleton,
} from "@/components/ui/skeleton";
import FeeSummary, { FeeSummarySkeleton } from "./fee-summary";
import { KYCVerificationModal } from "../modals/KYCVerificationModal";
import { toast } from "sonner";
import { getBusinessAccountName } from "@/actions/transfer";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

export function PaymentInterface() {
  const {
    country,
    asset,
    updateSelection,
    paymentMethod,
    billTillPayout,
    institution,
    appState,
  } = useUserSelectionStore();

  const { amount, setAmount, setIsValid, setFiatAmount } = useAmountStore();

  const { currentNetwork, setCurrentNetwork } = useNetworkStore();

  // Quote and Transfer stores for global state management
  const { setQuote } = useQuoteStore();
  const { setTransfer, setTransactionHash } = useTransferStore();

  // Get wallet connection info
  const { address, isConnected, chainId } = useWalletGetInfo();

  // EVM payment hook for blockchain transactions
  const { payWithEVM, isLoading: isEVMLoading } = useEVMPay();

  // Local loading state for blockchain transaction (like TransactionReviewModal)
  const [blockchainLoading, setBlockchainLoading] = useState(false);

  // Get asset balance using the reusable hook
  const { currentBalance, isLoading: isBalanceLoading } = useAssetBalance(
    asset || null
  );

  // Get all country exchange rates using optimized hook
  // This pre-fetches rates for all supported countries to avoid individual API calls
  const {
    data: allExchangeRates,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
  } = useAllCountryExchangeRates({
    orderType: "selling",
    providerType: paymentMethod || "momo", // Default to momo for Pay interface
  });

  // Get current country's exchange rate from cached data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !allExchangeRates) return undefined;
    return allExchangeRates[country.countryCode];
  }, [country?.countryCode, allExchangeRates]);

  // Pre-fetch institutions for all supported countries
  // This ensures institutions are ready when users select a country

  // Bill payment mutation
  const billPaymentMutation = useBillPayment();

  // Get step-specific messages with all loading states
  const getStepMessage = (step: PaymentStep): string => {
    // Show blockchain transaction status when in progress
    if (blockchainLoading || isEVMLoading) return "Confirming transaction...";

    switch (step) {
      case "creating-quote":
        return "Checking rates...";
      case "initiating-transfer":
        return "Setting up payment...";
      case "opening-wallet":
        return "Opening in Wallet...";
      case "completed":
        return "Payment Complete!";
      case "error":
        return "Payment Failed";
      default:
        return "Processing...";
    }
  };

  const [selectedPaymentType, setSelectedPaymentType] = useState("Paybill");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [kycTriggered, setKycTriggered] = useState(false);
  const [swipeButtonReset, setSwipeButtonReset] = useState(false);

  // Account details fetching
  const getAccountNumberForFetching = () => {
    switch (selectedPaymentType) {
      case "Buy Goods":
        return billTillPayout?.tillNumber;
      case "Paybill":
        return billTillPayout?.billNumber;
      // Send Money doesn't support account name lookup via API
      default:
        return null;
    }
  };

  const accountNumber = getAccountNumberForFetching();

  // Debounce the account number to avoid API calls while user is typing
  const debouncedAccountNumber = useDebounce(accountNumber, 800); // 800ms delay

  // Only fetch if account number is valid and user has stopped typing
  const shouldFetchAccountDetails = Boolean(
    debouncedAccountNumber &&
      debouncedAccountNumber.length >= 5 && // Increased minimum length for better validation
      debouncedAccountNumber === accountNumber && // Ensure user has stopped typing
      /^\d+$/.test(debouncedAccountNumber) // Ensure it's only digits
  );

  const {
    data: accountDetails,
    isLoading: isLoadingAccountDetails,
    error: accountDetailsError,
    refetch: refetchAccountDetails,
  } = useQuery({
    queryKey: [
      "business-account-details",
      debouncedAccountNumber,
      selectedPaymentType,
    ],
    queryFn: async () => {
      if (!debouncedAccountNumber || !selectedPaymentType) return null;

      let accountType: "till" | "paybill";

      switch (selectedPaymentType) {
        case "Buy Goods":
          accountType = "till";
          break;
        case "Paybill":
          accountType = "paybill";
          break;
        default:
          return null; // Send Money doesn't support API lookup
      }

      const payload: GetBusinessAccountNameRequest = {
        accountNumber: debouncedAccountNumber,
        accountType: accountType,
      };

      const response = await getBusinessAccountName({
        accountNumber: debouncedAccountNumber,
        accountType: payload.accountType,
      });
      return response.data as GetBusinessAccountNameResponse;
    },
    enabled: shouldFetchAccountDetails,
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const isProcessing = appState === AppState.Processing;

  // Get KYC data
  const { kycData } = useKYCStore();

  // Reset app state to Idle on component mount to prevent stuck Processing state
  useEffect(() => {
    if (appState === AppState.Processing) {
      updateSelection({
        appState: AppState.Idle,
        orderStep: OrderStep.Initial,
      });
    }
  }, []); // Empty dependency array - only run on mount

  // Handle KYC completion and auto-retry payment
  useEffect(() => {
    if (kycTriggered && kycData && kycData.kycStatus === "VERIFIED") {
      setKycTriggered(false);
      setShowKYCModal(false);
      // Auto-retry the payment after KYC completion
      setTimeout(() => {
        handleCreateBillQuote();
      }, 500); // Small delay to ensure state is updated
    }
  }, [kycTriggered, kycData]);

  // Check if payment type is supported for the current country
  const isPaymentTypeSupportedForCountry = (paymentType: string) => {
    if (!country?.name) return false;
    return isPaymentTypeSupported(country.name, paymentType);
  };

  // Reset payment type when country changes to countries that only support "Send Money"
  useEffect(() => {
    if (
      country?.name &&
      !isPaymentTypeSupported(country.name, "Buy Goods") &&
      selectedPaymentType !== "Send Money"
    ) {
      setSelectedPaymentType("Send Money");
    }
  }, [country?.name, selectedPaymentType]);

  // Pre-fetch exchange rates for all supported countries when component mounts
  // (No default country - user must select one)
  useEffect(() => {
    // This will trigger the useAllCountryExchangeRates hook to fetch rates
    // even before a country is selected, improving the user experience
  }, []);

  // Pre-fetch institutions for Kenya and Uganda on initial load for better UX
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: kenyaInstitutions } = usePreFetchInstitutions("KE", "sell");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: ugandaInstitutions } = usePreFetchInstitutions("UG", "sell");

  // Get available assets for the current network
  const availableAssets = useMemo(() => {
    if (!currentNetwork) return assets;

    return assets.filter((asset) => {
      const networkConfig = asset.networks[currentNetwork.name];
      return networkConfig && networkConfig.tokenAddress;
    });
  }, [currentNetwork]);

  // Set default asset to first available asset for the current network
  useEffect(() => {
    if (!asset || !currentNetwork) {
      const firstAvailableAsset = availableAssets[0];
      if (firstAvailableAsset) {
        updateSelection({ asset: firstAvailableAsset });
      }
    }
  }, [asset, currentNetwork, availableAssets, updateSelection]);

  // Auto-switch to available asset if current asset is not supported on selected network
  useEffect(() => {
    if (asset && currentNetwork && availableAssets.length > 0) {
      const isCurrentAssetAvailable = availableAssets.some(
        (availableAsset) => availableAsset.symbol === asset.symbol
      );

      if (!isCurrentAssetAvailable) {
        // Switch to first available asset
        updateSelection({ asset: availableAssets[0] });
      }
    }
  }, [asset, currentNetwork, availableAssets, updateSelection]);

  // Set default network to Base
  useEffect(() => {
    if (!currentNetwork && asset?.networks) {
      const baseNetwork = Object.values(asset.networks).find(
        (n) => n.name === "Base"
      );
      if (baseNetwork) {
        setCurrentNetwork(baseNetwork);
      }
    }
  }, [currentNetwork, asset, setCurrentNetwork]);

  // Initialize billTillPayout with default values if not set
  useEffect(() => {
    if (!billTillPayout) {
      updateSelection({
        billTillPayout: {
          tillNumber: "",
          billNumber: "",
          accountNumber: "",
          phoneNumber: "",
        },
      });
    }
  }, [billTillPayout, updateSelection]);

  // Helper function to update bill/till payout data
  const updateBillTillPayout = (updates: Partial<typeof billTillPayout>) => {
    updateSelection({
      billTillPayout: {
        ...billTillPayout,
        ...updates,
      },
    });
  };

  // Helper function to set amount for a specific country
  const setAmountForCountry = (selectedCountry: {
    fiatMinMax: { min: number };
  }) => {
    if (selectedCountry?.fiatMinMax?.min) {
      const newAmount = selectedCountry.fiatMinMax.min.toString();
      setAmount(newAmount);
    }
  };

  // Helper function to map payment type to request type and get account details
  const getTransferDetails = () => {
    switch (selectedPaymentType) {
      case "Buy Goods":
        return {
          requestType: "till" as const,
          accountName: accountDetails?.accountName || "OneRamp", // Use fetched account name or fallback
          accountNumber: billTillPayout?.tillNumber || "",
          businessNumber: undefined,
        };
      case "Paybill":
        return {
          requestType: "bill" as const,
          accountName: accountDetails?.accountName || "OneRamp", // Use fetched account name or fallback
          accountNumber: billTillPayout?.billNumber || "",
          businessNumber: billTillPayout?.accountNumber || "",
        };
      case "Send Money":
        // Format phone number with country code (same as select-institution component)
        const phoneNumber = billTillPayout?.phoneNumber || "";
        const phoneNumberWithoutLeadingZero = phoneNumber.replace(/^0+/, "");
        const fullPhoneNumber = country?.phoneCode
          ? `${country.phoneCode}${phoneNumberWithoutLeadingZero}`
          : phoneNumber;

        // return {
        //   requestType: "payout" as const,
        //   accountName:
        //     billTillPayout?.accountName || // Use manually entered account name
        //     institution?.name?.toLowerCase() ||
        //     "mtn", // Fallback to institution name, then default
        //   accountNumber: fullPhoneNumber,
        //   businessNumber: undefined,
        // };
        return {
          requestType: "payout" as const,
          // accountName: institution?.name?.toLowerCase() || "mtn", // Use selected institution name
          accountName:
            billTillPayout?.accountName || // Use manually entered account name
            institution?.name?.toLowerCase() ||
            "mtn", // Fallback to institution name, then default
          accountNumber: fullPhoneNumber,
          businessNumber: institution?.name?.toLowerCase() || "mtn",
        };
      default:
        return null;
    }
  };

  // Blockchain transaction functions
  const makeBlockchainTransaction = async (
    quote: Quote,
    transfer: Transfer
  ) => {
    if (!asset || !currentNetwork || !quote || !transfer) {
      return;
    }

    // Debug the quote object to see its structure
    // Check if we're on the correct network
    if (chainId !== currentNetwork.chainId) {
      return;
    }

    const networkName = currentNetwork.name;
    const contractAddress = asset.networks[networkName]?.tokenAddress;

    if (!contractAddress) {
      return;
    }

    console.log("Initiating blockchain transaction...");
    updateSelection({ appState: AppState.Processing });
    setBlockchainLoading(true); // Set local loading state

    try {
      const recipient = transfer.transferAddress;

      // Use cryptoAmount for fiat-to-crypto transactions (Pay interface)
      if (!quote.cryptoAmount) {
        updateSelection({ appState: AppState.Idle });
        return;
      }

      // const fullAmount = Number(quote.cryptoAmount) + Number(quote.fee);

      const transactionPayload = {
        recipient,
        amount: quote.cryptoAmount,
        tokenAddress: contractAddress,
      };

      payWithEVM(transactionPayload, handleEVMPaySuccess, handleEVMPayFailed);
    } catch (error) {
      console.error("Error in makeBlockchainTransaction:", error);
      updateSelection({ appState: AppState.Idle });
    }
  };

  const handleEVMPaySuccess = async (txHash: string) => {
    // Get transfer from store
    const currentTransfer = useTransferStore.getState().transfer;

    if (!currentTransfer?.transferId || !txHash) {
      setBlockchainLoading(false);
      updateSelection({ appState: AppState.Idle });
      return;
    }

    // Store transaction hash
    setTransactionHash(txHash);

    // Reset loading states and transition to payment processing
    setBlockchainLoading(false);
    updateSelection({
      orderStep: OrderStep.ProcessingPayment,
      appState: AppState.Idle,
    });
  };

  const handleEVMPayFailed = (error: Error) => {
    setBlockchainLoading(false);
    updateSelection({ appState: AppState.Idle });
    return error;
  };

  // Function to create bill quote and transfer using React Query
  const handleCreateBillQuote = () => {
    if (!country) {
      return;
    }
    if (!asset) {
      return;
    }
    if (!currentNetwork) {
      return;
    }
    if (!amount) {
      return;
    }
    if (!isAmountValidForCountry) {
      return;
    }
    if (!isConnected) {
      return;
    }
    if (!address) {
      return;
    }

    // Verify KYC before proceeding with payment
    if (kycData && kycData.kycStatus !== "VERIFIED") {
      // Reset transaction state immediately to prevent SwipeToPayButton from staying in submission mode
      updateSelection({
        appState: AppState.Idle,
        orderStep: OrderStep.Initial,
      });
      billPaymentMutation.reset();
      setBlockchainLoading(false);

      // Reset swipe button to roll back to initial position
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100); // Reset the flag after triggering

      // Set flag to indicate KYC was triggered
      setKycTriggered(true);
      setShowKYCModal(true);
      toast.error("KYC verification required");
      return;
    }

    // Additional check for rejected or in-review KYC
    if (
      kycData?.kycStatus === "REJECTED" ||
      kycData?.kycStatus === "IN_REVIEW"
    ) {
      // Reset transaction state immediately
      updateSelection({
        appState: AppState.Idle,
        orderStep: OrderStep.Initial,
      });
      billPaymentMutation.reset();
      setBlockchainLoading(false);

      // Reset swipe button to roll back to initial position
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100);

      setKycTriggered(true);
      setShowKYCModal(true);
      toast.error(
        "KYC verification is not complete. Please wait for verification to finish."
      );
      return;
    }

    // If KYC was previously triggered and now completed, proceed with payment
    if (kycTriggered) {
      setKycTriggered(false); // Reset the flag
    }

    // Validate payment-specific details
    const transferDetails = getTransferDetails();

    if (!transferDetails) {
      return;
    }

    if (!transferDetails.accountNumber) {
      return;
    }

    // Update global state to processing
    updateSelection({
      appState: AppState.Processing,
      orderStep: OrderStep.Initial,
      accountNumber: transferDetails.accountNumber,
    });

    // Ensure payment method is set
    if (!paymentMethod) {
      updateSelection({ paymentMethod: "momo" });
    }

    // Create payloads for the mutation
    const quotePayload = {
      fiatType: country.currency,
      cryptoType: asset.symbol,
      region: country.countryCode,
      fiatAmount: amount,
      network: currentNetwork.name.toLowerCase(),
      country: country.countryCode,
      address: address,
      rawAmount: amount,
    };

    // Trigger the mutation with success/error handlers
    billPaymentMutation.mutate(
      {
        quotePayload,
        transferDetails,
      },
      {
        onSuccess: (data) => {
          // Update global state with quote (but don't change order step yet)
          if (data.quote) {
            setQuote(data.quote.quote);
            // Don't set OrderStep.GotQuote - this would render TransactionReviewModal
            // We'll only set OrderStep.GotTransfer after successful blockchain transaction
          }

          // Update global state with transfer and initiate blockchain transaction
          if (data.transfer) {
            setTransfer(data.transfer);

            // Check if we have EVM network and can proceed with blockchain transaction
            if (
              currentNetwork?.type === ChainTypes.EVM &&
              data.quote &&
              data.transfer
            ) {
              // Keep appState as Processing during blockchain transaction
              updateSelection({ appState: AppState.Processing });
              // Pass the actual quote object (data.quote), not the full response
              makeBlockchainTransaction(data.quote.quote, data.transfer);
            } else {
              // For non-EVM networks or if missing data, go directly to GotTransfer
              updateSelection({
                orderStep: OrderStep.GotTransfer,
                appState: AppState.Idle,
              });
            }
          }
        },
        onError: (error) => {
          console.error("Payment mutation error:", error);
          updateSelection({
            appState: AppState.Idle,
            orderStep: OrderStep.Initial,
          });
        },
      }
    );
  };

  // Calculate crypto amount based on fiat amount and exchange rate
  const calculatedCryptoAmount = useMemo(() => {
    if (!country || !amount) return "0.00";
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "0.00";

    // Use the exchange rate from API if available, otherwise use fallback from country data
    const rate = exchangeRate?.exchange || country.exchangeRate;
    const convertedAmount = numericAmount / rate;
    return convertedAmount.toFixed(4);
  }, [amount, country, exchangeRate]);

  // Validate amount based on country limits
  const isAmountValidForCountry = useMemo(() => {
    if (!country || !amount) return true;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return false;

    return (
      numericAmount >= country.fiatMinMax.min &&
      numericAmount <= country.fiatMinMax.max
    );
  }, [amount, country]);

  // Update amount validity
  useEffect(() => {
    setIsValid(isAmountValidForCountry);
    if (calculatedCryptoAmount) {
      setFiatAmount(amount);
    }
  }, [
    isAmountValidForCountry,
    calculatedCryptoAmount,
    amount,
    setIsValid,
    setFiatAmount,
  ]);

  const handlePaymentComplete = () => {
    // Use the same validation and trigger the mutation
    handleCreateBillQuote();
  };

  const handleCountrySelect = (selectedCountry: Country) => {
    // Reset amount to the minimum for the new country
    setAmountForCountry(selectedCountry);

    updateSelection({
      country: selectedCountry,
      institution: undefined,
      accountNumber: undefined,
      address: undefined,
    });

    setShowCountryModal(false);
  };

  const handleAssetSelect = (selectedAsset: string) => {
    const assetData = availableAssets.find((a) => a.symbol === selectedAsset);
    if (assetData) {
      updateSelection({ asset: assetData });
    }
  };

  const handleNetworkSelect = (networkName: string) => {
    // Find the network in the asset's networks or use current network
    if (asset?.networks) {
      const network = Object.values(asset.networks).find(
        (n) => n.name === networkName
      );
      if (network) {
        setCurrentNetwork(network);
        updateSelection({ paymentMethod: "momo" }); // Default to mobile money for Pay
      }
    }
  };

  const handleInstitutionSelect = (institution: Institution) => {
    updateSelection({
      institution: institution,
      paymentMethod: "momo",
    });
    setShowInstitutionModal(false);
  };

  const handleCancelTransaction = () => {
    // Reset all transaction-related states
    updateSelection({
      appState: AppState.Idle,
      orderStep: OrderStep.Initial,
    });
    billPaymentMutation.reset();
    setBlockchainLoading(false);
  };

  const resetPaymentState = () => {
    // Reset payment-related states when KYC is cancelled
    updateSelection({
      appState: AppState.Idle,
      orderStep: OrderStep.Initial,
    });
    billPaymentMutation.reset();
    setBlockchainLoading(false);
    setShowKYCModal(false);
    setKycTriggered(false); // Reset KYC trigger flag

    // Reset swipe button to roll back to initial position
    setSwipeButtonReset(true);
    setTimeout(() => setSwipeButtonReset(false), 100); // Reset the flag after triggering
  };

  const renderPaymentFields = () => {
    switch (selectedPaymentType) {
      case "Buy Goods":
        return (
          <div className="space-y-3">
            <div className="text-gray-400 text-sm sm:text-base">
              <h3>Enter Till Number</h3>
            </div>
            <div className="relative">
              <Input
                value={billTillPayout?.tillNumber || ""}
                type="number"
                onChange={(e) =>
                  updateBillTillPayout({ tillNumber: e.target.value })
                }
                className="!bg-neutral-800 !border-neutral-600 text-base text-white h-12 rounded-lg px-4 pr-12"
                placeholder="Enter till number"
                disabled={isProcessing}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
              />
              {isLoadingAccountDetails &&
                debouncedAccountNumber === billTillPayout?.tillNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              {!isLoadingAccountDetails &&
                accountDetails &&
                debouncedAccountNumber === billTillPayout?.tillNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 text-green-400">✓</div>
                  </div>
                )}
            </div>
          </div>
        );

      case "Paybill":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Paybill Number</h3>
              </div>
              <div className="relative">
                <Input
                  value={billTillPayout?.billNumber || ""}
                  type="number"
                  onChange={(e) =>
                    updateBillTillPayout({ billNumber: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12"
                  placeholder="Enter paybill number"
                  disabled={isProcessing}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
                {isLoadingAccountDetails &&
                  debouncedAccountNumber === billTillPayout?.billNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                {!isLoadingAccountDetails &&
                  accountDetails &&
                  debouncedAccountNumber === billTillPayout?.billNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 text-green-400">✓</div>
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Business Number</h3>
              </div>
              <div className="relative">
                <Input
                  value={billTillPayout?.accountNumber || ""}
                  type="number"
                  onChange={(e) =>
                    updateBillTillPayout({ accountNumber: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12"
                  placeholder="Enter account number"
                  disabled={isProcessing}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>
            </div>
          </div>
        );

      case "Send Money":
        return (
          <div className="space-y-4">
            {/* Institution Selection for countries that require it */}
            {country?.name && requiresInstitutionSelection(country.name) && (
              <div className="space-y-3">
                <div className="text-gray-400 text-sm sm:text-base">
                  <h3>Select Mobile Money Provider</h3>
                </div>
                <Button
                  variant="ghost"
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 w-full flex items-center justify-between border hover:!bg-neutral-700"
                  onClick={() => setShowInstitutionModal(true)}
                  disabled={isProcessing}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white">
                      {institution?.name || "Select provider"}
                    </span>
                  </div>
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
              </div>
            )}

            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Enter Telephone Number</h3>
              </div>
              <div className="relative">
                <Input
                  value={billTillPayout?.phoneNumber || ""}
                  type="tel"
                  onChange={(e) =>
                    updateBillTillPayout({ phoneNumber: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4"
                  placeholder=" 0700 000 000"
                  disabled={isProcessing}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>
            </div>

            {/* Account Name Input for Send Money */}
            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Enter Account Name</h3>
              </div>
              <div className="relative">
                <Input
                  value={billTillPayout?.accountName || ""}
                  type="text"
                  onChange={(e) =>
                    updateBillTillPayout({ accountName: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4"
                  placeholder="Enter account holder name"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-2xl overflow-hidden p-4 sm:p-5 space-y-3 sm:space-y-4 min-h-[400px]">
      {/* Pay Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl">Pay</h2>
        {country && (
          <div className="flex items-center gap-2">
            <Select
              value={asset?.symbol || availableAssets[0]?.symbol || "USDC"}
              onValueChange={handleAssetSelect}
              disabled={isProcessing}
            >
              <SelectTrigger className="bg-transparent border-none text-sm sm:text-base text-white p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 !border-neutral-700 border">
                {availableAssets.map((assetItem) => (
                  <SelectItem
                    key={assetItem.symbol}
                    value={assetItem.symbol}
                    className="focus:bg-neutral-800 focus:text-white data-[highlighted]:bg-neutral-800 data-[highlighted]:text-white"
                  >
                    <div className="flex items-center gap-3 p-1">
                      <Image
                        src={assetItem.logo}
                        alt={assetItem.symbol}
                        className="w-4 h-4"
                        width={16}
                        height={16}
                      />
                      <h1 className="text-sm sm:text-base text-white">
                        {assetItem.symbol}
                      </h1>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Country Selection */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-t-2xl rounded-b-lg px-4 w-full flex items-center justify-between border hover:!bg-neutral-700"
          onClick={() => setShowCountryModal(true)}
          disabled={isProcessing}
        >
          <div className="flex items-center gap-3">
            {country ? (
              <>
                <Image
                  src={country.logo}
                  alt={country.name}
                  className="w-6 h-4 rounded-sm object-cover"
                  width={24}
                  height={16}
                />
                <span className="text-white">{country.name}</span>
              </>
            ) : (
              <span className="text-neutral-400">Select Country</span>
            )}
          </div>
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
      </div>

      {/* Progressive UI - Only show when country is selected */}
      {country && (
        <>
          {/* Payment Type Buttons */}
          {(() => {
            // For countries with multiple payment types, show grid
            if (
              country?.name &&
              isPaymentTypeSupported(country.name, "Buy Goods")
            ) {
              return (
                <div className="grid grid-cols-3 gap-3">
                  {["Send Money", "Paybill", "Buy Goods"].map((type) => {
                    const isSupported = isPaymentTypeSupportedForCountry(type);
                    const isSelected = selectedPaymentType === type;

                    return (
                      <Button
                        key={type}
                        variant="ghost"
                        disabled={!isSupported || isProcessing}
                        className={`h-12 rounded-lg text-sm sm:text-base font-medium transition-all w-full ${
                          isSelected && isSupported
                            ? "!bg-neutral-600 !border-neutral-500 text-white shadow-sm"
                            : isSupported
                            ? "!bg-neutral-800 !border-neutral-600 text-gray-300 hover:!bg-neutral-700 hover:text-white border"
                            : "!bg-neutral-900 !border-neutral-700 text-gray-500 border cursor-not-allowed opacity-50"
                        }`}
                        onClick={() =>
                          isSupported && setSelectedPaymentType(type)
                        }
                      >
                        <h2 className="text-xs sm:text-sm">{type}</h2>
                      </Button>
                    );
                  })}
                </div>
              );
            }

            // For countries with only "Send Money", show full width button
            if (
              country?.name &&
              !isPaymentTypeSupported(country.name, "Buy Goods")
            ) {
              return (
                <div className="w-full">
                  <Button
                    variant="ghost"
                    className="h-12 rounded-lg text-sm sm:text-base font-medium transition-all w-full !bg-neutral-600 !border-neutral-500 text-white shadow-sm"
                    disabled={isProcessing}
                  >
                    <h2 className="text-xs sm:text-sm">Send Money</h2>
                  </Button>
                </div>
              );
            }

            // For other countries, only show "Send Money" with full width
            return (
              <div className="w-full">
                <Button
                  variant="ghost"
                  className="h-12 rounded-lg text-sm sm:text-base font-medium transition-all w-full !bg-neutral-600 !border-neutral-500 text-white shadow-sm"
                  disabled={isProcessing}
                >
                  <h2 className="text-xs sm:text-sm">Send Money</h2>
                </Button>
              </div>
            );
          })()}

          {/* Dynamic Payment Fields */}
          <div className="min-h-[80px]">{renderPaymentFields()}</div>

          {/* Amount Section */}
          <div className="space-y-3">
            <div className="text-gray-400 text-sm sm:text-base">
              <h3>Enter Amount in {country?.currency || "KES"}</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xl sm:text-2xl font-medium">
                {country?.currency || "KES"}
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right bg-transparent !font-extrabold border-none text-2xl sm:text-3xl text-white p-0 h-auto"
                placeholder="0"
                disabled={isProcessing}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
              />
            </div>
            <div className="h-px bg-gray-700"></div>

            {!isAmountValidForCountry && country && (
              <div className="text-red-400 text-xs">
                <p>
                  Amount should be between{" "}
                  {country.fiatMinMax.min.toLocaleString()} and{" "}
                  {country.fiatMinMax.max.toLocaleString()} {country.currency}
                </p>
              </div>
            )}
          </div>

          {/* You'll Pay Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-300 text-sm sm:text-base">
                You&apos;ll pay
              </h3>
              <div className="flex items-center gap-2 text-gray-400">
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={currentNetwork?.name || "Base"}
                  onValueChange={handleNetworkSelect}
                  disabled={true}
                >
                  <SelectTrigger className="bg-transparent border-none text-sm sm:text-base text-white p-0 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 !border-neutral-700 border">
                    {asset?.networks &&
                      Object.values(asset.networks).map((network) => (
                        <SelectItem
                          key={network.name}
                          value={network.name}
                          className="focus:bg-neutral-800 focus:text-white data-[highlighted]:bg-neutral-800 data-[highlighted]:text-white"
                        >
                          <div className="flex items-center gap-3 p-1">
                            <Image
                              src={network.logo}
                              alt={network.name}
                              className="w-4 h-4"
                              width={16}
                              height={16}
                            />
                            <h1 className="text-sm sm:text-base text-white">
                              {network.name}
                            </h1>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                {isExchangeRateLoading ? (
                  <CryptoAmountSkeleton />
                ) : (
                  <>
                    <div className="text-xl sm:text-2xl">
                      <p>{Number(calculatedCryptoAmount).toFixed(2)}</p>
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">
                      <p>
                        Balance: {isBalanceLoading ? "..." : currentBalance}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isExchangeRateLoading ? (
              <ExchangeRateSkeleton />
            ) : (
              <div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
                <p>
                  1 {asset?.symbol || "USD"} ={" "}
                  {exchangeRate
                    ? exchangeRate.exchange.toLocaleString()
                    : country?.exchangeRate
                    ? country.exchangeRate.toLocaleString() + " (est.)"
                    : "--"}{" "}
                  {country?.currency || ""}
                </p>
                <p>Payment usually completes in 30s</p>
              </div>
            )}
          </div>

          {/* Exchange Rate Error Display */}
          {exchangeRateError && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Unable to fetch current rates. Using fallback rates.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 p-1 h-auto"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Account Details Error Display */}
          {accountDetailsError && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-yellow-400 text-xs">
                  ⚠️ Unable to fetch account details. <br />
                  Please verify the account number.
                </p>
                <Button
                  onClick={() => refetchAccountDetails()}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 p-1 h-auto"
                  disabled={isLoadingAccountDetails}
                >
                  {isLoadingAccountDetails ? "Retrying..." : "Retry"}
                </Button>
              </div>
            </div>
          )}

          {/* Payment Error Display */}
          {billPaymentMutation.isError && (
            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-red-400 text-sm">
                  ❌ Payment failed: {billPaymentMutation.error?.message}
                </p>
                <Button
                  onClick={() => billPaymentMutation.reset()}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Success Display */}
          {billPaymentMutation.currentStep === "opening-wallet" && (
            <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-green-400 text-sm">
                  ✅ Ready for wallet payment!
                </p>
                <Button
                  onClick={() => billPaymentMutation.reset()}
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300 p-1 h-auto"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {isExchangeRateLoading ? (
            <FeeSummarySkeleton />
          ) : (
            <FeeSummary
              fiatAmount={amount}
              fiatCurrency={country?.currency || "KES"}
              cryptoAmount={calculatedCryptoAmount}
              cryptoCurrency={asset?.symbol || "USDC"}
              exchangeRateData={exchangeRate}
              accountDetails={accountDetails || undefined}
              isLoadingAccountDetails={isLoadingAccountDetails}
            />
          )}

          {/* Cancel Transaction Button - Only show when processing */}

          {/* Swipe to Pay Button */}
          <SwipeToPayButton
            onPaymentComplete={handlePaymentComplete}
            isLoading={
              billPaymentMutation.isPending || blockchainLoading || isEVMLoading
            }
            stepMessage={
              // Show specific message when account details are being fetched
              (selectedPaymentType === "Buy Goods" ||
                selectedPaymentType === "Paybill") &&
              isLoadingAccountDetails
                ? "Verifying account details..."
                : (selectedPaymentType === "Buy Goods" ||
                    selectedPaymentType === "Paybill") &&
                  Boolean(debouncedAccountNumber) &&
                  debouncedAccountNumber!.length >= 5 &&
                  !accountDetails &&
                  !isLoadingAccountDetails
                ? "Account verification failed"
                : getStepMessage(billPaymentMutation.currentStep)
            }
            disabledMessage={
              // Show specific message when account details are missing
              (selectedPaymentType === "Buy Goods" ||
                selectedPaymentType === "Paybill") &&
              isLoadingAccountDetails
                ? "Verifying account..."
                : (selectedPaymentType === "Buy Goods" ||
                    selectedPaymentType === "Paybill") &&
                  Boolean(debouncedAccountNumber) &&
                  debouncedAccountNumber!.length >= 5 &&
                  !accountDetails &&
                  !isLoadingAccountDetails
                ? "Account verification failed"
                : (selectedPaymentType === "Buy Goods" ||
                    selectedPaymentType === "Paybill") &&
                  !accountDetails
                ? "Verify account details"
                : "Complete Form"
            }
            disabled={
              !country ||
              !asset ||
              !currentNetwork ||
              !amount ||
              !isAmountValidForCountry ||
              !isConnected ||
              !address ||
              (!!country?.name &&
                requiresInstitutionSelection(country.name) &&
                !institution) ||
              isProcessing ||
              // Prevent activation if account details are still fetching for Buy Goods/Paybill
              ((selectedPaymentType === "Buy Goods" ||
                selectedPaymentType === "Paybill") &&
                isLoadingAccountDetails) ||
              // Prevent activation if account details are required but not fetched for Buy Goods/Paybill
              ((selectedPaymentType === "Buy Goods" ||
                selectedPaymentType === "Paybill") &&
                Boolean(debouncedAccountNumber) &&
                debouncedAccountNumber!.length >= 5 &&
                !accountDetails &&
                !isLoadingAccountDetails)
            }
            reset={swipeButtonReset}
          />

          {isProcessing && (
            <div className="flex justify-center">
              <Button
                onClick={handleCancelTransaction}
                variant="ghost"
                className="!text-red-400 hover:!text-red-300 text-sm font-medium transition-colors"
              >
                Cancel Transaction
              </Button>
            </div>
          )}
        </>
      )}

      {/* Country Selection Modal */}
      <CountryCurrencyModal
        open={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onSelect={handleCountrySelect}
        filteredCountries={payEnabledCountries}
      />

      {/* Institution Selection Modal */}
      {country && (
        <InstitutionModal
          open={showInstitutionModal}
          onClose={() => setShowInstitutionModal(false)}
          selectedInstitution={institution || null}
          onSelect={handleInstitutionSelect}
          country={country.countryCode}
          buy={false}
        />
      )}

      {/* KYC Verification Modal */}
      <KYCVerificationModal
        open={showKYCModal}
        onClose={resetPaymentState}
        kycLink={kycData?.message?.link || null}
      />
    </div>
  );
}
