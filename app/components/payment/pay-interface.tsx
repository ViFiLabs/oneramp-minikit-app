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

// Import app data and stores
import { assets } from "@/data/currencies";
import { countries } from "@/data/countries";

// Note: Actions are now handled by the useBillPayment hook

// Countries that support Pay functionality
const payEnabledCountries = countries.filter(
  (country) => country.name === "Kenya" || country.name === "Uganda"
);

import { useUserSelectionStore } from "@/store/user-selection";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useAllCountryExchangeRates } from "@/hooks/useExchangeRate";
import { useAssetBalance } from "@/hooks/useAssetBalance";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useBillPayment, PaymentStep } from "@/hooks/useBillPayment";
import { OrderStep, AppState, ChainTypes, Transfer, Quote } from "@/types";
import useEVMPay from "@/onchain/useEVMPay";
import Image from "next/image";
import {
  ExchangeRateSkeleton,
  CryptoAmountSkeleton,
} from "@/components/ui/skeleton";

export function PaymentInterface() {
  const { country, asset, updateSelection, paymentMethod, billTillPayout } =
    useUserSelectionStore();

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
  const { data: allExchangeRates, isLoading: isExchangeRateLoading } =
    useAllCountryExchangeRates({
      orderType: "selling",
      providerType: paymentMethod || "momo", // Default to momo for Pay interface
    });

  // Get current country's exchange rate from cached data
  const exchangeRate =
    country?.countryCode && allExchangeRates
      ? allExchangeRates[country.countryCode]
      : undefined;

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

  const [selectedPaymentType, setSelectedPaymentType] = useState("Buy Goods");

  // Check if payment type is supported for the current country
  const isPaymentTypeSupported = (paymentType: string) => {
    if (country?.name === "Uganda") {
      return paymentType === "Send Money";
    }
    return true; // Kenya supports all payment types
  };

  // Reset payment type when country changes to Uganda
  useEffect(() => {
    if (country?.name === "Uganda" && selectedPaymentType !== "Send Money") {
      setSelectedPaymentType("Send Money");
    }
  }, [country?.name, selectedPaymentType]);

  // Pre-fetch exchange rates for all supported countries when component mounts
  // (No default country - user must select one)
  useEffect(() => {
    // This will trigger the useAllCountryExchangeRates hook to fetch rates
    // even before a country is selected, improving the user experience
  }, []);

  // Set default asset to USDC
  useEffect(() => {
    if (!asset) {
      const defaultAsset = assets.find((a) => a.symbol === "USDC");
      if (defaultAsset) {
        updateSelection({ asset: defaultAsset });
      }
    }
  }, [asset, updateSelection]);

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
          tillNumber: "40202250",
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
          accountName: "OneRamp", // Default name for till payments
          accountNumber: billTillPayout?.tillNumber || "",
          businessNumber: undefined,
        };
      case "Paybill":
        return {
          requestType: "bill" as const,
          accountName: "OneRamp", // Default name for bill payments
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

        return {
          requestType: "payout" as const,
          accountName: "mtn", // Default name for payout
          accountNumber: fullPhoneNumber,
          businessNumber: undefined,
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
      console.log("Missing required data for blockchain transaction");
      return;
    }

    // Debug the quote object to see its structure
    // Check if we're on the correct network
    if (chainId !== currentNetwork.chainId) {
      console.log("Wrong chain, cannot proceed with transaction");
      return;
    }

    const networkName = currentNetwork.name;
    const contractAddress = asset.networks[networkName]?.tokenAddress;

    if (!contractAddress) {
      console.log("No contract address found for network:", networkName);
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
              console.log("Starting blockchain transaction...");
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
    if (!country || !amount || !exchangeRate) return "0.00";
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "0.00";

    // Use the exchange rate from the API response
    const rate = exchangeRate.exchange;
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

  const handleCountrySelect = (selectedCountry: string) => {
    const countryData = payEnabledCountries.find(
      (c) => c.name === selectedCountry
    );
    if (countryData) {
      // Reset amount to the minimum for the new country
      setAmountForCountry(countryData);

      updateSelection({
        country: countryData,
        institution: undefined,
        accountNumber: undefined,
        address: undefined,
      });
    }
  };

  const handleAssetSelect = (selectedAsset: string) => {
    const assetData = assets.find((a) => a.symbol === selectedAsset);
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
                onChange={(e) =>
                  updateBillTillPayout({ tillNumber: e.target.value })
                }
                className="!bg-neutral-800 !border-neutral-600 text-base text-white h-12 rounded-lg px-4 pr-12"
                placeholder="40202250"
              />
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
                  onChange={(e) =>
                    updateBillTillPayout({ billNumber: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12"
                  placeholder="Enter paybill number"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-gray-400 text-sm sm:text-base">
                <h3>Account Number</h3>
              </div>
              <div className="relative">
                <Input
                  value={billTillPayout?.accountNumber || ""}
                  onChange={(e) =>
                    updateBillTillPayout({ accountNumber: e.target.value })
                  }
                  className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12"
                  placeholder="Enter account number"
                />
              </div>
            </div>
          </div>
        );

      case "Send Money":
        return (
          <div className="space-y-3">
            <div className="text-gray-400 text-sm sm:text-base">
              <h3>Telephone Number</h3>
            </div>
            <div className="relative">
              <Input
                value={billTillPayout?.phoneNumber || ""}
                onChange={(e) =>
                  updateBillTillPayout({ phoneNumber: e.target.value })
                }
                className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 pr-12"
                placeholder=" 0700 000 000"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-2xl overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-[500px]">
      {/* Pay Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl">Pay</h2>
        {country && (
          <div className="flex items-center gap-2">
            <Select
              value={asset?.symbol || "USDC"}
              onValueChange={handleAssetSelect}
            >
              <SelectTrigger className="bg-transparent border-none text-sm sm:text-base text-white p-0 h-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 !border-neutral-700 border">
                {assets.map((assetItem) => (
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
        <Select value={country?.name || ""} onValueChange={handleCountrySelect}>
          <SelectTrigger className="!bg-neutral-800 !border-neutral-600 text-sm sm:text-base text-white h-12 rounded-lg px-4 w-full">
            <div className="flex items-center gap-3">
              <SelectValue placeholder="Select Country" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 !border-neutral-700 border">
            {payEnabledCountries.map((countryItem) => (
              <SelectItem
                key={countryItem.name}
                value={countryItem.name}
                className="focus:bg-neutral-800 focus:text-white data-[highlighted]:bg-neutral-800 data-[highlighted]:text-white"
              >
                <div className="flex items-center gap-3 p-1 ">
                  <Image
                    src={countryItem.logo}
                    alt={countryItem.name}
                    className="w-6 h-4 rounded-sm object-cover"
                    width={24}
                    height={16}
                  />
                  <h1 className="text-sm sm:text-base text-white">
                    {countryItem.name}
                  </h1>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progressive UI - Only show when country is selected */}
      {country && (
        <>
          {/* Payment Type Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {["Buy Goods", "Paybill", "Send Money"].map((type) => {
              const isSupported = isPaymentTypeSupported(type);
              const isSelected = selectedPaymentType === type;

              return (
                <Button
                  key={type}
                  variant="ghost"
                  disabled={!isSupported}
                  className={`h-12 rounded-lg text-sm sm:text-base font-medium transition-all w-full ${
                    isSelected && isSupported
                      ? "!bg-neutral-600 !border-neutral-500 text-white shadow-sm"
                      : isSupported
                      ? "!bg-neutral-800 !border-neutral-600 text-gray-300 hover:!bg-neutral-700 hover:text-white border"
                      : "!bg-neutral-900 !border-neutral-700 text-gray-500 border cursor-not-allowed opacity-50"
                  }`}
                  onClick={() => isSupported && setSelectedPaymentType(type)}
                >
                  <h2 className="text-xs sm:text-sm">{type}</h2>
                </Button>
              );
            })}
          </div>

          {/* Dynamic Payment Fields */}
          <div className="min-h-[80px]">{renderPaymentFields()}</div>

          {/* Amount Section */}
          <div className="space-y-3">
            <div className="text-gray-400 text-sm sm:text-base">
              <h3>Amount in {country?.currency || "KES"}</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xl sm:text-2xl font-medium">
                {country?.currency || "KES"}
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-right bg-transparent border-none text-xl sm:text-2xl text-white p-0 h-auto"
                placeholder="0"
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
                  {exchangeRate ? exchangeRate.exchange.toLocaleString() : "--"}{" "}
                  {country?.currency || ""}
                </p>
                <p>Swap usually completes in 30s</p>
              </div>
            )}
          </div>

          {/* Error Display */}
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

          {/* Swipe to Pay Button */}
          <SwipeToPayButton
            onPaymentComplete={handlePaymentComplete}
            isLoading={
              billPaymentMutation.isPending || blockchainLoading || isEVMLoading
            }
            stepMessage={getStepMessage(billPaymentMutation.currentStep)}
            disabled={
              !country ||
              !asset ||
              !currentNetwork ||
              !amount ||
              !isAmountValidForCountry ||
              !isConnected ||
              !address ||
              isExchangeRateLoading
            }
          />
        </>
      )}
    </div>
  );
}
