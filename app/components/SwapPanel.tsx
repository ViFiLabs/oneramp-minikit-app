"use client";

import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useKYCStore } from "@/store/kyc-store";
import { Asset, Network, OrderStep, AppState, ChainTypes, TransferType } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { createQuoteOut } from "@/actions/quote";
import { createTransferOut } from "@/actions/transfer";
import useEVMPay from "@/onchain/useEVMPay";
import SubmitButton from "./buttons/submit-button";
import ExchangeRateComponent from "./exchange-rate-component";
import { SwipeToWithdrawButton } from "./payment/swipe-to-withdraw";
import { FromPanel } from "./panels/FromPanel";
import { SwapArrow } from "./panels/SwapArrow";
import { SwapHeader } from "./panels/SwapHeader";
import { ToPanel } from "./panels/ToPanel";
import SelectInstitution from "./select-institution";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const [selectedCurrency, setSelectedCurrency] = useState<Asset>(assets[0]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const { countryPanelOnTop, updateSelection, country, institution, accountNumber, asset } = useUserSelectionStore();
  const { setCurrentNetwork, currentNetwork } = useNetworkStore();
  const { chainId } = useWalletGetInfo();
  const [selectedCountryCurrency] = useState<null | {
    name: string;
    logo: string;
  }>(null);

  // Store hooks
  const { setQuote } = useQuoteStore();
  const { setTransfer, setTransactionHash } = useTransferStore();
  const { kycData } = useKYCStore();

  // Wallet connection states
  const { isConnected: evmConnected, address } = useWalletGetInfo();

  const { isValid: isAmountValid, setAmount, amount } = useAmountStore();

  // EVM payment hook
  const { payWithEVM } = useEVMPay();

  // Used to show wallet requirement in the network modal
  const canSwitchNetwork = (network: Network) => {
    console.log(network);
    return evmConnected;
  };

  // Update handleNetworkSelect to use global state
  const handleNetworkSelect = async (network: Network) => {
    // If appropriate wallet is connected, attempt to switch networks
    setCurrentNetwork(network);
  };

  const handleCurrencyChange = (currency: Asset) => {
    setSelectedCurrency(currency);
    // Update global store with selected currency
    updateSelection({ asset: currency });
  };

  // Sync selectedCurrency with global asset on mount
  useEffect(() => {
    if (asset && asset !== selectedCurrency) {
      setSelectedCurrency(asset);
    } else if (!asset) {
      // Set global asset to selectedCurrency if no global asset is set
      updateSelection({ asset: selectedCurrency });
    }
  }, [asset, selectedCurrency, updateSelection]);

  const handleSettingsClick = () => {
    // Settings functionality to be implemented
  };

  const handleBeneficiarySelect = () => {
    // Beneficiary selection functionality to be implemented
  };

  // Withdrawal flow mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      console.log("🚀 Withdrawal mutation starting...");
      console.log("Data check - country:", country, "institution:", institution, "accountNumber:", accountNumber);
      console.log("Data check - asset:", asset, "currentNetwork:", currentNetwork, "amount:", amount);
      console.log("Data check - address:", address, "kycData?.fullKYC:", kycData?.fullKYC);
      
      if (!country || !institution || !accountNumber || !asset || !currentNetwork || !amount || !address || !kycData?.fullKYC) {
        console.log("❌ Missing required data - stopping withdrawal");
        throw new Error("Missing required data for withdrawal");
      }

      // Step 1: Create quote
      console.log("📊 Step 1: Creating quote...");
      setStepMessage("Checking rates...");
      const quotePayload = {
        address: address,
        cryptoType: asset.symbol,
        cryptoAmount: amount,
        fiatType: country.currency,
        country: country.countryCode,
        network: currentNetwork.name.toLowerCase(),
      };

      console.log("Quote payload:", JSON.stringify(quotePayload, null, 2));
      
      try {
        const quoteResponse = await createQuoteOut(quotePayload);
        console.log("✅ Quote response:", quoteResponse);

        if (!quoteResponse?.quote?.quoteId) {
          console.error("❌ No quote ID in response:", quoteResponse);
          throw new Error("No quote ID received from quote response");
        }

        // Step 2: Create transfer  
        console.log("💸 Step 2: Creating transfer...");
        setStepMessage("Setting up withdrawal...");
        
        // Extract KYC data
        const { fullKYC } = kycData;
        const {
          fullName,
          nationality,
          dateOfBirth,
          documentNumber,
          documentType,
          documentSubType,
        } = fullKYC;

        // Debug logging for Nigeria
        if (country.countryCode === "NG") {
          console.log("🇳🇬 Nigeria KYC Debug:");
          console.log("- fullName:", fullName);
          console.log("- nationality:", nationality);
          console.log("- dateOfBirth:", dateOfBirth);
          console.log("- documentNumber (NIN):", documentNumber);
          console.log("- documentType:", documentType);
          console.log("- documentSubType (BVN):", documentSubType);
        }

        // Handle document type mapping like in select-institution.tsx
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

        // Remove leading zeros from account number for phone number
        const accountNumberWithoutLeadingZero = accountNumber.replace(/^0+/, "");
        const fullPhoneNumber = `${country.phoneCode}${accountNumberWithoutLeadingZero}`;

        const userDetails = {
          name: fullName,
          country: nationality,
          address: country.countryCode || "",
          phone: fullPhoneNumber,
          dob: dateOfBirth,
          idNumber: documentNumber,
          idType: updatedDocumentType,
          additionalIdType: updatedDocumentType,
          additionalIdNumber: updatedDocumentTypeSubType,
        };

        // Handle different payload structures for different countries
        const isNigeriaOrSouthAfrican = country.countryCode === "NG" || country.countryCode === "ZA";
        
        let transferPayload;
        if (isNigeriaOrSouthAfrican) {
          transferPayload = {
            bank: {
              code: "",
              accountNumber: "",
              accountName: "",
            },
            operator: "bank",
            quoteId: quoteResponse.quote.quoteId,
            userDetails,
          };
        } else {
          transferPayload = {
            phone: fullPhoneNumber,
            operator: institution.name.toLowerCase(),
            quoteId: quoteResponse.quote.quoteId,
            userDetails,
          };
        }

        console.log("Transfer payload:", JSON.stringify(transferPayload, null, 2));
        if (country.countryCode === "NG") {
          console.log("🇳🇬 Nigeria Transfer Payload Details:");
          console.log("- userDetails:", JSON.stringify(userDetails, null, 2));
        }
        
        const transferResponse = await createTransferOut(transferPayload);
        console.log("✅ Transfer response:", transferResponse);

        return {
          quote: quoteResponse,
          transfer: transferResponse,
        };
      } catch (error) {
        console.error("❌ Error in withdrawal mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Withdrawal flow completed successfully:", data);
      
      // Update global state with quote and transfer
      if (data.quote) {
        setQuote(data.quote.quote);
      }

      if (data.transfer) {
        setTransfer(data.transfer);

        // Check if we have EVM network and can proceed with blockchain transaction
        if (currentNetwork?.type === ChainTypes.EVM && data.quote && data.transfer) {
          console.log("Starting blockchain transaction...");
          setStepMessage("Opening in Wallet...");
          // Start blockchain transaction immediately
          makeBlockchainTransaction(data.quote.quote, data.transfer);
        } else {
          // For non-EVM networks or if missing data, go directly to GotTransfer
          updateSelection({
            orderStep: OrderStep.GotTransfer,
            appState: AppState.Idle,
          });
          setWithdrawLoading(false);
        }
      }
    },
    onError: (error) => {
      console.error("❌ Withdrawal flow failed:", error);
      setWithdrawLoading(false);
      setStepMessage("");
      updateSelection({
        appState: AppState.Idle,
        orderStep: OrderStep.Initial,
      });
    },
  });

  // Blockchain transaction functions
  const makeBlockchainTransaction = async (quote: any, transfer: any) => {
    if (!asset || !currentNetwork || !quote || !transfer) {
      console.log("Missing required data for blockchain transaction");
      setWithdrawLoading(false);
      return;
    }

    // Check if we're on the correct network
    if (chainId !== currentNetwork.chainId) {
      console.log("Wrong chain, cannot proceed with transaction");
      setWithdrawLoading(false);
      return;
    }

    const networkName = currentNetwork.name;
    const contractAddress = asset.networks[networkName]?.tokenAddress;

    if (!contractAddress) {
      console.log("No contract address found for network:", networkName);
      setWithdrawLoading(false);
      return;
    }

    console.log("Initiating blockchain transaction...");
    updateSelection({ appState: AppState.Processing });

    try {
      const recipient = transfer.transferAddress;

      // For withdrawal (TransferOut), use the amount user is sending
      const transactionPayload = {
        recipient,
        amount: quote.amountPaid || amount, // Use amountPaid from quote or fallback to input amount
        tokenAddress: contractAddress,
      };

      console.log("Transaction payload:", transactionPayload);
      payWithEVM(transactionPayload, handleEVMPaySuccess, handleEVMPayFailed);
    } catch (error) {
      console.error("Error in makeBlockchainTransaction:", error);
      setWithdrawLoading(false);
      updateSelection({ appState: AppState.Idle });
    }
  };

  const handleEVMPaySuccess = async (txHash: string) => {
    console.log("✅ EVM transaction successful:", txHash);
    

    // Store transaction hash
    setTransactionHash(txHash);

    // Show success state with green button and tick
    setStepMessage("Transaction Complete!");
    
    // Show success state for 1 seconds to let user see the green tick
    setTimeout(() => {
      setWithdrawLoading(false);
      setStepMessage("");
      updateSelection({
        orderStep: OrderStep.ProcessingPayment,
        appState: AppState.Idle,
      });
    }, 1000);
  };

  const handleEVMPayFailed = (error: Error) => {
    console.error("❌ EVM transaction failed:", error);
    setWithdrawLoading(false);
    setStepMessage("");
    updateSelection({ 
      appState: AppState.Idle,
      orderStep: OrderStep.PaymentFailed 
    });
    return error;
  };

  // Handle swipe to withdraw completion
  const handleWithdrawComplete = () => {
    // Debug logging to see what data we have
    console.log("=== Withdrawal Debug Info ===");
    console.log("isAmountValid:", isAmountValid);
    console.log("amount:", amount);
    console.log("country:", country);
    console.log("institution:", institution);
    console.log("accountNumber:", accountNumber);
    console.log("asset:", asset);
    console.log("currentNetwork:", currentNetwork);
    console.log("address:", address);
    console.log("kycData:", kycData);
    console.log("kycData?.fullKYC:", kycData?.fullKYC);
    console.log("evmConnected:", evmConnected);
    console.log("================================");

    if (!isAmountValid || !country || !institution || !accountNumber) {
      console.log("Basic validation failed");
      return;
    }

    setWithdrawLoading(true);
    setStepMessage("Checking rates...");
    updateSelection({ appState: AppState.Processing });
    withdrawMutation.mutate();
  };

  // Determine if withdraw should be disabled
  const isWithdrawDisabled = !isAmountValid || !country || !institution || !accountNumber || !evmConnected || !kycData?.fullKYC || stepMessage === "Transaction Complete!";

  // Debug logging for withdrawal validation
  console.log("=== Withdrawal Validation Debug ===");
  console.log("isAmountValid:", isAmountValid, "| amount:", amount);
  console.log("country:", !!country, "| country value:", country?.name);
  console.log("institution:", !!institution, "| institution value:", institution?.name);
  console.log("accountNumber:", !!accountNumber, "| accountNumber value:", accountNumber);
  console.log("evmConnected:", evmConnected);
  console.log("kycData?.fullKYC:", !!kycData?.fullKYC);
  console.log("stepMessage:", stepMessage);
  console.log("isWithdrawDisabled:", isWithdrawDisabled);
  console.log("================================");

  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SwapHeader
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          onSettingsClick={handleSettingsClick}
        />
      </motion.div>

      {/* Animated Panel Container */}
      <AnimatePresence mode="wait">
        {countryPanelOnTop ? (
          <motion.div
            key="country-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ToPanel
                selectedCountryCurrency={selectedCountryCurrency}
                onBeneficiarySelect={handleBeneficiarySelect}
              />
            </motion.div>

            {/* Arrow in the middle */}
            <SwapArrow
              onClick={() => {
                updateSelection({ countryPanelOnTop: !countryPanelOnTop });
                setAmount("0");
              }}
            />

            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <FromPanel
                selectedCurrency={selectedCurrency}
                networks={networks}
                canSwitchNetwork={canSwitchNetwork}
                onNetworkSelect={handleNetworkSelect}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="crypto-top"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <FromPanel
                selectedCurrency={selectedCurrency}
                networks={networks}
                canSwitchNetwork={canSwitchNetwork}
                onNetworkSelect={handleNetworkSelect}
              />
            </motion.div>

            {/* Arrow in the middle */}
            <SwapArrow
              onClick={() => {
                updateSelection({ countryPanelOnTop: !countryPanelOnTop });
                setAmount("0");
              }}
            />

            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ToPanel
                selectedCountryCurrency={selectedCountryCurrency}
                onBeneficiarySelect={handleBeneficiarySelect}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swap Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <ExchangeRateComponent />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        {country ? (
          <div className="px-3 md:px-4">
            <SelectInstitution disableSubmit={true} />
            {institution && accountNumber && (
              <div className="mt-4">
                <SwipeToWithdrawButton
                  onWithdrawComplete={handleWithdrawComplete}
                  isLoading={withdrawLoading}
                  disabled={isWithdrawDisabled}
                  stepMessage={stepMessage}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 md:px-4 mt-4">
            <SwipeToWithdrawButton
              onWithdrawComplete={handleWithdrawComplete}
              isLoading={withdrawLoading}
              disabled={isWithdrawDisabled}
              stepMessage={stepMessage}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}