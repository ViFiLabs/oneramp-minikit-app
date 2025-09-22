"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserSelectionStore } from "@/store/user-selection";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { SwapArrow } from "@/app/components/panels/SwapArrow";
import SelectInstitution from "@/app/components/select-institution";
import { SwipeToWithdrawButton } from "@/app/components/payment/swipe-to-withdraw";
import { countries } from "@/data/countries";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useKYCStore } from "@/store/kyc-store";
import { useNetworkStore } from "@/store/network";
import { useMutation } from "@tanstack/react-query";
import { createQuoteOut } from "@/actions/quote";
import { createTransferOut } from "@/actions/transfer";
import useEVMPay from "@/onchain/useEVMPay";
import { KYCVerificationModal } from "@/app/components/modals/KYCVerificationModal";
import { ModalConnectButton } from "@/app/components/wallet/modal-connect-button";
import { toast } from "sonner";
import {
  AppState,
  ChainTypes,
  OrderStep,
  Quote,
  Transfer,
  TransferType,
} from "@/types";

export default function CNGNWithdrawPanel() {
  const userSelection = useUserSelectionStore();
  const { country, institution, accountNumber, asset, updateSelection } =
    userSelection;
  const { isConnected: evmConnected, address, chainId } = useWalletGetInfo();
  const { isValid: isAmountValid, amount, setAmount } = useAmountStore();
  const { currentNetwork } = useNetworkStore();
  const { setQuote } = useQuoteStore();
  const { setTransfer, setTransactionHash } = useTransferStore();
  const { kycData } = useKYCStore();
  const { payWithEVM } = useEVMPay();

  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [swipeButtonReset, setSwipeButtonReset] = useState(false);
  // cNGN is NGN-pegged (1:1). Show amount directly as NGN without FX conversion
  const computedToValue = useMemo(() => {
    const a = parseFloat(String(amount || 0));
    if (!a) return "0.00";
    return a.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [amount]);

  // Lock country to Nigeria for cNGN withdraw as well
  useEffect(() => {
    const nigeria = countries.find((c) => c.name === "Nigeria");
    if (nigeria && (!country || country.name !== "Nigeria")) {
      updateSelection({ country: nigeria });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isWithdrawDisabled = useMemo(
    () =>
      !isAmountValid ||
      !country ||
      !institution ||
      !accountNumber ||
      !evmConnected,
    [isAmountValid, country, institution, accountNumber, evmConnected]
  );

  // Create transfer payload (same logic as SwapPanel)
  const createTransferPayload = useCallback(
    (quoteId: string) => {
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
        name:
          country.countryCode === "NG" && userSelection.accountName
            ? userSelection.accountName
            : fullName,
        country: country.countryCode || "",
        address: nationality || country.name || "",
        dob: dateOfBirth,
        idNumber: documentNumber,
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
    [country, kycData, userSelection, institution, accountNumber]
  );

  const handleWithdrawTransfer = useCallback(async () => {
    if (
      !country ||
      !institution ||
      !accountNumber ||
      !asset ||
      !currentNetwork ||
      !amount ||
      !address ||
      !kycData?.fullKYC
    ) {
      throw new Error("Missing required data for withdrawal");
    }

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
    kycData,
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

    // Allow MoMo under $100 to bypass KYC for cNGN Withdraw
    const allowKycBypassForMomo =
      userSelection.paymentMethod === "momo" &&
      country?.countryCode !== "NG" &&
      country?.countryCode !== "ZA" &&
      parseFloat(String(amount || 0)) > 0 &&
      parseFloat(String(amount || 0)) < 100;

    // KYC requirement
    if (!allowKycBypassForMomo && kycData && kycData.kycStatus !== "VERIFIED") {
      setShowKYCModal(true);
      toast.error("KYC verification required");
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100);
      return;
    }

    if (
      !allowKycBypassForMomo &&
      (kycData?.kycStatus === "REJECTED" || kycData?.kycStatus === "IN_REVIEW")
    ) {
      setShowKYCModal(true);
      toast.error(
        "KYC verification is not complete. Please wait for verification to finish."
      );
      setSwipeButtonReset(true);
      setTimeout(() => setSwipeButtonReset(false), 100);
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
            Balance: -- <span className="text-red-400 ml-1">Max</span>
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
          <input
            type="text"
            inputMode="decimal"
            value={amount || ""}
            onChange={(e) => setAmount(e.target.value)}
            className="text-right pr-2 !leading-tight py-4 font-semibold !text-4xl outline-none bg-transparent border-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-transparent focus:outline-none text-white w-28 md:w-40"
            placeholder="0.00"
          />
        </div>
      </div>

      <SwapArrow disabled />

      {/* To (custom NGN display with Nigeria locked) */}
      <div className="bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col relative h-[115px]">
        <div className="text-neutral-300 text-base mb-2">To</div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center bg-black rounded-full px-5 py-2">
            <Image
              src="/logos/nigeria.png"
              alt="Nigeria"
              width={25}
              height={25}
              className="rounded-full mr-2"
            />
            <span className="text-white text-lg font-medium">Nigeria</span>
          </div>
          <div className="text-white !text-4xl font-semibold tracking-tight ">
            {computedToValue}
          </div>
        </div>
      </div>

      {/* Peg line for cNGN */}
      <div className="px-1 text-xs text-neutral-400 my-2">1 cNGN ~ 1 NGN</div>

      {/* Recipient */}
      <SelectInstitution disableSubmit={true} />

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

      {/* KYC Verification Modal */}
      <KYCVerificationModal
        open={showKYCModal}
        onClose={() => {
          setShowKYCModal(false);
          setSwipeButtonReset(true);
          setTimeout(() => setSwipeButtonReset(false), 100);
        }}
        kycLink={kycData?.message?.link || null}
      />

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
