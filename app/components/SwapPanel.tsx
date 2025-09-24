"use client";

import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAerodromeSwap } from "@/hooks/useAerodromeSwap";
import { useAmountStore } from "@/store/amount-store";
import { useNetworkStore } from "@/store/network";
import { useUserSelectionStore } from "@/store/user-selection";
import {
  Asset,
  Network,
} from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { SwapButton } from "./buttons/SwapButton";
import { FromPanel } from "./panels/FromPanel";
import { SwapArrow } from "./panels/SwapArrow";
import { SwapHeader } from "./panels/SwapHeader";
import { CurrencyPanel } from "./panels/CurrencyPanel";
import { ModalConnectButton } from "./wallet/modal-connect-button";
import { ExchangeRateDisplay } from "./ExchangeRateDisplay";

const networks: Network[] = SUPPORTED_NETWORKS_WITH_RPC_URLS;

export function SwapPanel() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const userSelectionStore = useUserSelectionStore();
  const {
    updateSelection,
  } = userSelectionStore;
  const { currentNetwork, setCurrentNetwork } = useNetworkStore();

  // Get available assets for the current network (USDC/USDT and cNGN for swap mode)
  const availableAssets = useMemo(() => {
    const allowedSymbols = new Set(["USDC", "USDT", "CNGN"]);
    console.log("🔍 Filtering assets for network:", currentNetwork?.name);
    
    if (!currentNetwork) {
      const filtered = assets.filter((a) => allowedSymbols.has(a.symbol));
      console.log("📦 No network selected, available assets:", filtered.map(a => a.symbol));
      return filtered;
    }

    const filtered = assets.filter((asset) => {
      const networkConfig = asset.networks[currentNetwork.name];
      // USDT is not available on Base network
      if (currentNetwork.name === "Base" && asset.symbol === "USDT") {
        console.log("⚠️ Filtering out USDT on Base network");
        return false;
      }
      const hasValidConfig = !!networkConfig && allowedSymbols.has(asset.symbol) && networkConfig.tokenAddress !== "";
      
      if (!hasValidConfig) {
        console.log(`❌ ${asset.symbol} not available on ${currentNetwork.name}: config=${!!networkConfig}, address=${networkConfig?.tokenAddress || 'none'}`);
      } else {
        console.log(`✅ ${asset.symbol} available on ${currentNetwork.name}: address=${networkConfig.tokenAddress}`);
      }
      
      return hasValidConfig;
    });
    
    console.log("📦 Final available assets:", filtered.map(a => a.symbol));
    return filtered;
  }, [currentNetwork]);

  const [selectedCurrency, setSelectedCurrency] = useState<Asset | null>(null);

  // Add second currency for "To" panel  
  const [selectedToCurrency, setSelectedToCurrency] = useState<Asset | null>(null);

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
    markSuccessHandled
  } = useAerodromeSwap();

  // Refetch balances when currency changes (especially for CNGN)
  useEffect(() => {
    if (selectedCurrency?.symbol === "CNGN") {
      console.log("🔄 CNGN selected, refreshing balance...");
      fromBalance.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency?.symbol]);

  useEffect(() => {
    if (selectedToCurrency?.symbol === "CNGN") {
      console.log("🔄 CNGN selected as To currency, refreshing balance...");
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
          const quote = await getQuote(selectedCurrency.symbol, selectedToCurrency.symbol, amount);
          if (quote) {
            setToAmount(parseFloat(quote.amountOut).toFixed(2));
            // Calculate the exchange rate (how much "to currency" per 1 "from currency")
            const rate = parseFloat(quote.amountOut) / parseFloat(amount);
            setExchangeRate(rate.toFixed(0)); // Use whole number for readability
            console.log(`💱 Quote: ${amount} ${selectedCurrency.symbol} = ${quote.amountOut} ${selectedToCurrency.symbol}, Rate: 1 ${selectedCurrency.symbol} = ${rate.toFixed(0)} ${selectedToCurrency.symbol}`);
          }
        } catch (error) {
          console.error("Error fetching quote:", error);
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
      console.log("✅ Token approval successful");
    }
  }, [isApprovalSuccess]);

  // Handle successful swap and refresh balances
  useEffect(() => {
    if (isSwapSuccess) {
      console.log("✅ Swap completed successfully");
      
      // Mark success as handled to prevent infinite loop
      markSuccessHandled();
      
      // Reset amounts first
      setAmount("0");
      setToAmount("0.00");
      
      // Refresh balances after successful swap with a small delay
      setTimeout(() => {
        fromBalance.refetch();
        toBalance.refetch();
        console.log("🎉 Swap completed - balances refreshed");
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSwapSuccess]);

  // Initialize currencies after availableAssets is calculated
  useEffect(() => {
    if (availableAssets.length > 0 && (!selectedCurrency || !selectedToCurrency)) {
      console.log("🔄 Initializing currencies for network:", currentNetwork?.name);
      console.log("Available assets:", availableAssets.map(a => a.symbol));
      
      // On Base, prefer USDC since USDT is not available
      const preferredFromSymbol = currentNetwork?.name === "Base" ? "USDC" : "USDT";
      const fromAsset = availableAssets.find(a => a.symbol === preferredFromSymbol) || 
        availableAssets.find(a => a.symbol === "USDC") || 
        availableAssets[0];
      
      // Always prefer CNGN for "To" currency, but ensure it's different from "From"
      const toAsset = availableAssets.find(a => a.symbol === "CNGN" && a.symbol !== fromAsset?.symbol) || 
        availableAssets.find(a => a.symbol !== fromAsset?.symbol) || 
        availableAssets[1] || availableAssets[0];
      
      console.log("🚀 Setting From currency:", fromAsset?.symbol);
      console.log("🎯 Setting To currency:", toAsset?.symbol);
      
      if (fromAsset) {
        setSelectedCurrency(fromAsset);
        updateSelection({ asset: fromAsset } as unknown as Record<string, unknown>);
      }
      if (toAsset) {
        setSelectedToCurrency(toAsset);
      }
    }
  }, [availableAssets, currentNetwork, selectedCurrency, selectedToCurrency, updateSelection]);

  // Used to show wallet requirement in the network modal
  const canSwitchNetwork = () => {
    return evmConnected;
  };

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
      console.log("⚠️ Cannot swap - one or both currencies not selected");
      return;
    }
    
    console.log("🔄 Swapping currencies...");
    console.log("Before swap - From:", selectedCurrency.symbol, "To:", selectedToCurrency.symbol);
    console.log("Current network:", currentNetwork?.name);
    
    // Prevent swapping if currencies are the same
    if (selectedCurrency.symbol === selectedToCurrency.symbol) {
      console.log("⚠️ Cannot swap same currencies");
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
    
    console.log("After swap - From:", tempToCurrency.symbol, "To:", tempFromCurrency.symbol);
  };

  // Sync selectedCurrency with global asset on mount
  useEffect(() => {
    const allowedSymbols = new Set(["USDC", "USDT", "CNGN"]);
    // If global asset exists and differs, but is not allowed, coerce to appropriate default
    if (
      userSelectionStore.asset &&
      (!allowedSymbols.has(userSelectionStore.asset.symbol) ||
        !availableAssets.find((a) => a.symbol === userSelectionStore.asset?.symbol))
    ) {
      if (availableAssets.length > 0) {
        // Prefer USDC on Base, USDT on other networks
        const preferredSymbol = currentNetwork?.name === "Base" ? "USDC" : "USDT";
        const preferred = availableAssets.find((a) => a.symbol === preferredSymbol) || availableAssets[0];
        setSelectedCurrency(preferred);
        updateSelection({ asset: preferred });
        
        // Set appropriate "to" currency (different from "from")
        const toCurrency = availableAssets.find((a) => a.symbol === "CNGN" && a.symbol !== preferred.symbol) || 
          availableAssets.find((a) => a.symbol !== preferred.symbol) || availableAssets[0];
        setSelectedToCurrency(toCurrency);
      }
      return;
    }

    if (userSelectionStore.asset && userSelectionStore.asset !== selectedCurrency) {
      setSelectedCurrency(userSelectionStore.asset);
      // Set appropriate "to" currency (different from "from")
      const toCurrency = availableAssets.find((a) => a.symbol === "CNGN" && a.symbol !== userSelectionStore.asset?.symbol) || 
        availableAssets.find((a) => a.symbol !== userSelectionStore.asset?.symbol) || availableAssets[0];
      setSelectedToCurrency(toCurrency);
    } else if (!userSelectionStore.asset) {
      // Set global asset to appropriate default
      const preferredSymbol = currentNetwork?.name === "Base" ? "USDC" : "USDT";
      const defaultAsset = availableAssets.find((a) => a.symbol === preferredSymbol) ||
        availableAssets[0] ||
        assets.find((a) => allowedSymbols.has(a.symbol)) ||
        assets[0];
      if (defaultAsset) {
        setSelectedCurrency(defaultAsset);
        updateSelection({ asset: defaultAsset });
        
        // Set appropriate "to" currency (different from "from")
        const toCurrency = availableAssets.find((a) => a.symbol === "CNGN" && a.symbol !== defaultAsset.symbol) || 
          availableAssets.find((a) => a.symbol !== defaultAsset.symbol) || availableAssets[0];
        setSelectedToCurrency(toCurrency);
      }
    }
  }, [userSelectionStore.asset, selectedCurrency, availableAssets, updateSelection, currentNetwork]);

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
    if (!selectedCurrency || !selectedToCurrency || !amount || amount === "0") {
      console.log("Missing required swap parameters");
      return;
    }

    try {
      console.log("🔄 Starting swap:", selectedCurrency.symbol, "→", selectedToCurrency.symbol, "Amount:", amount);
      
      await swap({
        tokenASymbol: selectedCurrency.symbol,
        tokenBSymbol: selectedToCurrency.symbol,
        amountIn: amount,
        slippage: 2.5, // 2.5% slippage tolerance
        deadline: 20, // 20 minutes
      });

      console.log("✅ Swap initiated successfully");
    } catch (error) {
      console.error("❌ Swap failed:", error);
    }
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  // Determine if swap should be disabled
  const isSwapDisabled = !isAmountValid || 
    !evmConnected || 
    !selectedCurrency || 
    !selectedToCurrency ||
    selectedCurrency.symbol === selectedToCurrency.symbol || // Prevent same token swap
    !amount || 
    amount === "0" ||
    swapState.isLoading ||
    swapState.isApproving ||
    swapState.isSwapping;

  // Determine swap button text based on state
  const getSwapButtonText = () => {
    if (swapState.isApproving) {
      return "Approving Token...";
    }
    if (swapState.isSwapping) {
      return "Swapping...";
    }
    if (swapState.error) {
      return "Try Again";
    }
    return "Swap";
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SwapHeader
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
                  const maxAmount = fromBalance.formatted.replace(/,/g, ''); // Remove commas if any
                  setAmount(maxAmount);
                }
              }}
            />
          </motion.div>

          {/* Arrow in the middle */}
          <SwapArrow
            disabled={false}
            onClick={handleSwapCurrencies}
          />

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

      {/* Swap Status Messages */}
      {(swapState.error || swapState.isApproving || swapState.isSwapping) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 md:mx-4 mb-2"
        >
          <div className={`p-3 rounded-lg text-sm ${
            swapState.error 
              ? "bg-red-900/20 border border-red-500/30 text-red-400"
              : "bg-blue-900/20 border border-blue-500/30 text-blue-400"
          }`}>
            {swapState.error && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span>❌</span>
                  <span className="font-medium">Swap Error</span>
                </div>
                <div className="text-xs opacity-80">{swapState.error}</div>
              </>
            )}
            {swapState.isApproving && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Approving {selectedCurrency?.symbol} for swapping...</span>
              </div>
            )}
            {swapState.isSwapping && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing swap: {selectedCurrency?.symbol} → {selectedToCurrency?.symbol}</span>
              </div>
            )}
          </div>
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
            <SwapButton 
              onClick={handleConnectWallet} 
              text="Connect Wallet to Swap" 
            />
          ) : (
            <SwapButton 
              onClick={handleSwapClick} 
              text={getSwapButtonText()}
              disabled={isSwapDisabled}
            />
          )}
        </div>
      </motion.div>

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
