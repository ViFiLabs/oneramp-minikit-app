"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { SwipeToPayButton } from "./components/swipe-to-pay";
import { CountryCurrencyModal } from "@/src/components/modals/CountryCurrencyModal";
import { InstitutionModal } from "@/src/components/modals/InstitutionModal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUnifiedPaymentFormSchema,
  PaymentFormData,
} from "./schemas/payment-form.schema";

// Import app data and stores
import { assets } from "@/data/currencies";
import {
  getPaySupportedCountries,
  isPaymentTypeSupported,
  requiresInstitutionSelection,
  countries,
} from "@/data/countries";

// Note: Actions are now handled by the useBillPayment hook

// Countries that support Pay functionality
const payEnabledCountries = getPaySupportedCountries();

import { useUserSelectionStore } from "@/src/store/user-selection";
import { useAmountStore } from "@/src/store/amount-store";
import { useNetworkStore } from "@/src/store/network";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useKYCStore } from "@/src/store/kyc-store";
import { Institution, AppState } from "@/types";
import { useAssetBalance } from "@/src/hooks/useAssetBalance";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useBillPayment, PaymentStep } from "@/src/hooks/useBillPayment";
import {
  OrderStep,
  ChainTypes,
  Transfer,
  Quote,
  Country,
  GetBusinessAccountNameRequest,
  GetBusinessAccountNameResponse,
} from "@/types";
import useEVMPay from "@/src/hooks/useEVMPay";
import Image from "next/image";
import {
  ExchangeRateSkeleton,
  CryptoAmountSkeleton,
} from "@/src/components/ui/skeleton";
import FeeSummary, {
  FeeSummarySkeleton,
} from "@/src/components/payment/fee-summary";
import { toast } from "sonner";
import { getBusinessAccountName } from "@/src/actions/transfer";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/src/hooks/useDebounce";
import {
  calculateCashoutFee,
  supportsCashoutFees,
  getUgandaCashoutBreakdown,
} from "@/src/utils/cashout-fees";
import { usePayRecipientStore } from "@/src/store/pay-recipient-store";
import { getNgnToLocalRate } from "@/src/lib/exchange-rates-data";
import {
  useInstitutionsSuspense,
  useRatesSuspense,
} from "./hooks/use-payinterface-suspense";
import { useKYCStatusSuspense } from "@/src/hooks/useKYCSuspense";
import { verifyKYC } from "@/src/utils/kyc-verification";

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

  const { savePaybill, saveBuyGoods, saveSendMoney, getPaymentData } =
    usePayRecipientStore();

  const {
    data: exchangeRates,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
  } = useRatesSuspense({
    orderType: "selling",
    providerType: paymentMethod || "momo",
  });

  const institutionsSuspenseData = useInstitutionsSuspense({
    method: "sell",
  });

  // Extract institutions for selected country from suspense data
  const institutionsForCountry = useMemo(() => {
    if (!country?.countryCode || !institutionsSuspenseData.data) return [];
    return institutionsSuspenseData.data[country.countryCode] || [];
  }, [country?.countryCode, institutionsSuspenseData.data]);

  const {
    amount,
    setAmount,
    setIsValid,
    setFiatAmount,
    includeCashoutFees,
    cashoutFeeAmount,
    setIncludeCashoutFees,
    setCashoutFeeAmount,
  } = useAmountStore();

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

  // Extract exchange rate for selected country from the suspense data
  const exchangeRate = useMemo(() => {
    if (!country?.countryCode || !exchangeRates) return undefined;
    return exchangeRates[country.countryCode];
  }, [country?.countryCode, exchangeRates]);

  // Extract Nigeria rate for cNGN cross-rate conversions
  const nigeriaRate = useMemo(() => {
    if (!exchangeRates) return undefined;
    return exchangeRates["NG"];
  }, [exchangeRates]);

  const isCngnAsset = useMemo(
    () => (asset?.symbol || "").toUpperCase() === "CNGN",
    [asset?.symbol]
  );

  const effectiveRate = useMemo(() => {
    const baseRate = exchangeRate?.exchange;
    const countryCode = country?.countryCode;
    if (!baseRate || !countryCode) return undefined;

    if (!isCngnAsset) return baseRate;

    const fixed = getNgnToLocalRate(countryCode);
    if (fixed && fixed > 0) return fixed;

    const nigeriaAPI = nigeriaRate?.exchange;
    const nigeriaFallback = countries.find(
      (c) => c.countryCode === "NG"
    )?.exchangeRate;
    const ngRate = nigeriaAPI || nigeriaFallback;
    if (!ngRate || ngRate <= 0) return undefined;
    return baseRate / ngRate;
  }, [
    exchangeRate?.exchange,
    isCngnAsset,
    country?.countryCode,
    nigeriaRate?.exchange,
  ]);

  // Combine hook error with country-specific rate availability check
  const finalExchangeRateError = useMemo(() => {
    // If there's an error from the hook, use that
    if (exchangeRateError) return exchangeRateError;

    // Otherwise, check if the selected country's rate is missing
    if (country?.countryCode && !exchangeRate) {
      return new Error("Exchange rate not available for selected country");
    }

    return undefined;
  }, [exchangeRateError, country?.countryCode, exchangeRate]);

  // Defensive: ensure unsupported country/asset from other tabs don't bleed into Pay
  const supportedCountryCodes = useMemo(
    () => new Set(payEnabledCountries.map((c) => c.countryCode)),
    []
  );

  const convertLocalToCngn = useCallback(
    (localAmount: number) => {
      if (!isCngnAsset) return null;
      if (!effectiveRate || effectiveRate <= 0) return null;

      // Convert Local → cNGN
      // The backend treats cNGN amounts as NGN-equivalent when converting to local
      // So the reverse is: Local → NGN-equivalent (which is cNGN)
      // effectiveRate is NGN → Local, so Local → NGN = localAmount / effectiveRate
      // Since backend treats cNGN as NGN-equivalent, we just divide by effectiveRate
      return localAmount / effectiveRate;
    },
    [isCngnAsset, effectiveRate]
  );

  useEffect(() => {
    if (country && !supportedCountryCodes.has(country.countryCode)) {
      updateSelection({
        country: undefined,
        institution: undefined,
        accountNumber: undefined,
      });
    }
  }, [country, supportedCountryCodes, updateSelection]);

  // (moved below availableAssets declaration)

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

  const [selectedPaymentType, setSelectedPaymentType] = useState<
    "Paybill" | "Buy Goods" | "Send Money"
  >("Paybill");
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [swipeButtonReset, setSwipeButtonReset] = useState(false);

  // Refs to prevent circular updates between form and store
  const isSyncingFromStore = useRef(false);
  const isUpdatingBillTillPayout = useRef(false);
  const hasInitializedBillTillPayout = useRef(false);

  // Create dynamic schema based on payment type and country
  const formSchema = useMemo(() => {
    if (!country) return null;
    return createUnifiedPaymentFormSchema({
      minAmount: country.fiatMinMax.min,
      maxAmount: country.fiatMinMax.max,
      requiresInstitution: requiresInstitutionSelection(country.name),
    });
  }, [country]);

  // Setup react-hook-form
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    formState: { errors, isValid: isFormValid },
    trigger,
  } = useForm<PaymentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: formSchema ? (zodResolver(formSchema) as any) : undefined,
    mode: "onChange",
    defaultValues: {
      selectedPaymentType: "Paybill",
      amount: amount || "",
      includeCashoutFees: includeCashoutFees || false,
      tillNumber: billTillPayout?.tillNumber || "",
      billNumber: billTillPayout?.billNumber || "",
      accountNumber: billTillPayout?.accountNumber || "",
      phoneNumber: billTillPayout?.phoneNumber || "",
      accountName: billTillPayout?.accountName || "",
    },
  });

  // Watch form values
  const formAmount = watch("amount");
  const formTillNumber = watch("tillNumber");
  const formBillNumber = watch("billNumber");
  const formAccountNumber = watch("accountNumber");
  const formPhoneNumber = watch("phoneNumber");
  const formAccountName = watch("accountName");
  const formIncludeCashoutFees = watch("includeCashoutFees");

  // Sync form amount with amount store (form is source of truth for user input)
  useEffect(() => {
    if (isSyncingFromStore.current) {
      // Reset flag and don't sync back
      isSyncingFromStore.current = false;
      return;
    }
    // Only sync if values differ and form has a value
    if (formAmount && formAmount !== amount) {
      setAmount(formAmount);
    }
  }, [formAmount, amount, setAmount]);

  // Sync form values with billTillPayout store ONLY on initial load or when country/payment type changes
  // Skip if we're currently updating from form (prevents circular updates)
  useEffect(() => {
    if (isUpdatingBillTillPayout.current) {
      return;
    }
    if (!billTillPayout) return;

    // Only sync on initial load or when we have new data that hasn't been synced yet
    if (!hasInitializedBillTillPayout.current) {
      // Initial sync: populate form from store
      if (billTillPayout.tillNumber) {
        setValue("tillNumber", billTillPayout.tillNumber, {
          shouldValidate: false,
        });
      }
      if (billTillPayout.billNumber) {
        setValue("billNumber", billTillPayout.billNumber, {
          shouldValidate: false,
        });
      }
      if (billTillPayout.accountNumber) {
        setValue("accountNumber", billTillPayout.accountNumber, {
          shouldValidate: false,
        });
      }
      if (billTillPayout.phoneNumber) {
        setValue("phoneNumber", billTillPayout.phoneNumber, {
          shouldValidate: false,
        });
      }
      if (billTillPayout.accountName) {
        setValue("accountName", billTillPayout.accountName, {
          shouldValidate: false,
        });
      }
      hasInitializedBillTillPayout.current = true;
    }
  }, [billTillPayout, setValue]);

  // Reset initialization flag when country or payment type changes (to allow re-prefilling)
  useEffect(() => {
    hasInitializedBillTillPayout.current = false;
  }, [country?.countryCode, selectedPaymentType]);

  // Update amount store validity from form validity (exceedsBalance check will be added later)
  useEffect(() => {
    // Form validation will handle basic validation, exceedsBalance check is done separately
    if (isFormValid !== undefined) {
      // Will be combined with exceedsBalance check in a later effect
    }
  }, [isFormValid]);

  // Sync cashout fees
  useEffect(() => {
    if (
      formIncludeCashoutFees !== undefined &&
      formIncludeCashoutFees !== includeCashoutFees
    ) {
      setIncludeCashoutFees(formIncludeCashoutFees);
    }
  }, [formIncludeCashoutFees, includeCashoutFees, setIncludeCashoutFees]);

  // Account details fetching
  const getAccountNumberForFetching = () => {
    switch (selectedPaymentType) {
      case "Buy Goods":
        return formTillNumber || billTillPayout?.tillNumber;
      case "Paybill":
        return formBillNumber || billTillPayout?.billNumber;
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
  const { setShowKYCModal } = useKYCStore();

  const { data: kycData } = useKYCStatusSuspense({ address: address || "" });

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
  // useEffect(() => {
  //   if (kycTriggered && kycData && kycData.kycStatus === "VERIFIED") {
  //     setKycTriggered(false);
  //     setShowKYCModal(false);
  //     // Auto-retry the payment after KYC completion
  //     setTimeout(() => {
  //       handleCreateBillQuote();
  //     }, 500); // Small delay to ensure state is updated
  //   }
  // }, [kycTriggered, kycData]);

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

  // Institutions are now fetched via suspense hook above

  // Get available assets for the current network
  const availableAssets = useMemo(() => {
    const allowedSymbols = new Set(["USDC", "cNGN"]);

    return assets.filter((asset) => {
      if (!allowedSymbols.has(asset.symbol)) return false;

      if (!currentNetwork) return true;

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

  // Calculate cashout fee when amount or includeCashoutFees changes
  useEffect(() => {
    if (country && supportsCashoutFees(country.name) && includeCashoutFees) {
      const numericAmount = parseFloat(amount) || 0;
      const fee = calculateCashoutFee(numericAmount, country.name);
      setCashoutFeeAmount(fee);
    } else {
      setCashoutFeeAmount(0);
    }
  }, [amount, includeCashoutFees, country, setCashoutFeeAmount]);

  // Reset cashout fees when switching away from Tanzania
  useEffect(() => {
    if (country && !supportsCashoutFees(country.name)) {
      setIncludeCashoutFees(false);
      setCashoutFeeAmount(0);
    }
  }, [country, setIncludeCashoutFees, setCashoutFeeAmount]);

  // Prefill payment data when country or payment type changes
  useEffect(() => {
    if (country?.countryCode) {
      const savedData = getPaymentData(country.countryCode);

      if (savedData) {
        switch (selectedPaymentType) {
          case "Paybill":
            if (savedData.paybill) {
              updateBillTillPayout({
                billNumber: savedData.paybill.billNumber || "",
                accountNumber: savedData.paybill.accountNumber || "",
              });
            }
            break;

          case "Buy Goods":
            if (savedData.buyGoods) {
              updateBillTillPayout({
                tillNumber: savedData.buyGoods.tillNumber || "",
              });
            }
            break;

          case "Send Money":
            if (savedData.sendMoney) {
              updateBillTillPayout({
                phoneNumber: savedData.sendMoney.phoneNumber || "",
                accountName: savedData.sendMoney.accountName || "",
              });
              if (savedData.sendMoney.institution) {
                updateSelection({
                  institution: savedData.sendMoney.institution,
                  paymentMethod: "momo",
                });
              }
            }
            break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.countryCode, selectedPaymentType, getPaymentData]);

  // Helper function to update bill/till payout data (now syncs with form)
  const updateBillTillPayout = useCallback(
    (updates: Partial<typeof billTillPayout>) => {
      if (!updates) return;

      const newData = {
        ...billTillPayout,
        ...updates,
      };

      // Set flag to prevent sync effect from triggering
      isUpdatingBillTillPayout.current = true;

      updateSelection({
        billTillPayout: newData,
      });

      // Sync with form values
      if (updates.tillNumber !== undefined) {
        setValue("tillNumber", updates.tillNumber, { shouldValidate: true });
      }
      if (updates.billNumber !== undefined) {
        setValue("billNumber", updates.billNumber, { shouldValidate: true });
      }
      if (updates.accountNumber !== undefined) {
        setValue("accountNumber", updates.accountNumber, {
          shouldValidate: true,
        });
      }
      if (updates.phoneNumber !== undefined) {
        setValue("phoneNumber", updates.phoneNumber, { shouldValidate: true });
      }
      if (updates.accountName !== undefined) {
        setValue("accountName", updates.accountName, { shouldValidate: true });
      }

      // Reset flag immediately after updates (using queueMicrotask to avoid setTimeout)
      queueMicrotask(() => {
        isUpdatingBillTillPayout.current = false;
      });

      // Save to persist store based on payment type and country
      if (country?.countryCode) {
        switch (selectedPaymentType) {
          case "Paybill":
            if (newData.billNumber || newData.accountNumber) {
              savePaybill(country.countryCode, {
                billNumber: newData.billNumber,
                accountNumber: newData.accountNumber,
              });
            }
            break;

          case "Buy Goods":
            if (newData.tillNumber) {
              saveBuyGoods(country.countryCode, {
                tillNumber: newData.tillNumber,
              });
            }
            break;

          case "Send Money":
            if (newData.phoneNumber || newData.accountName) {
              saveSendMoney(country.countryCode, {
                phoneNumber: newData.phoneNumber,
                accountName: newData.accountName,
                institution: institution,
              });
            }
            break;
        }
      }
    },
    [
      billTillPayout,
      country?.countryCode,
      selectedPaymentType,
      institution,
      updateSelection,
      setValue,
      savePaybill,
      saveBuyGoods,
      saveSendMoney,
    ]
  );

  // Helper function to set amount for a specific country
  const setAmountForCountry = useCallback(
    (selectedCountry: { fiatMinMax: { min: number } }) => {
      if (selectedCountry?.fiatMinMax?.min) {
        const newAmount = selectedCountry.fiatMinMax.min.toString();
        isSyncingFromStore.current = true;
        setAmount(newAmount);
        setValue("amount", newAmount, { shouldValidate: false });
      }
    },
    [setAmount, setValue]
  );

  // Helper function to map payment type to request type and get account details (now uses form values)
  const getTransferDetails = () => {
    switch (selectedPaymentType) {
      case "Buy Goods":
        return {
          requestType: "till" as const,
          accountName: accountDetails?.accountName || "OneRamp", // Use fetched account name or fallback
          accountNumber: formTillNumber || billTillPayout?.tillNumber || "",
          businessNumber: undefined,
        };
      case "Paybill":
        return {
          requestType: "bill" as const,
          accountName: accountDetails?.accountName || "OneRamp", // Use fetched account name or fallback
          accountNumber: formBillNumber || billTillPayout?.billNumber || "",
          businessNumber:
            formAccountNumber || billTillPayout?.accountNumber || "",
        };
      case "Send Money":
        // Format phone number with country code (same as select-institution component)
        const phoneNumber =
          formPhoneNumber || billTillPayout?.phoneNumber || "";
        const phoneNumberWithoutLeadingZero = phoneNumber.replace(/^0+/, "");
        const fullPhoneNumber = country?.phoneCode
          ? `${country.phoneCode}${phoneNumberWithoutLeadingZero}`
          : phoneNumber;

        return {
          requestType: "payout" as const,
          accountName:
            formAccountName || // Use form value first
            billTillPayout?.accountName || // Then manually entered account name
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
    console.error("❌ EVM payment transaction failed:", error);
    setBlockchainLoading(false);
    updateSelection({
      appState: AppState.Idle,
      orderStep: OrderStep.PaymentFailed,
    });
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

    // Verify KYC before proceeding with payment using global utility
    const kycResult = verifyKYC({
      amount: amount || 0,
      country: country || null,
      asset: asset || null,
      paymentMethod: paymentMethod || null,
      kycData: kycData || null,
      exchangeRate:
        exchangeRate?.exchange || country?.exchangeRate || undefined,
      orderType: "selling",
    });

    // If KYC check fails, show modal and reset button
    if (!kycResult.shouldProceed) {
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

      // Show KYC modal
      setShowKYCModal(true);

      // Show error message with the reason from verification
      toast.error(kycResult.reason || "KYC verification required");
      return;
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

    const totalAmount =
      includeCashoutFees && supportsCashoutFees(country.name)
        ? numericAmount + cashoutFeeAmount
        : numericAmount;

    if (isCngnAsset) {
      const cngnAmount = convertLocalToCngn(totalAmount);
      return cngnAmount !== null ? cngnAmount.toFixed(4) : "0.00";
    }

    const rate = exchangeRate?.exchange ?? country.exchangeRate;
    if (!rate || rate <= 0) return "0.00";
    const convertedAmount = totalAmount / rate;
    return convertedAmount.toFixed(4);
  }, [
    amount,
    country,
    exchangeRate?.exchange,
    includeCashoutFees,
    cashoutFeeAmount,
    isCngnAsset,
    convertLocalToCngn,
  ]);

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

  // Validate amount does not exceed user's USDC balance (amount is in local fiat)
  const exceedsBalance = useMemo(() => {
    if (!country || !amount) return false;
    if (isBalanceLoading) return false;
    const numericAmount = parseFloat(amount);
    const numericBalance = parseFloat(String(currentBalance || "0"));
    if (isNaN(numericAmount) || isNaN(numericBalance)) return false;
    if (isCngnAsset) {
      const requiredCngn = convertLocalToCngn(numericAmount);
      if (requiredCngn === null) return false;
      return requiredCngn > numericBalance;
    }
    const rate = exchangeRate?.exchange || country.exchangeRate;
    if (!rate || rate <= 0) return false;
    const requiredCrypto = numericAmount / rate;
    return requiredCrypto > numericBalance;
  }, [
    country,
    amount,
    isBalanceLoading,
    currentBalance,
    exchangeRate,
    isCngnAsset,
    convertLocalToCngn,
  ]);

  // Check if required form fields are filled based on payment type
  // Checks both form values and store values (for cache cases)
  const areRequiredFieldsFilled = useMemo(() => {
    if (!selectedPaymentType) return false;

    switch (selectedPaymentType) {
      case "Buy Goods":
        // Till number is required - check form value or store value
        const tillNumber =
          formTillNumber?.trim() || billTillPayout?.tillNumber?.trim() || "";
        return tillNumber.length > 0;
      case "Paybill":
        // Bill number and account number (business number) are required
        const billNumber =
          formBillNumber?.trim() || billTillPayout?.billNumber?.trim() || "";
        const accountNumber =
          formAccountNumber?.trim() ||
          billTillPayout?.accountNumber?.trim() ||
          "";
        return billNumber.length > 0 && accountNumber.length > 0;
      case "Send Money":
        // Phone number and account name are required
        // Institution is required if country requires it
        const phoneNumber =
          formPhoneNumber?.trim() || billTillPayout?.phoneNumber?.trim() || "";
        const accountName =
          formAccountName?.trim() || billTillPayout?.accountName?.trim() || "";
        const hasInstitution =
          country?.name && requiresInstitutionSelection(country.name)
            ? Boolean(institution)
            : true;
        return (
          phoneNumber.length > 0 && accountName.length > 0 && hasInstitution
        );
      default:
        return false;
    }
  }, [
    selectedPaymentType,
    formTillNumber,
    formBillNumber,
    formAccountNumber,
    formPhoneNumber,
    formAccountName,
    billTillPayout,
    country?.name,
    institution,
  ]);

  // Update amount validity - combine form validation with balance check
  useEffect(() => {
    const isFormValidCombined = isFormValid && !exceedsBalance;
    setIsValid(isFormValidCombined);
    if (calculatedCryptoAmount) {
      setFiatAmount(amount || formAmount);
    }
  }, [
    isFormValid,
    exceedsBalance,
    calculatedCryptoAmount,
    amount,
    formAmount,
    setIsValid,
    setFiatAmount,
  ]);

  // Update form schema when payment type or country changes
  useEffect(() => {
    if (country && formSchema) {
      // Trigger validation when schema changes
      trigger();
    }
  }, [selectedPaymentType, country, formSchema, trigger]);

  // Reset form when payment type changes
  useEffect(() => {
    setValue("selectedPaymentType", selectedPaymentType, {
      shouldValidate: false,
    });
    // Reset conditional fields based on payment type
    if (selectedPaymentType !== "Buy Goods") {
      setValue("tillNumber", "", { shouldValidate: false });
    }
    if (selectedPaymentType !== "Paybill") {
      setValue("billNumber", "", { shouldValidate: false });
      setValue("accountNumber", "", { shouldValidate: false });
    }
    if (selectedPaymentType !== "Send Money") {
      setValue("phoneNumber", "", { shouldValidate: false });
      setValue("accountName", "", { shouldValidate: false });
    }
    trigger(); // Re-validate after reset
  }, [selectedPaymentType, setValue, trigger]);

  const handlePaymentComplete = () => {
    const kycResult = verifyKYC({
      amount: amount || 0,
      country: country || null,
      asset: asset || null,
      paymentMethod: paymentMethod || null,
      kycData: kycData || null,
      exchangeRate:
        exchangeRate?.exchange || country?.exchangeRate || undefined,
      orderType: "selling",
    });

    // If KYC check fails, show modal and reset button
    if (!kycResult.shouldProceed) {
      setShowKYCModal(true);

      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100); // Reset the flag after triggering

      // Show error message with the reason from verification
      toast.error(kycResult.reason || "KYC verification required");
      return;
    }

    // Trigger form validation and submission
    handleFormSubmit(
      () => {
        handleCreateBillQuote();
      },
      () => {
        // Handle validation errors
        toast.error("Please fill in all required fields correctly");
      }
    )();
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
      if (assetData.symbol === "cNGN") {
        updateSelection({ asset: assetData, stableAsset: true });
      } else {
        updateSelection({ asset: assetData, stableAsset: false });
      }
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

  const handleInstitutionSelect = (selectedInstitution: Institution) => {
    updateSelection({
      institution: selectedInstitution,
      paymentMethod: "momo",
    });

    // Save institution for Send Money payment type
    if (country?.countryCode && selectedPaymentType === "Send Money") {
      saveSendMoney(country.countryCode, {
        institution: selectedInstitution,
        phoneNumber: billTillPayout?.phoneNumber,
        accountName: billTillPayout?.accountName,
      });
    }

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
                {...register("tillNumber", {
                  onChange: (e) => {
                    const value = e.target.value;
                    // For Uganda, Kenya, Tanzania - limit to 10 characters
                    if (
                      country &&
                      ["UG", "KE", "TZ"].includes(country.countryCode) &&
                      value.length > 10
                    ) {
                      return; // Don't update if exceeds 10 characters
                    }
                    updateBillTillPayout({ tillNumber: value });
                  },
                })}
                type="number"
                onInput={(e) => {
                  // For Uganda, Kenya, Tanzania - prevent typing more than 10 characters
                  if (
                    country &&
                    ["UG", "KE", "TZ"].includes(country.countryCode)
                  ) {
                    const target = e.target as HTMLInputElement;
                    if (target.value.length > 10) {
                      target.value = target.value.slice(0, 10);
                    }
                  }
                }}
                className={`hide-number-spinner bg-neutral-800! border-neutral-600! text-base text-white h-12 rounded-lg px-4 pr-12 ${
                  errors.tillNumber ? "border-red-500" : ""
                }`}
                placeholder="Enter till number"
                disabled={isProcessing}
              />
              {errors.tillNumber && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.tillNumber.message}
                </p>
              )}
              {isLoadingAccountDetails &&
                debouncedAccountNumber === formTillNumber && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              {!isLoadingAccountDetails &&
                accountDetails &&
                debouncedAccountNumber === formTillNumber && (
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
                  {...register("billNumber", {
                    onChange: (e) => {
                      const value = e.target.value;
                      // For Uganda, Kenya, Tanzania - limit to 10 characters
                      if (
                        country &&
                        ["UG", "KE", "TZ"].includes(country.countryCode) &&
                        value.length > 10
                      ) {
                        return; // Don't update if exceeds 10 characters
                      }
                      updateBillTillPayout({ billNumber: value });
                    },
                  })}
                  type="number"
                  onInput={(e) => {
                    // For Uganda, Kenya, Tanzania - prevent typing more than 10 characters
                    if (
                      country &&
                      ["UG", "KE", "TZ"].includes(country.countryCode)
                    ) {
                      const target = e.target as HTMLInputElement;
                      if (target.value.length > 10) {
                        target.value = target.value.slice(0, 10);
                      }
                    }
                  }}
                  className={`hide-number-spinner bg-neutral-800! border-neutral-600! text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12 ${
                    errors.billNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Enter paybill number"
                  disabled={isProcessing}
                />
                {errors.billNumber && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.billNumber.message}
                  </p>
                )}
                {isLoadingAccountDetails &&
                  debouncedAccountNumber === formBillNumber && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                {!isLoadingAccountDetails &&
                  accountDetails &&
                  debouncedAccountNumber === formBillNumber && (
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
                  {...register("accountNumber", {
                    onChange: (e) => {
                      const value = e.target.value;
                      // For Uganda, Kenya, Tanzania - limit to 10 characters
                      if (
                        country &&
                        ["UG", "KE", "TZ"].includes(country.countryCode) &&
                        value.length > 10
                      ) {
                        return; // Don't update if exceeds 10 characters
                      }
                      updateBillTillPayout({ accountNumber: value });
                    },
                  })}
                  type="number"
                  onInput={(e) => {
                    // For Uganda, Kenya, Tanzania - prevent typing more than 10 characters
                    if (
                      country &&
                      ["UG", "KE", "TZ"].includes(country.countryCode)
                    ) {
                      const target = e.target as HTMLInputElement;
                      if (target.value.length > 10) {
                        target.value = target.value.slice(0, 10);
                      }
                    }
                  }}
                  className={`hide-number-spinner bg-neutral-800! border-neutral-600! text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12 ${
                    errors.accountNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Enter account number"
                  disabled={isProcessing}
                />
                {errors.accountNumber && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.accountNumber.message}
                  </p>
                )}
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
                  {...register("phoneNumber", {
                    onChange: (e) => {
                      const value = e.target.value;
                      // For Uganda, Kenya, Tanzania - limit to 10 characters
                      if (
                        country &&
                        ["UG", "KE", "TZ"].includes(country.countryCode) &&
                        value.length > 10
                      ) {
                        return; // Don't update if exceeds 10 characters
                      }
                      updateBillTillPayout({ phoneNumber: value });
                    },
                  })}
                  type="tel"
                  onInput={(e) => {
                    // For Uganda, Kenya, Tanzania - prevent typing more than 10 characters
                    if (
                      country &&
                      ["UG", "KE", "TZ"].includes(country.countryCode)
                    ) {
                      const target = e.target as HTMLInputElement;
                      if (target.value.length > 10) {
                        target.value = target.value.slice(0, 10);
                      }
                    }
                  }}
                  className={`bg-neutral-800! border-neutral-600! text-sm sm:text-base text-white h-12 rounded-lg px-4 ${
                    errors.phoneNumber ? "border-red-500" : ""
                  }`}
                  placeholder=" 0700 000 000"
                  disabled={isProcessing}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            {/* Account Name Input for Send Money */}
            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Enter Account Name</h3>
              </div>
              <div className="relative">
                <Input
                  {...register("accountName", {
                    onChange: (e) =>
                      updateBillTillPayout({ accountName: e.target.value }),
                  })}
                  type="text"
                  className={`bg-neutral-800! border-neutral-600! text-sm sm:text-base text-white h-12 rounded-lg px-4 ${
                    errors.accountName ? "border-red-500" : ""
                  }`}
                  placeholder="Enter account holder name"
                  disabled={isProcessing}
                />
                {errors.accountName && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-3xl overflow-hidden p-4 sm:p-5 space-y-3 sm:space-y-4 min-h-[400px]">
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
                          isSupported &&
                          setSelectedPaymentType(
                            type as "Paybill" | "Buy Goods" | "Send Money"
                          )
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
                {...register("amount", {
                  onChange: (e) => {
                    setAmount(e.target.value);
                  },
                })}
                type="number"
                className={`hide-number-spinner text-right bg-transparent font-extrabold! border-none text-2xl sm:text-3xl text-white p-0 h-auto ${
                  errors.amount ? "border-red-500" : ""
                }`}
                placeholder="0"
                disabled={isProcessing}
              />
            </div>
            <div className="h-px bg-gray-700"></div>

            {errors.amount && (
              <div className="text-red-400 text-[10px]">
                <p>{errors.amount.message}</p>
              </div>
            )}
            {country && !isBalanceLoading && exceedsBalance && (
              <div className="text-red-400 text-[10px]">
                <p>Insufficient balance for this amount</p>
              </div>
            )}
          </div>

          {/* Cashout Fees Checkbox for Tanzania and Uganda */}
          {country && supportsCashoutFees(country.name) && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCashoutFees"
                  {...register("includeCashoutFees")}
                  checked={formIncludeCashoutFees || includeCashoutFees}
                  onCheckedChange={(checked) => {
                    setValue("includeCashoutFees", checked as boolean);
                    setIncludeCashoutFees(checked as boolean);
                  }}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label
                  htmlFor="includeCashoutFees"
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Include cashout fees ({cashoutFeeAmount.toLocaleString()}{" "}
                  {country.currency})
                </label>
              </div>
              {includeCashoutFees && (
                <div className="text-xs text-gray-400 space-y-1">
                  {country.name.toLowerCase() === "uganda" ? (
                    // Uganda breakdown
                    (() => {
                      const breakdown = getUgandaCashoutBreakdown(
                        parseFloat(amount) || 0
                      );
                      return (
                        <>
                          <p>
                            Withdraw from Agent:{" "}
                            {breakdown.withdrawFee.toLocaleString()}{" "}
                            {country.currency}
                          </p>
                          <p>
                            Tax (0.5%): {breakdown.taxAmount.toLocaleString()}{" "}
                            {country.currency}
                          </p>
                          <p className="font-medium">
                            Total cashout fee:{" "}
                            {breakdown.total.toLocaleString()}{" "}
                            {country.currency}
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    // Tanzania breakdown
                    <p>
                      Cashout fee: {cashoutFeeAmount.toLocaleString()}{" "}
                      {country.currency}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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

            {/* Amount Breakdown - Show when cashout fees are included */}
            {includeCashoutFees &&
              country &&
              supportsCashoutFees(country.name) && (
                <div className="bg-neutral-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Total {country.currency}</span>
                    <span>
                      {(parseFloat(amount) + cashoutFeeAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Amount in {country.currency}</span>
                    <span>{parseFloat(amount).toLocaleString()}</span>
                  </div>

                  {country.name.toLowerCase() === "uganda" ? (
                    // Uganda detailed breakdown
                    (() => {
                      const breakdown = getUgandaCashoutBreakdown(
                        parseFloat(amount) || 0
                      );
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Withdraw from Agent</span>
                            <span>
                              {breakdown.withdrawFee.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Tax (0.5%)</span>
                            <span>{breakdown.taxAmount.toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    // Tanzania simple breakdown
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Cashout Fee</span>
                      <span>{cashoutFeeAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="h-px bg-gray-700"></div>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Amount in {asset?.symbol || "USDC"}</span>
                    <span>{Number(calculatedCryptoAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}

            {isExchangeRateLoading ? (
              <ExchangeRateSkeleton />
            ) : (
              <div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
                <p>
                  1 {asset?.symbol || "USD"} ={" "}
                  {(() => {
                    if (isCngnAsset) {
                      // For cNGN, show the cNGN → Local rate
                      // The backend treats cNGN as NGN-equivalent, so the rate is just effectiveRate
                      if (effectiveRate && effectiveRate > 0) {
                        return effectiveRate.toLocaleString();
                      }
                      if (country?.exchangeRate) {
                        // Fallback: estimate using country rate
                        const estimatedRate =
                          country.exchangeRate /
                          (countries.find((c) => c.countryCode === "NG")
                            ?.exchangeRate || 1500);
                        return estimatedRate.toLocaleString() + " (est.)";
                      }
                      return "--";
                    }
                    const rateForDisplay = exchangeRate?.exchange;
                    if (rateForDisplay && rateForDisplay > 0) {
                      return rateForDisplay.toLocaleString();
                    }
                    if (country?.exchangeRate) {
                      return country.exchangeRate.toLocaleString() + " (est.)";
                    }
                    return "--";
                  })()}{" "}
                  {country?.currency || ""}
                </p>
                <p>Payment usually completes in 30s</p>
              </div>
            )}
          </div>

          {/* Exchange Rate Error Display */}
          {finalExchangeRateError && (
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-yellow-400 text-sm">
                  ⚠️{" "}
                  {finalExchangeRateError.message ||
                    "Unable to fetch current rates. Using fallback rates."}
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
              exchangeRateData={
                isCngnAsset && effectiveRate && exchangeRate
                  ? { ...exchangeRate, exchange: effectiveRate }
                  : exchangeRate
              }
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
              exceedsBalance
                ? "Insufficient balance"
                : // Show specific message when account details are missing
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
              !formAmount ||
              formAmount.trim().length === 0 ||
              parseFloat(formAmount || amount || "0") <= 0 ||
              !isAmountValidForCountry ||
              exceedsBalance ||
              !isConnected ||
              !address ||
              !areRequiredFieldsFilled ||
              !isFormValid ||
              (!!country?.name &&
                requiresInstitutionSelection(country.name) &&
                !institution) ||
              isProcessing ||
              ((selectedPaymentType === "Buy Goods" ||
                selectedPaymentType === "Paybill") &&
                isLoadingAccountDetails) ||
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
                className="text-red-400! hover:text-red-300! text-sm font-medium transition-colors"
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
          institutions={institutionsForCountry}
        />
      )}
    </div>
  );
}
