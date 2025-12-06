"use client";

import Image from "next/image";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useUserSelectionStore } from "@/src/store/user-selection";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useAmountStore } from "@/src/store/amount-store";
import { SwapArrow } from "@/src/components/panels/SwapArrow";
import SelectInstitution from "@/src/components/select-institution";
import { SwipeToWithdrawButton } from "@/src/components/payment/swipe-to-withdraw";
//
import SelectCountry from "@/src/components/select-country";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useKYCStore } from "@/src/store/kyc-store";
import { useNetworkStore } from "@/src/store/network";
import { useMutation } from "@tanstack/react-query";
import { createQuoteOut } from "@/src/actions/quote";
import { createTransferOut } from "@/src/actions/transfer";
import useEVMPay from "@/src/hooks/useEVMPay";
import { ModalConnectButton } from "@/src/components/wallet/modal-connect-button";
import { toast } from "sonner";
import {
  AppState,
  ChainTypes,
  OrderStep,
  Quote,
  Transfer,
  TransferType,
} from "@/types";
import { useTokenBalance } from "@/src/hooks/useTokenBalance";
import {
  getCNGNKYCThreshold,
  getCNGNToNGNRate,
} from "@/src/lib/exchange-rates-data";
import {
  useWithdrawRatesSuspense,
  useWithdrawInstitutionsSuspense,
} from "../hooks/use-withdraw-suspense";
import { useKYCStatusSuspense } from "@/src/hooks/useKYCSuspense";
import { verifyKYC } from "@/src/utils/kyc-verification";

export default function CNGNWithdrawPanel() {
  const userSelection = useUserSelectionStore();
  const { country, institution, accountNumber, asset, paymentMethod } =
    userSelection;
  const { isConnected: evmConnected, address, chainId } = useWalletGetInfo();
  const { isValid: isAmountValid, amount, setAmount } = useAmountStore();
  const { currentNetwork } = useNetworkStore();
  const { setQuote } = useQuoteStore();
  const { setTransfer, setTransactionHash } = useTransferStore();
  const { payWithEVM } = useEVMPay();

  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [swipeButtonReset, setSwipeButtonReset] = useState(false);

  const { setShowKYCModal } = useKYCStore();

  // Allow selecting any supported country when cNGN is selected (no lock)

  const { data: kycData } = useKYCStatusSuspense({
    address: address || "",
  });

  // Get payment method for exchange rates
  const currentPaymentMethod = paymentMethod || "momo";

  // Fetch exchange rates via suspense hook
  const { data: exchangeRates } = useWithdrawRatesSuspense({
    orderType: "selling",
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
  const institutionsSuspenseData = useWithdrawInstitutionsSuspense({
    method: "buy", // Withdraw uses "buy" method for institutions (selling crypto = buying fiat)
  });

  // Extract institutions for selected country from suspense data
  const institutionsForCountry = useMemo(() => {
    if (!country?.countryCode || !institutionsSuspenseData.data) return [];
    return institutionsSuspenseData.data[country.countryCode] || [];
  }, [country?.countryCode, institutionsSuspenseData.data]);

  // Token balance for current asset (cNGN), like SwapPanel's FromPanel
  const {
    formatted: tokenBalance,
    isLoading: balanceLoading,
    allNetworkBalances,
  } = useTokenBalance(asset?.symbol || "cNGN");

  const isCurrentTokenSupported = !!(
    asset?.networks &&
    currentNetwork?.name &&
    asset.networks[currentNetwork.name as keyof typeof asset.networks]
  );

  const getCurrentBalance = () => {
    if (balanceLoading) return "...";
    const currentChainId = currentNetwork?.chainId;
    let balance = "0";

    if (
      isCurrentTokenSupported &&
      currentChainId &&
      allNetworkBalances?.[currentChainId]
    ) {
      if (allNetworkBalances[currentChainId].isLoading) return "...";
      balance = allNetworkBalances[currentChainId].formatted;
    } else {
      // Fallback: show first non-zero balance across networks if available
      const firstNonZero = Object.values(allNetworkBalances || {}).find(
        (b) => parseFloat(b.formatted) > 0
      );
      balance = firstNonZero ? firstNonZero.formatted : tokenBalance;
    }

    const balanceNumber = parseFloat(balance || "0");
    const gasBuffer = 0.01;
    const adjustedBalance = Math.max(0, balanceNumber - gasBuffer);
    return adjustedBalance.toFixed(2);
  };

  const getMaxBalance = () => {
    const currentChainId = currentNetwork?.chainId;
    let balance = "0";
    if (
      isCurrentTokenSupported &&
      currentChainId &&
      allNetworkBalances?.[currentChainId]
    ) {
      balance = allNetworkBalances[currentChainId].formatted;
    } else {
      const firstNonZero = Object.values(allNetworkBalances || {}).find(
        (b) => parseFloat(b.formatted) > 0
      );
      balance = firstNonZero ? firstNonZero.formatted : tokenBalance;
    }
    const balanceNumber = parseFloat(balance || "0");
    const gasBuffer = 0.01;
    const adjustedBalance = Math.max(0, balanceNumber - gasBuffer);
    return adjustedBalance.toFixed(2);
  };

  const canClickMax = () => {
    return evmConnected && parseFloat(getCurrentBalance()) > 0;
  };

  const handleMaxClick = () => {
    if (!canClickMax()) return;
    setAmount(getMaxBalance());
  };

  // Auto-resize input width based on content (Uniswap-like)
  const mirrorRef = useRef<HTMLSpanElement | null>(null);
  const [inputWidth, setInputWidth] = useState<number>(112);
  useEffect(() => {
    if (!mirrorRef.current) return;
    const text = amount && amount.length > 0 ? amount : "0.00";
    mirrorRef.current.textContent = text;
    const measured = mirrorRef.current.offsetWidth + 8; // small padding
    const clamped = Math.min(Math.max(measured, 112), 320);
    setInputWidth(clamped);
  }, [amount]);

  // Validate amount does not exceed user's balance
  // For withdraw, amount is in crypto (cNGN), so we compare directly
  const exceedsBalance = useMemo(() => {
    if (!amount || !evmConnected) return false;
    if (balanceLoading) return false;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return false;

    // Compute balance similar to getCurrentBalance() but without gas buffer for comparison
    const currentChainId = currentNetwork?.chainId;
    let balance = "0";

    if (
      isCurrentTokenSupported &&
      currentChainId &&
      allNetworkBalances?.[currentChainId]
    ) {
      if (allNetworkBalances[currentChainId].isLoading) return false;
      balance = allNetworkBalances[currentChainId].formatted;
    } else {
      // Fallback: show first non-zero balance across networks if available
      const firstNonZero = Object.values(allNetworkBalances || {}).find(
        (b) => parseFloat(b.formatted) > 0
      );
      balance = firstNonZero ? firstNonZero.formatted : tokenBalance;
    }

    const balanceNumber = parseFloat(balance || "0");
    const gasBuffer = 0.01;
    const adjustedBalance = Math.max(0, balanceNumber - gasBuffer);
    const numericBalance = adjustedBalance;

    if (isNaN(numericBalance)) return false;
    if (numericBalance <= 0) return true; // No balance available

    return numericAmount > numericBalance;
  }, [
    amount,
    balanceLoading,
    evmConnected,
    currentNetwork?.chainId,
    isCurrentTokenSupported,
    allNetworkBalances,
    tokenBalance,
  ]);

  const isWithdrawDisabled = useMemo(
    () =>
      !isAmountValid ||
      exceedsBalance ||
      !country ||
      !institution ||
      !accountNumber ||
      !evmConnected ||
      !amount ||
      amount.trim().length === 0 ||
      parseFloat(amount || "0") <= 0 ||
      (userSelection.paymentMethod === "bank" &&
        userSelection.appState === AppState.Processing),
    [
      isAmountValid,
      exceedsBalance,
      country,
      institution,
      accountNumber,
      evmConnected,
      amount,
      userSelection.paymentMethod,
      userSelection.appState,
    ]
  );

  // Create transfer payload (same logic as SwapPanel)
  const createTransferPayload = useCallback(
    (quoteId: string) => {
      if (!country) {
        throw new Error("Missing country");
      }

      // Allow MoMo transactions under the asset-specific ~$100 threshold to bypass full KYC
      const numericAmount = parseFloat(String(amount || 0));
      const cngnThreshold = getCNGNKYCThreshold(); // Dynamic: ~$1000 in NGN based on current exchange rate
      const usdThreshold = 100;
      const isCngn = (asset?.symbol || "") === "cNGN";
      const threshold = isCngn ? cngnThreshold : usdThreshold;
      const allowKycBypassForMomo =
        userSelection.paymentMethod === "momo" &&
        country?.countryCode !== "NG" &&
        country?.countryCode !== "ZA" &&
        numericAmount > 0 &&
        numericAmount < threshold;

      if (!kycData?.fullKYC && !allowKycBypassForMomo) {
        throw new Error("KYC required");
      }

      const fullKYCObj: {
        fullName?: string;
        nationality?: string;
        dateOfBirth?: string;
        documentNumber?: string;
        documentType?: string;
        documentSubType?: string;
        phoneNumber?: string;
      } = (kycData?.fullKYC as unknown as Record<string, unknown>) || {};
      const {
        fullName = "",
        nationality = country.name || "",
        dateOfBirth,
        documentNumber,
        documentType,
        documentSubType,
        phoneNumber = "",
      } = fullKYCObj;

      // Blank out ID fields if bypassing KYC
      const effectiveDOB = allowKycBypassForMomo ? "" : dateOfBirth || "";
      const effectiveDocumentType = allowKycBypassForMomo
        ? ""
        : documentType || "";
      const effectiveDocumentSubType = allowKycBypassForMomo
        ? ""
        : documentSubType || "";
      const effectiveDocumentNumber = allowKycBypassForMomo
        ? ""
        : documentNumber || "";

      let updatedDocumentType = effectiveDocumentType;
      let updatedDocumentTypeSubType = effectiveDocumentSubType;

      if (country.countryCode === "NG") {
        updatedDocumentTypeSubType = "BVN";
        updatedDocumentType = "NIN";
      } else if (effectiveDocumentType === "ID") {
        updatedDocumentType = "NIN";
      } else if (effectiveDocumentType === "P") {
        updatedDocumentType = "Passport";
      } else {
        updatedDocumentType = "License";
      }

      const baseUserDetails = {
        name:
          country.countryCode === "NG" && userSelection.accountName
            ? userSelection.accountName
            : fullName,
        country: country.countryCode || "",
        address: nationality || country.name || "",
        dob: effectiveDOB,
        idNumber: effectiveDocumentNumber,
        idType: updatedDocumentType,
        additionalIdType: updatedDocumentType,
        additionalIdNumber: updatedDocumentTypeSubType,
      };

      const isNigeriaOrSouthAfrican =
        country.countryCode === "NG" || country.countryCode === "ZA";

      if (userSelection.paymentMethod === "momo") {
        if (isNigeriaOrSouthAfrican) {
          if (!phoneNumber)
            throw new Error("Phone number required for Nigeria/SA");

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

          const accountNumberWithoutLeadingZero = accountNumber.replace(
            /^0+/,
            ""
          );
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

      if (userSelection.paymentMethod === "bank") {
        const accountName =
          userSelection.accountName === "OK"
            ? fullName
            : userSelection.accountName || fullName;

        if (isNigeriaOrSouthAfrican) {
          if (!phoneNumber)
            throw new Error(
              "Phone number required for Nigeria/SA bank transfers"
            );
          if (!institution || !accountNumber) {
            throw new Error(
              "Institution and account number required for Nigeria/SA bank transfers"
            );
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
              phone: phoneNumber, // Use KYC phone
            },
          };
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
    },
    [country, kycData, userSelection, institution, accountNumber, amount, asset]
  );

  const handleWithdrawTransfer = useCallback(async () => {
    if (
      !country ||
      !institution ||
      !accountNumber ||
      !asset ||
      !currentNetwork ||
      !amount ||
      !address
    ) {
      throw new Error("Missing required data for withdrawal");
    }

    setStepMessage("Checking rates...");

    const quotePayload = {
      address: address,
      cryptoType: asset.symbol,
      ...(asset.symbol === "cNGN"
        ? { fiatAmount: amount }
        : { cryptoAmount: amount }),
      fiatType: country.currency,
      country: country.countryCode,
      network: currentNetwork.name.toLowerCase(),
    };

    const quoteResponse = await createQuoteOut(quotePayload);
    if (!quoteResponse?.quote?.quoteId) {
      throw new Error("No quote ID received from quote response");
    }

    setStepMessage("Setting up withdrawal...");
    const transferPayload = createTransferPayload(quoteResponse.quote.quoteId);
    const transferResponse = await createTransferOut(transferPayload);

    return {
      quote: quoteResponse,
      transfer: transferResponse,
    };
  }, [
    country,
    institution,
    accountNumber,
    asset,
    currentNetwork,
    amount,
    address,
    createTransferPayload,
  ]);

  const makeBlockchainTransaction = async (
    quote: Quote,
    transfer: Transfer
  ) => {
    if (!asset || !currentNetwork || !quote || !transfer) {
      setWithdrawLoading(false);
      return;
    }

    if (chainId !== currentNetwork.chainId) {
      setWithdrawLoading(false);
      return;
    }

    const networkName = currentNetwork.name;
    const contractAddress = asset.networks[networkName]?.tokenAddress;
    if (!contractAddress) {
      setWithdrawLoading(false);
      return;
    }

    try {
      const recipient = transfer.transferAddress;
      const finalAmount =
        quote.transferType === TransferType.TransferOut
          ? quote.amountPaid
          : quote.fiatAmount;

      const transactionPayload = {
        recipient,
        amount: finalAmount.toString(),
        tokenAddress: contractAddress,
      };

      payWithEVM(transactionPayload, handleEVMPaySuccess, handleEVMPayFailed);
    } catch {
      setWithdrawLoading(false);
      userSelection.updateSelection({ appState: AppState.Idle });
    }
  };

  const submitMutation = useMutation({
    mutationFn: handleWithdrawTransfer,
    onSuccess: (data) => {
      if (data?.quote) setQuote(data.quote.quote);
      if (data?.transfer) {
        setTransfer(data.transfer);
        if (
          currentNetwork?.type === ChainTypes.EVM &&
          data.quote &&
          data.transfer
        ) {
          setStepMessage("Opening in Wallet...");
          makeBlockchainTransaction(data.quote.quote, data.transfer);
        } else {
          userSelection.updateSelection({
            orderStep: OrderStep.GotTransfer,
            appState: AppState.Idle,
          });
          setWithdrawLoading(false);
        }
      }
    },
    onError: () => {
      setWithdrawLoading(false);
      setStepMessage("");
      userSelection.updateSelection({
        appState: AppState.Idle,
        orderStep: OrderStep.Initial,
      });
    },
  });

  const handleEVMPaySuccess = async (txHash: string) => {
    setTransactionHash(txHash);
    setStepMessage("Transaction Complete!");
    setTimeout(() => {
      setWithdrawLoading(false);
      setStepMessage("");
      userSelection.updateSelection({
        orderStep: OrderStep.ProcessingPayment,
        appState: AppState.Idle,
      });
    }, 1000);
  };

  const handleEVMPayFailed = () => {
    setWithdrawLoading(false);
    setStepMessage("");
    userSelection.updateSelection({
      appState: AppState.Idle,
      orderStep: OrderStep.PaymentFailed,
    });
  };

  const handleWithdrawComplete = () => {
    if (!isAmountValid || !country || !institution || !accountNumber) return;

    // Check balance before proceeding
    if (exceedsBalance) {
      toast.error("Insufficient balance for this amount");
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100);
      return;
    }

    const kycResult = verifyKYC({
      amount: amount || 0,
      country: country || null,
      asset: asset || null,
      paymentMethod: paymentMethod || null,
      kycData: kycData || null,
      exchangeRate:
        exchangeRate?.exchange || country?.exchangeRate || undefined,
      orderType: "buying",
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

    setWithdrawLoading(true);
    setStepMessage("Checking rates...");
    userSelection.updateSelection({ appState: AppState.Processing });
    submitMutation.mutate();
  };

  const handleConnectWallet = () => setShowWalletModal(true);
  const handleStartKYC = () => {
    if (kycData && kycData.kycStatus !== "VERIFIED") {
      setShowKYCModal(true);
      toast.error("KYC verification required");
      return;
    }
  };

  return (
    <div className="flex flex-col gap-1 md:mt-5">
      {/* From (custom cNGN token input) */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative h-[115px]">
        <div className="flex items-center justify-between ">
          <span className="text-neutral-200 text-base md:text-lg font-medium">
            From
          </span>
          <span className="text-neutral-400 text-xs md:text-sm">
            Balance: {getCurrentBalance()}{" "}
            <span
              className={`ml-1 cursor-pointer ${
                canClickMax()
                  ? "text-red-400 hover:text-red-300"
                  : "text-neutral-500 cursor-not-allowed"
              }`}
              onClick={handleMaxClick}
            >
              Max
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 ">
          <div className="flex items-center bg-black rounded-full px-5 py-2">
            <Image
              src="/logos/cngn.png"
              alt="cNGN"
              width={25}
              height={25}
              className="rounded-full mr-2"
            />
            <span className="text-white text-lg font-medium">cNGN</span>
          </div>
          {/* Hidden mirror for measuring input width */}
          <span
            ref={mirrorRef}
            className="fixed -left-[9999px] top-0 font-semibold !text-4xl leading-tight whitespace-pre"
          >
            {amount || "0.00"}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount || ""}
            onChange={(e) => setAmount(e.target.value)}
            className="text-right pr-2 !leading-tight py-4 font-semibold !text-4xl outline-none bg-transparent border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none text-white"
            style={{ width: inputWidth }}
            placeholder="0.00"
          />
        </div>
      </div>

      <SwapArrow disabled />

      {/* To (allow selecting any country) */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative">
        <div className="text-neutral-300 text-base mb-2">To</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <SelectCountry
              exchangeRate={exchangeRate}
              nigeriaRate={nigeriaRate}
              exchangeRates={exchangeRates}
            />
          </div>
        </div>
      </div>

      {/* Exchange rate for cNGN -> NGN */}
      <div className="px-1 text-xs text-neutral-400 my-2 flex justify-between items-center">
        <span>1 cNGN ≈ {getCNGNToNGNRate().toFixed(6)} NGN</span>
        {/* <span className="text-neutral-500">~0.34% platform fee</span> */}
      </div>

      {/* Recipient */}
      <SelectInstitution
        disableSubmit={true}
        institutions={institutionsForCountry}
      />

      {/* Swipe to Withdraw */}
      <div className="mt-2">
        <SwipeToWithdrawButton
          onWithdrawComplete={handleWithdrawComplete}
          isLoading={withdrawLoading}
          disabled={isWithdrawDisabled}
          stepMessage={stepMessage}
          isWalletConnected={evmConnected}
          hasKYC={!!kycData?.fullKYC}
          onConnectWallet={handleConnectWallet}
          onStartKYC={handleStartKYC}
          onSwapClick={() => {}}
          reset={swipeButtonReset}
        />
      </div>

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
