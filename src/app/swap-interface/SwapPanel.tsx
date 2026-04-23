"use client";

import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import { useAerodromeSwap } from "@/src/hooks/useAerodromeSwap";
import {
  useProcessingSession,
  clearProcessingSession,
} from "@/src/hooks/useProcessingSession";
import { useTokenBalance } from "@/src/hooks/useTokenBalance";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { ExchangeRateDisplay } from "@/src/components/ExchangeRateDisplay";
import { CurrencyPanel } from "@/src/components/panels/CurrencyPanel";
import { SwapArrow } from "@/src/components/panels/SwapArrow";
import { SwapPanelHeader } from "@/src/components/panels/SwapPanelHeader";
import { SwipeToSwapButton } from "@/src/components/payment/swipe-to-swap";
import { ModalConnectButton } from "@/src/components/wallet/modal-connect-button";
import {
  SwapStatusActionSheet,
  type SwapStatus,
} from "./components/SwapStatusActionSheet";
import { useAmountStore } from "@/src/store/amount-store";
import { useNetworkStore } from "@/src/store/network";
import { useUserSelectionStore } from "@/src/store/user-selection";
import { Asset, Network } from "@/types";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const userSelectionStore = useUserSelectionStore();
  const { updateSelection } = userSelectionStore;
  const { currentNetwork, setCurrentNetwork } = useNetworkStore();

  // Get available assets for the current network (USDC/USDT and cNGN for swap mode)
  const availableAssets = useMemo(() => {
    const allowedSymbols = new Set(["USDC", "USDT", "CNGN"]);

    if (!currentNetwork) {
      const filtered = assets.filter((a) => allowedSymbols.has(a.symbol));
      return filtered;
    }

    const filtered = assets.filter((asset) => {
      const networkConfig = asset.networks[currentNetwork.name];
      // USDT is not available on Base network
      if (currentNetwork.name === "Base" && asset.symbol === "USDT") {
        return false;
      }
      const hasValidConfig =
        !!networkConfig &&
        allowedSymbols.has(asset.symbol) &&
        networkConfig.tokenAddress !== "";

      if (!hasValidConfig) {
        console.log(
          `❌ ${asset.symbol} not available on ${
            currentNetwork.name
          }: config=${!!networkConfig}, address=${
            networkConfig?.tokenAddress || "none"
          }`,
        );
      } else {
        console.log(
          `✅ ${asset.symbol} available on ${currentNetwork.name}: address=${networkConfig.tokenAddress}`,
        );
      }

      return hasValidConfig;
    });

    return filtered;
  }, [currentNetwork]);

  const [selectedCurrency, setSelectedCurrency] = useState<Asset | null>(null);

  // Add second currency for "To" panel
  const [selectedToCurrency, setSelectedToCurrency] = useState<Asset | null>(
    null,
  );

  // Wallet connection states
  const { isConnected: evmConnected } = useWalletGetInfo();

  const { isValid: isAmountValid, setAmount, amount } = useAmountStore();

  // Add amount state for the "to" currency
  const [toAmount, setToAmount] = useState("0.00");

  // Add exchange rate state
  const [exchangeRate, setExchangeRate] = useState("0");

  // Fetch balances for the selected currencies
  const fromBalance = useTokenBalance(selectedCurrency?.symbol || "");
  const toBalance = useTokenBalance(selectedToCurrency?.symbol || "");

  // Aerodrome swap functionality
  const {
    swap,
    getQuote,
    swapState,
    isApprovalSuccess,
    isSwapSuccess,
    markSuccessHandled,
    clearError,
  } = useAerodromeSwap();

  // Refetch balances when currency changes (especially for CNGN)
  useEffect(() => {
    if (selectedCurrency?.symbol === "CNGN") {
      fromBalance.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency?.symbol]);

  useEffect(() => {
    if (selectedToCurrency?.symbol === "CNGN") {
      toBalance.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToCurrency?.symbol]);

  // Get quote and update "To" amount when inputs change
  useEffect(() => {
    const fetchQuote = async () => {
      if (
        selectedCurrency &&
        selectedToCurrency &&
        amount &&
        amount !== "0" &&
        !isNaN(parseFloat(amount))
      ) {
        try {
          const quote = await getQuote(
            selectedCurrency.symbol,
            selectedToCurrency.symbol,
            amount,
          );
          if (quote) {
            setToAmount(parseFloat(quote.amountOut).toFixed(2));
            // Calculate the exchange rate (how much "to currency" per 1 "from currency")
            const rate = parseFloat(quote.amountOut) / parseFloat(amount);
            setExchangeRate(rate.toFixed(4)); // Use whole number for readability
          }
        } catch (error) {
          setToAmount("0.00");
          setExchangeRate("0");
        }
      } else {
        setToAmount("0.00");
        setExchangeRate("0");
      }
    };

    // Debounce the quote fetching to avoid too many API calls
    const debounceTimer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, selectedToCurrency, amount]);

  // Handle successful approval
  useEffect(() => {
    if (isApprovalSuccess) {
    }
  }, [isApprovalSuccess]);

  // Handle successful swap and refresh balances
  useEffect(() => {
    if (isSwapSuccess) {
      // Show success message
      setShowSuccessMessage(true);

      // Mark success as handled to prevent infinite loop
      markSuccessHandled();

      // Reset amounts first
      setAmount("0");
      setToAmount("0.00");

      // Refresh balances after successful swap with a small delay
      setTimeout(() => {
        fromBalance.refetch();
        toBalance.refetch();
      }, 1000);

      // Hide success message after 15 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 15000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwapSuccess]);

  // Initialize currencies after availableAssets is calculated
  useEffect(() => {
    if (
      availableAssets.length > 0 &&
      (!selectedCurrency || !selectedToCurrency)
    ) {
      // On Base, prefer USDC since USDT is not available
      const preferredFromSymbol =
        currentNetwork?.name === "Base" ? "USDC" : "USDT";
      const fromAsset =
        availableAssets.find((a) => a.symbol === preferredFromSymbol) ||
        availableAssets.find((a) => a.symbol === "USDC") ||
        availableAssets[0];

      // Always prefer CNGN for "To" currency, but ensure it's different from "From"
      const toAsset =
        availableAssets.find(
          (a) => a.symbol === "CNGN" && a.symbol !== fromAsset?.symbol,
        ) ||
        availableAssets.find((a) => a.symbol !== fromAsset?.symbol) ||
        availableAssets[1] ||
        availableAssets[0];

      if (fromAsset) {
        setSelectedCurrency(fromAsset);
        updateSelection({ asset: fromAsset } as unknown as Record<
          string,
          unknown
        >);
      }
      if (toAsset) {
        setSelectedToCurrency(toAsset);
      }
    }
  }, [
    availableAssets,
    currentNetwork,
    selectedCurrency,
    selectedToCurrency,
    updateSelection,
  ]);

  // Used to show wallet requirement in the network modal
  // const canSwitchNetwork = () => {
  //   return evmConnected;
  // };

  // Update handleNetworkSelect to use global state
  const handleNetworkSelect = async (network: Network) => {
    setCurrentNetwork(network);
  };

  const handleCurrencyChange = (currency: Asset) => {
    // Prevent selecting the same currency for both From and To
    if (selectedToCurrency && currency.symbol === selectedToCurrency.symbol) {
      // If user tries to select the same currency as "To", swap them
      handleSwapCurrencies();
      return;
    }

    setSelectedCurrency(currency);
    // Update global store with selected currency
    updateSelection({
      asset: currency,
    } as unknown as Record<string, unknown>);
  };

  const handleToCurrencyChange = (currency: Asset) => {
    // Prevent selecting the same currency for both From and To
    if (selectedCurrency && currency.symbol === selectedCurrency.symbol) {
      // If user tries to select the same currency as "From", swap them
      handleSwapCurrencies();
      return;
    }

    setSelectedToCurrency(currency);
  };

  const handleSwapCurrencies = () => {
    if (!selectedCurrency || !selectedToCurrency) {
      return;
    }

    // Prevent swapping if currencies are the same
    if (selectedCurrency.symbol === selectedToCurrency.symbol) {
      return;
    }

    // Swap the from and to currencies
    const tempFromCurrency = selectedCurrency;
    const tempToCurrency = selectedToCurrency;
    const tempFromAmount = amount;
    const tempToAmount = toAmount;

    // Set the new currencies
    setSelectedCurrency(tempToCurrency);
    setSelectedToCurrency(tempFromCurrency);

    // Swap the amounts as well
    setAmount(tempToAmount);
    setToAmount(tempFromAmount);

    // Update global store with the new "from" currency
    updateSelection({
      asset: tempToCurrency,
    } as unknown as Record<string, unknown>);
  };

  // Sync selectedCurrency with global asset on mount
  useEffect(() => {
    const allowedSymbols = new Set(["USDC", "USDT", "CNGN"]);
    // If global asset exists and differs, but is not allowed, coerce to appropriate default
    if (
      userSelectionStore.asset &&
      (!allowedSymbols.has(userSelectionStore.asset.symbol) ||
        !availableAssets.find(
          (a) => a.symbol === userSelectionStore.asset?.symbol,
        ))
    ) {
      if (availableAssets.length > 0) {
        // Prefer USDC on Base, USDT on other networks
        const preferredSymbol =
          currentNetwork?.name === "Base" ? "USDC" : "USDT";
        const preferred =
          availableAssets.find((a) => a.symbol === preferredSymbol) ||
          availableAssets[0];
        setSelectedCurrency(preferred);
        updateSelection({ asset: preferred });

        // Set appropriate "to" currency (different from "from")
        const toCurrency =
          availableAssets.find(
            (a) => a.symbol === "CNGN" && a.symbol !== preferred.symbol,
          ) ||
          availableAssets.find((a) => a.symbol !== preferred.symbol) ||
          availableAssets[0];
        setSelectedToCurrency(toCurrency);
      }
      return;
    }

    if (
      userSelectionStore.asset &&
      userSelectionStore.asset !== selectedCurrency
    ) {
      setSelectedCurrency(userSelectionStore.asset);
      // Set appropriate "to" currency (different from "from")
      const toCurrency =
        availableAssets.find(
          (a) =>
            a.symbol === "CNGN" &&
            a.symbol !== userSelectionStore.asset?.symbol,
        ) ||
        availableAssets.find(
          (a) => a.symbol !== userSelectionStore.asset?.symbol,
        ) ||
        availableAssets[0];
      setSelectedToCurrency(toCurrency);
    } else if (!userSelectionStore.asset) {
      // Set global asset to appropriate default
      const preferredSymbol = currentNetwork?.name === "Base" ? "USDC" : "USDT";
      const defaultAsset =
        availableAssets.find((a) => a.symbol === preferredSymbol) ||
        availableAssets[0] ||
        assets.find((a) => allowedSymbols.has(a.symbol)) ||
        assets[0];
      if (defaultAsset) {
        setSelectedCurrency(defaultAsset);
        updateSelection({ asset: defaultAsset });

        // Set appropriate "to" currency (different from "from")
        const toCurrency =
          availableAssets.find(
            (a) => a.symbol === "CNGN" && a.symbol !== defaultAsset.symbol,
          ) ||
          availableAssets.find((a) => a.symbol !== defaultAsset.symbol) ||
          availableAssets[0];
        setSelectedToCurrency(toCurrency);
      }
    }
  }, [
    userSelectionStore.asset,
    selectedCurrency,
    availableAssets,
    updateSelection,
    currentNetwork,
  ]);

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

  // Handle swap button click
  const handleSwapClick = async () => {
    // If showing success message, reset it and allow new swap
    if (showSuccessMessage) {
      setShowSuccessMessage(false);
      return;
    }

    if (!selectedCurrency || !selectedToCurrency || !amount || amount === "0") {
      return;
    }

    try {
      await swap({
        tokenASymbol: selectedCurrency.symbol,
        tokenBSymbol: selectedToCurrency.symbol,
        amountIn: amount,
        slippage: 2.5, // 0.5% slippage tolerance
        deadline: 20, // 20 minutes
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Swap failed";
      toast.error(message);
    }
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  // Determine if swap should be disabled
  const isSwapDisabled =
    !showSuccessMessage &&
    (!isAmountValid ||
      !evmConnected ||
      !selectedCurrency ||
      !selectedToCurrency ||
      selectedCurrency.symbol === selectedToCurrency.symbol || // Prevent same token swap
      !amount ||
      amount === "0" ||
      swapState.isLoading ||
      swapState.isApproving ||
      swapState.isSwapping);

  // Determine swap step message based on state
  const getSwapStepMessage = () => {
    if (showSuccessMessage) {
      return "Swap Complete!";
    }
    if (swapState.isApproving) {
      return "Approving token...";
    }
    if (swapState.isSwapping) {
      return "Processing swap...";
    }
    if (swapState.error) {
      return "Retry swap";
    }
    return "Processing...";
  };

  // Determine if swap is in loading state
  const isSwapLoading =
    swapState.isLoading || swapState.isApproving || swapState.isSwapping;

  // Show status action sheet when processing, success, or error
  const showStatusSheet =
    swapState.isApproving ||
    swapState.isSwapping ||
    swapState.error ||
    showSuccessMessage;

  const getStatusSheetStatus = (): SwapStatus => {
    if (showSuccessMessage) return "success";
    if (swapState.error) return "error";
    return "processing";
  };

  const getStatusSheetStepMessage = (): string => {
    if (swapState.isApproving) return "Approving token...";
    if (swapState.isSwapping) return "Processing swap...";
    return "Processing...";
  };

  const handleStatusSheetClose = () => {
    clearProcessingSession("swap");
    if (swapState.error) {
      clearError();
    }
    if (showSuccessMessage) {
      setShowSuccessMessage(false);
    }
  };

  const isSwapProcessing =
    showStatusSheet && getStatusSheetStatus() === "processing";
  const sessionStartTime = useProcessingSession(
    isSwapProcessing ? "swap" : undefined
  );

  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SwapPanelHeader
          selectedNetwork={currentNetwork || undefined}
          onNetworkChange={handleNetworkSelect}
          availableNetworks={networks}
          onSettingsClick={handleSettingsClick}
        />
      </motion.div>

      {/* Swap Panels */}
      {selectedCurrency && selectedToCurrency ? (
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <CurrencyPanel
              title="From"
              selectedCurrency={selectedCurrency}
              onCurrencyChange={handleCurrencyChange}
              availableAssets={availableAssets}
              amount={amount}
              balance={fromBalance.formatted}
              isFrom={true}
              onAmountChange={setAmount}
              excludeCurrency={selectedToCurrency || undefined}
              onMaxClick={() => {
                // Refresh balance first, then set amount to the full balance
                fromBalance.refetch();
                if (fromBalance.formatted && fromBalance.formatted !== "--") {
                  const maxAmount = fromBalance.formatted.replace(/,/g, ""); // Remove commas if any
                  setAmount(maxAmount);
                }
              }}
            />
          </motion.div>

          {/* Arrow in the middle */}
          <SwapArrow disabled={false} onClick={handleSwapCurrencies} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          >
            <CurrencyPanel
              title="To"
              selectedCurrency={selectedToCurrency}
              onCurrencyChange={handleToCurrencyChange}
              availableAssets={availableAssets}
              amount={toAmount}
              balance={toBalance.formatted}
              isFrom={false}
              excludeCurrency={selectedCurrency || undefined}
            />
          </motion.div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-8">
          <span className="text-neutral-400">Loading currencies...</span>
        </div>
      )}

      {/* Exchange Rate and Slippage Display */}
      {selectedCurrency && selectedToCurrency && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
          <ExchangeRateDisplay
            fromCurrency={selectedCurrency.symbol}
            toCurrency={selectedToCurrency.symbol}
            rate={exchangeRate}
            slippage="2.5%"
          />
        </motion.div>
      )}

      {/* Swap Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <div className="px-3 md:px-4 mt-4">
          {!evmConnected ? (
            <SwipeToSwapButton
              onSwapComplete={handleConnectWallet}
              disabled={true}
              disabledMessage="Connect Wallet to Swap"
            />
          ) : (
            <SwipeToSwapButton
              onSwapComplete={handleSwapClick}
              stepMessage={getSwapStepMessage()}
              disabled={isSwapDisabled}
              isLoading={isSwapLoading}
              disabledMessage="Complete form to enable swap"
            />
          )}
        </div>
      </motion.div>

      {/* Status Action Sheet - processing, success, or error */}
      {showStatusSheet && (
        <SwapStatusActionSheet
          status={getStatusSheetStatus()}
          stepMessage={getStatusSheetStepMessage()}
          errorMessage={swapState.error}
          swapHash={swapState.swapHash}
          fromSymbol={selectedCurrency?.symbol}
          toSymbol={selectedToCurrency?.symbol}
          onClose={handleStatusSheetClose}
          sessionStartTime={sessionStartTime}
        />
      )}

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#181818] p-6 rounded-2xl border border-[#232323] max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">
                Connect Wallet
              </h3>
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
