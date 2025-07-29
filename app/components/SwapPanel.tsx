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
import { Asset, Network, OrderStep, AppState, ChainTypes, TransferType,  TransferBankRequest,
  TransferMomoRequest } from "@/types";
import {
  useAllCountryExchangeRates,
  useAllCountryInstitutions,
} from "@/hooks/useExchangeRate";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { createQuoteOut } from "@/actions/quote";
import { createTransferOut } from "@/actions/transfer";
import useEVMPay from "@/onchain/useEVMPay";
import ExchangeRateComponent from "./exchange-rate-component";
import { SwipeToWithdrawButton } from "./payment/swipe-to-withdraw";
import { SwapButton } from "./buttons/SwapButton";
import { FromPanel } from "./panels/FromPanel";
import { SwapArrow } from "./panels/SwapArrow";
import { SwapHeader } from "./panels/SwapHeader";
import { ToPanel } from "./panels/ToPanel";
import SelectInstitution from "./select-institution";
import { KYCVerificationModal } from "./modals/KYCVerificationModal";
import { toast } from "sonner";
import { ModalConnectButton } from "@/components/modal-connect-button";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const userSelectionStore = useUserSelectionStore();
  const { countryPanelOnTop, updateSelection, country, institution, accountNumber, asset } = userSelectionStore;
  const { currentNetwork, setCurrentNetwork, currentNetwork } = useNetworkStore();
  const { chainId } = useWalletGetInfo();
  const [selectedCountryCurrency] = useState<null | {
    name: string;
    logo: string;
  }>(null);

  // Store hooks
  const { setQuote } = useQuoteStore();
  const { setTransfer, setTransactionHash } = useTransferStore();
  const { kycData } = useKYCStore();

  // Get available assets for the current network
  const availableAssets = useMemo(() => {
    if (!currentNetwork) return assets;

    return assets.filter((asset) => {
      const networkConfig = asset.networks[currentNetwork.name];
      return networkConfig && networkConfig.tokenAddress;
    });
  }, [currentNetwork]);

  const [selectedCurrency, setSelectedCurrency] = useState<Asset>(
    availableAssets[0] || assets[0]
  );

  // Wallet connection states
  const { isConnected: evmConnected, address } = useWalletGetInfo();

  const { isValid: isAmountValid, setAmount, amount } = useAmountStore();

  // EVM payment hook
  const { payWithEVM } = useEVMPay();

  // Pre-fetch exchange rates for all supported countries when component mounts
  // This improves the user experience by having rates ready when countries are selected
  // Note: The data is used in ExchangeRateComponent, this just triggers the pre-fetching
  // Using "selling" endpoint for better performance (same as PaymentInterface)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allExchangeRates } = useAllCountryExchangeRates({
    orderType: "selling", // Using selling endpoint for better performance
    providerType: "momo", // Default provider type
  });

  // Pre-fetch institutions for all supported countries when component mounts
  // This ensures institutions are ready when users select a country
  // Note: The data is used in InstitutionModal, this just triggers the pre-fetching
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: allInstitutions } = useAllCountryInstitutions("buy");

  // Used to show wallet requirement in the network modal
  const canSwitchNetwork = (network: Network) => {
    // console.log(network); // Commented out to prevent performance issues
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
    } else if (!asset && selectedCurrency) {
      // Set global asset to selectedCurrency if no global asset is set
      updateSelection({ asset: selectedCurrency });
    }
  }, [asset, selectedCurrency]); // Removed updateSelection from dependencies

  // Close wallet modal when wallet gets connected
  useEffect(() => {
    if (evmConnected && showWalletModal) {
      setTimeout(() => {
        setShowWalletModal(false);
      }, 1000); // Show success message for 1 second
    }
  }, [evmConnected, showWalletModal]);

  const handleSettingsClick = () => {
    // Settings functionality to be implemented
  };

  const handleBeneficiarySelect = () => {
    // Beneficiary selection functionality to be implemented
  };

  const createTransferPayload = useCallback((quoteId: string) => {
    if (!country || !kycData?.fullKYC) {
      throw new Error("Missing country or KYC data");
    }

    const { fullKYC } = kycData;
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

    const baseUserDetails = {
      name: fullName,
      country: nationality,
      address: country.countryCode || "",
      dob: dateOfBirth,
      idNumber: documentNumber,
      idType: updatedDocumentType,
      additionalIdType: updatedDocumentType,
      additionalIdNumber: updatedDocumentTypeSubType,
    };

    const isNigeriaOrSouthAfrican = country.countryCode === "NG" || country.countryCode === "ZA";

    if (userSelectionStore.paymentMethod === "momo") {
      if (isNigeriaOrSouthAfrican) {
        if (!phoneNumber) throw new Error("Phone number required for Nigeria/SA");
        
        return {
          bank: {
            code: "",
            accountNumber: "",
            accountName: "",
          },
          operator: "bank",
          quoteId,
          userDetails: {
            ...baseUserDetails,
            phone: phoneNumber,
          },
        };
      } else {
        if (!institution || !accountNumber) {
          throw new Error("Institution and account number required");
        }
        
        const accountNumberWithoutLeadingZero = accountNumber.replace(/^0+/, "");
        const fullPhoneNumber = `${country.phoneCode}${accountNumberWithoutLeadingZero}`;
        
        return {
          phone: fullPhoneNumber,
          operator: institution.name.toLowerCase(),
          quoteId,
          userDetails: {
            ...baseUserDetails,
            phone: fullPhoneNumber,
          },
        };
      }
    }

    if (userSelectionStore.paymentMethod === "bank") {
      const accountName = userSelectionStore.accountName === "OK" ? fullName : (userSelectionStore.accountName || fullName);

      if (isNigeriaOrSouthAfrican) {
        if (!phoneNumber) throw new Error("Phone number required for Nigeria/SA bank transfers");
        if (!institution || !accountNumber) {
          throw new Error("Institution and account number required for Nigeria/SA bank transfers");
        }
        
        const nigeriaPayload = {
          bank: {
            code: institution.code,
            accountNumber: accountNumber,
            accountName: accountName,
          },
          operator: "bank",
          quoteId,
          userDetails: {
            ...baseUserDetails,
            phone: phoneNumber, // Use phoneNumber from KYC for Nigeria, not accountNumber
          },
        };
        
        return nigeriaPayload;
      } else {
        if (!institution || !accountNumber) {
          throw new Error("Institution and account number required");
        }
        
        return {
          bank: {
            code: institution.code,
            accountNumber: accountNumber,
            accountName: accountName,
          },
          operator: "bank",
          quoteId,
          userDetails: {
            ...baseUserDetails,
            phone: phoneNumber || accountNumber,
          },
        };
      }
    }

    throw new Error("No valid payment method found");
  }, [country, kycData, userSelectionStore, institution, accountNumber]);

  const handleWithdrawTransfer = useCallback(async () => {
    console.log("🚀 Withdrawal transfer starting...");
    
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

    const quoteResponse = await createQuoteOut(quotePayload);
    console.log("✅ Quote response:", quoteResponse);

    if (!quoteResponse?.quote?.quoteId) {
      throw new Error("No quote ID received from quote response");
    }

    // Step 2: Create transfer
    console.log("💸 Step 2: Creating transfer...");
    setStepMessage("Setting up withdrawal...");
    
    const transferPayload = createTransferPayload(quoteResponse.quote.quoteId);
    const transferResponse = await createTransferOut(transferPayload);
    
    console.log("✅ Transfer response:", transferResponse);

    return {
      quote: quoteResponse,
      transfer: transferResponse,
    };
  }, [country, institution, accountNumber, asset, currentNetwork, amount, address, kycData, createTransferPayload]);

  // Withdrawal flow mutation
  const withdrawMutation = useMutation({
    mutationFn: handleWithdrawTransfer,
    onSuccess: (data) => {
      console.log("✅ Withdrawal flow completed successfully:", data);
      
      // Update global state with quote and transfer
      if (data?.quote) {
        setQuote(data.quote.quote);
      }

      if (data?.transfer) {
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

      let finalAmount;

      if (quote.transferType === TransferType.TransferOut) {
        finalAmount = quote.amountPaid;
      } else {
        finalAmount = quote.fiatAmount;
      }

      const transactionPayload = {
        recipient,
        amount: finalAmount.toString(),
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
    
    // Show success state for 1 second to let user see the green tick
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

    if (!isAmountValid || !country || !institution || !accountNumber) {
      console.log("Basic validation failed");
      return;
    }

    setWithdrawLoading(true);
    setStepMessage("Checking rates...");
    updateSelection({ appState: AppState.Processing });
    withdrawMutation.mutate();
  };

  // Handle swap button click (when no country is selected)
  const handleSwapClick = () => {
    console.log("Swap button clicked - please select a country first");
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  // Handle KYC start
  const handleStartKYC = () => {
    // Check KYC status and show modal
    if (kycData && kycData.kycStatus !== "VERIFIED") {
      setShowKYCModal(true);
      toast.error("KYC verification required");
      return;
    }
    
    // If somehow KYC is already verified, proceed with withdrawal
    if (kycData?.kycStatus === "VERIFIED") {
      console.log("KYC already verified, proceeding...");
    }
  };

  // Determine if withdraw should be disabled
  const isWithdrawDisabled = !isAmountValid || !country || !institution || !accountNumber || !evmConnected || !kycData?.fullKYC || stepMessage === "Transaction Complete!";

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
          availableAssets={availableAssets}
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
            <div className="mt-4">
              <SwipeToWithdrawButton
                onWithdrawComplete={handleWithdrawComplete}
                isLoading={withdrawLoading}
                disabled={isWithdrawDisabled}
                stepMessage={stepMessage}
                onSwapClick={handleSwapClick}
                isWalletConnected={evmConnected}
                hasKYC={!!kycData?.fullKYC}
                onConnectWallet={handleConnectWallet}
                onStartKYC={handleStartKYC}
              />
            </div>
          </div>
        ) : (
          <div className="px-3 md:px-4 mt-4">
            <SwapButton
              onClick={handleSwapClick}
              text="Swap"
            />
          </div>
        )}
      </motion.div>

      {/* KYC Verification Modal */}
      <KYCVerificationModal
        open={showKYCModal}
        onClose={() => {
          setShowKYCModal(false);
        }}
        kycLink={kycData?.message?.link || null}
      />

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#181818] p-6 rounded-2xl border border-[#232323] max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Connect Wallet</h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <ModalConnectButton large />
            {evmConnected && (
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
              >
                Wallet Connected ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}