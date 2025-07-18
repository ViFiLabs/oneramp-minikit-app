import { createTransferIn, submitTransactionHash } from "@/actions/transfer";
import { ConnectSingleWallet } from "@/components/connect-single-wallet";
import { Button } from "@/components/ui/button";
import useWalletInfo from "@/hooks/useWalletGetInfo";
import useEVMPay from "@/onchain/useEVMPay";
import { useKYCStore } from "@/store/kyc-store";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import {
  AppState,
  ChainTypes,
  OrderStep,
  TransferBankRequest,
  TransferMomoRequest,
  TransferType,
} from "@/types";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AssetAvator from "../cards/asset-avator";
import { CancelModal } from "./cancel-modal";
import { assets } from "@/data/currencies";

interface WrongChainState {
  isWrongChain: boolean;
  chainId: number;
  buttonText: string;
}

export function TransactionReviewModal() {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { quote, resetQuote } = useQuoteStore();
  const [loading, setLoading] = useState(false);
  const {
    institution,
    accountNumber,
    updateSelection,
    orderStep: currentOrderStep,
    asset,
    resetToDefault,
  } = useUserSelectionStore();
  const userPayLoad = useUserSelectionStore();
  const { kycData } = useKYCStore();
  const { currentNetwork } = useNetworkStore();
  const { resetTransfer, transfer, setTransactionHash, setTransfer } =
    useTransferStore();
  const router = useRouter();

  const [wrongChainState, setWrongChainState] = useState<WrongChainState>({
    isWrongChain: false,
    chainId: 0,
    buttonText: "Confirm payment",
  });

  const { payWithEVM, isLoading, resetState, isError } = useEVMPay();

  const { chainId, address, isConnected } = useWalletInfo();

  // Create the mutation with reset capability
  const submitTxHashMutation = useMutation({
    mutationKey: ["submit-tx-hash"],
    mutationFn: submitTransactionHash,
    onSuccess: (response) => {
      submitTxHashMutation.reset();
      submitTransferIn.reset();
      updateSelection({ orderStep: OrderStep.GotTransfer });
      // if (response.success) {
      //   updateSelection({ orderStep: OrderStep.GotTransfer });
      //   return;
      // }
      return response;
    },
    onError: (error: Error) => {
      console.log("Error in submitTxHashMutation", error);
      submitTxHashMutation.reset();
      submitTransferIn.reset();
    },
  });

  useEffect(() => {
    // If there's no asset, and there's a quote, then use the asset from the quote to set the asset in the user selection store
    if (!asset && quote) {
      const getAsset = assets.find(
        (asset) => asset.symbol === quote.cryptoType
      );
      if (getAsset) {
        updateSelection({ asset: getAsset });
      }
    }
  }, [asset, quote]);

  useEffect(() => {
    if (isError) {
      setLoading(false);
    }
  }, [isError]);

  useEffect(() => {
    // First reset the submitTxHashMutation when the component mounts
    submitTxHashMutation.reset();
    submitTransferIn.reset();
    setLoading(false);
  }, []);

  // Remove the mutation reset from effects
  useEffect(() => {
    return () => {
      // Only reset states, not the mutation
      if (currentNetwork?.type === ChainTypes.EVM) {
        resetState();
      }
    };
  }, []);

  // Remove automatic mutation reset on quote change
  useEffect(() => {
    if (quote && currentOrderStep === OrderStep.GotQuote) {
      if (currentNetwork?.type === ChainTypes.EVM) {
        resetState();
      }
    }
  }, [quote?.quoteId, currentOrderStep]);

  useEffect(() => {
    if (chainId !== currentNetwork?.chainId) {
      setWrongChainState({
        isWrongChain: true,
        chainId: currentNetwork?.chainId ?? 0,
        buttonText: "Switch to " + currentNetwork?.name,
      });
      return;
    }

    if (address && isConnected) {
      setWrongChainState({
        isWrongChain: false,
        chainId: chainId ?? 0,
        buttonText: "Confirm payment",
      });
      return;
    }

    if (!address || !isConnected) {
      setWrongChainState({
        isWrongChain: true,
        chainId: currentNetwork?.chainId ?? 0,
        buttonText: "Connect " + currentNetwork?.name,
      });
      return;
    }
  }, [chainId, currentNetwork, address, isConnected]);

  const handleBackClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    resetQuote();
    resetTransfer();
    submitTxHashMutation.reset();
    if (currentNetwork?.type === ChainTypes.EVM) {
      resetState();
    }
    resetToDefault();
    submitTransferIn.reset();
    router.refresh();
  };

  const makeBlockchainTransaction = async () => {
    if (!asset || !currentNetwork || !quote || !transfer) return;

    const networkName = currentNetwork.name;
    const contractAddress = asset.networks[networkName]?.tokenAddress;

    if (!contractAddress) {
      return;
    }

    setLoading(true);

    try {
      const recipient = transfer.transferAddress;

      const transactionPayload = {
        recipient,
        amount: quote.cryptoAmount.toString(),
        tokenAddress: contractAddress,
      };

      updateSelection({ appState: AppState.Processing });
      payWithEVM(transactionPayload, handleEVMPaySuccess, handleEVMPayFailed);
    } catch (error) {
      console.log("Error in makeBlockchainTransaction", error);
      setLoading(false);
    }
  };

  const handleEVMPaySuccess = async (txHash: string) => {
    if (
      !transfer?.transferId ||
      !txHash ||
      wrongChainState.isWrongChain ||
      currentNetwork?.type !== ChainTypes.EVM
    ) {
      return;
    }

    setTransactionHash(txHash);

    // Wait for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    submitTxHashMutation.mutate({
      transferId: transfer.transferId,
      txHash: txHash,
    });

    updateSelection({ orderStep: OrderStep.GotTransfer });

    setLoading(false);
  };

  const handleEVMPayFailed = (error: Error) => {
    // toast.error("Transaction failed");
    return error;
  };

  const handleSubmitTransferIn = async () => {
    if (!quote) return;

    if (userPayLoad.paymentMethod === "momo") {
      const { institution, country } = userPayLoad;
      const { fullKYC } = kycData || {};

      // if (!institution || !accountNumber || !country || !fullKYC) return;
      if (!country || !fullKYC) return;

      const isNigeriaOrSouthAfrican =
        country.countryCode === "NG" || country.countryCode === "ZA";

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
      let payload: TransferMomoRequest | TransferBankRequest;

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
        name: fullName,
        country: nationality,
        address: country.countryCode || "",
        phone: accountNumber,
        dob: dateOfBirth,
        idNumber: documentNumber,
        idType: updatedDocumentType,
        additionalIdType: updatedDocumentType,
        additionalIdNumber: updatedDocumentTypeSubType,
      };

      if (isNigeriaOrSouthAfrican) {
        if (!phoneNumber) return;
        payload = {
          bank: {
            code: "",
            accountNumber: "",
            accountName: "",
          },
          operator: "bank",
          quoteId: quote.quoteId,
          userDetails: {
            ...userDetails,
            phone: phoneNumber,
          },
        };
        updateSelection({
          paymentMethod: "bank",
        });
      } else {
        if (!institution || !accountNumber) return;
        const accountNumberWithoutLeadingZero = accountNumber.replace(
          /^0+/,
          ""
        );
        const fullPhoneNumber = `${country.phoneCode}${accountNumberWithoutLeadingZero}`;
        payload = {
          phone: fullPhoneNumber,
          operator: institution.name.toLowerCase(),
          quoteId: quote.quoteId,
          userDetails: {
            ...userDetails,
            phone: fullPhoneNumber,
          },
        };
      }

      const transferResponse = await createTransferIn(payload);
      setTransfer(transferResponse);
      return;
    }

    if (userPayLoad.paymentMethod === "bank") {
      const { institution, country } = userPayLoad;
      const { fullKYC } = kycData || {};

      // if (!institution || !accountNumber || !country || !fullKYC) return;
      if (!country || !fullKYC) return;

      const isNigeriaOrSouthAfrican =
        country.countryCode === "NG" || country.countryCode === "ZA";

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
      let payload;

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

      const accountName =
        userPayLoad.accountName === "OK"
          ? fullName
          : userPayLoad.accountName || fullName;

      const userDetails = {
        name: fullName,
        country: nationality,
        address: country.countryCode || "",
        phone: accountNumber,
        dob: dateOfBirth,
        idNumber: documentNumber,
        idType: updatedDocumentType,
        additionalIdType: updatedDocumentType,
        additionalIdNumber: updatedDocumentTypeSubType,
      };

      if (isNigeriaOrSouthAfrican) {
        payload = {
          bank: {
            code: "",
            accountNumber: "",
            accountName: "",
          },
          operator: "bank",
          quoteId: quote.quoteId,
          userDetails: {
            ...userDetails,
            phone: phoneNumber,
          },
        };
        updateSelection({
          paymentMethod: "bank",
        });
      } else {
        if (!institution || !accountNumber) return;
        payload = {
          bank: {
            code: institution.code,
            accountNumber: accountNumber,
            accountName: accountName,
          },
          operator: "bank",
          quoteId: quote.quoteId,
          userDetails: {
            name: fullName,
            country: nationality,
            address: country.countryCode || "",
            phone: phoneNumber || accountNumber,
            // phone: MOCK_NIGERIAN_PHONE_NUMBER_SUCCESS,
            dob: dateOfBirth,
            idNumber: documentNumber,
            idType: updatedDocumentType,
            additionalIdType: updatedDocumentType,
            additionalIdNumber: updatedDocumentTypeSubType,
          },
        };
      }

      const transferResponse = await createTransferIn(payload);

      setTransfer(transferResponse);
      return;
    }
  };

  const submitTransferIn = useMutation({
    mutationFn: handleSubmitTransferIn,
    onSuccess: () => {
      updateSelection({ orderStep: OrderStep.GotTransfer });
    },
  });

  if (currentOrderStep !== OrderStep.GotQuote) return null;
  if (!quote) return null;

  let totalAmount = 0;
  if (quote.country === "KE" || quote.country === "UG") {
    totalAmount = Number(quote.fiatAmount);
  } else {
    totalAmount = Number(quote.fiatAmount) + Number(quote.feeInFiat);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818] md:bg-black">
        <div className="bg-[#181818] md:rounded-2xl max-w-md md:w-[90%] md:shadow-xl p-6">
          <div className="flex flex-col md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Review transaction
            </h1>
            <p className="text-neutral-400 mb-4 text-sm md:text-base">
              Verify transaction details before you send
            </p>

            {/* <h1 className="!text-red-500">{isError ? "Error" : "No error"}</h1> */}
            <div className="space-y-5">
              {/* Amount */}
              <div className="flex justify-between items-center">
                <h2 className="text-neutral-400 text-base">Amount</h2>
                <AssetAvator quote={quote} />
              </div>

              {/* Total value */}
              <div className="flex justify-between items-center">
                <h2 className="text-neutral-400 text-base">Total value</h2>
                <h2 className="text-white text-base font-medium">
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  {quote.fiatType}
                </h2>
              </div>

              {/* Recipient */}
              {quote.transferType === TransferType.TransferOut && (
                <div className="flex justify-between items-center">
                  <h2 className="text-neutral-400 text-base">Recipient</h2>
                  <h2 className="text-white text-base font-medium">
                    {transfer?.transferAddress?.slice(0, 4)}...
                    {transfer?.transferAddress?.slice(-4)}
                  </h2>
                </div>
              )}

              {/* Account */}
              {accountNumber && institution && (
                <div className="flex justify-between items-center">
                  <h2 className="text-neutral-400 text-base">Account</h2>
                  <div className="text-white gap-2 text-base font-medium flex items-center">
                    <h2>
                      {accountNumber?.slice(0, 4)}...{accountNumber?.slice(-4)}
                    </h2>
                    <h2 className="text-neutral-400 mx-2">•</h2>
                    <h2 className="text-sm">{institution?.name.slice(0, 4)}</h2>
                  </div>
                </div>
              )}

              {/* Network */}
              {currentNetwork && (
                <div className="flex justify-between items-center">
                  <h2 className="text-neutral-400 text-base">Network</h2>
                  <div className="flex items-center gap-2">
                    <Image
                      src={currentNetwork.logo}
                      alt={currentNetwork.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <h2 className="text-white text-base font-medium">
                      {currentNetwork.name}
                    </h2>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-[#232323] p-4 rounded-lg mt-4 mb-4 flex items-start gap-3">
              <div className="mt-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 7v6"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16" r="1" fill="#666" />
                </svg>
              </div>
              <p className="text-neutral-400 text-sm">
                Ensure the details above are correct. Failed transaction due to
                wrong details may attract a refund fee
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                className="flex-1 bg-[#333] hover:bg-[#444] border-none text-white p-6 text-lg rounded-xl"
                onClick={handleBackClick}
                disabled={
                  isLoading || loading || submitTxHashMutation.isPending
                }
              >
                Back
              </Button>

              {quote && quote.transferType === TransferType.TransferIn ? (
                <Button
                  className="flex-1 !bg-[#7B68EE] hover:!bg-[#6A5ACD] text-white p-6 text-lg rounded-xl"
                  onClick={() => submitTransferIn.mutate()}
                  // disabled={submitTransferIn.isPending}
                >
                  {isLoading ||
                  submitTxHashMutation.isPending ||
                  loading ||
                  submitTransferIn.isPending ? (
                    <Loader className="animate-spin" />
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
              ) : (
                <>
                  {!isConnected ? (
                    <ConnectSingleWallet
                      large
                      chainType={currentNetwork?.type}
                    />
                  ) : (
                    <Button
                      className="flex-1 !bg-[#7B68EE] hover:!bg-[#6A5ACD] text-white p-6 text-lg rounded-xl"
                      onClick={makeBlockchainTransaction}
                      disabled={
                        isLoading ||
                        submitTxHashMutation.isPending ||
                        loading ||
                        wrongChainState.isWrongChain ||
                        (!transfer && !isError)
                      }
                    >
                      {
                        // isLoading ||  submitTxHashMutation.isPending ||
                        loading && !isError ? (
                          <Loader className="animate-spin" />
                        ) : (
                          wrongChainState.buttonText
                        )
                      }
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelModal
          title="Cancel Transaction?"
          description="Are you sure you want to cancel this transaction? Your current progress will be lost."
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </>
  );
}
