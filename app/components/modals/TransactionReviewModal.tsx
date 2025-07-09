import { createTransferIn, submitTransactionHash } from "@/actions/transfer";
import { ConnectSingleWallet } from "@/components/connect-single-wallet";
import { Button } from "@/components/ui/button";
import useWalletInfo from "@/hooks/useWalletGetInfo";
import useEVMPay from "@/onchain/useEVMPay";
import usePayStarknet from "@/onchain/usePayStarknet";
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

  // Initialize Starknet pay
  const starknetPay = usePayStarknet(
    asset?.networks["Starknet"]?.tokenAddress ?? ""
  );

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
      submitTxHashMutation.reset();
      submitTransferIn.reset();
      console.error("Transaction submission error:", error);
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
      } else if (currentNetwork?.type === ChainTypes.Starknet) {
        starknetPay.resetState();
      }
    };
  }, []);

  // Remove automatic mutation reset on quote change
  useEffect(() => {
    if (quote && currentOrderStep === OrderStep.GotQuote) {
      if (currentNetwork?.type === ChainTypes.EVM) {
        resetState();
      } else if (currentNetwork?.type === ChainTypes.Starknet) {
        starknetPay.resetState();
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
    } else if (currentNetwork?.type === ChainTypes.Starknet) {
      starknetPay.resetState();
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
      console.log("No contract address found for network:", networkName);
      return;
    }

    setLoading(true);

    try {
      const recipient = transfer.transferAddress;

      const transactionPayload = {
        recipient,
        amount: quote.amountPaid.toString(),
        tokenAddress: contractAddress,
      };

      const isStarknet = currentNetwork.type === ChainTypes.Starknet;

      if (isStarknet) {
        const strkPayload = {
          recipient,
          amount: quote.amountPaid,
          tokenAddress: contractAddress,
        };
        updateSelection({ appState: AppState.Processing });
        starknetPay.payWithStarknet(
          strkPayload,
          handleStarknetPaySuccess,
          handleStarknetPayFailed
        );
      } else {
        updateSelection({ appState: AppState.Processing });
        payWithEVM(transactionPayload, handleEVMPaySuccess, handleEVMPayFailed);
      }
    } catch (error) {
      console.error("Error initiating blockchain transaction:", error);
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
    // console.log("EVM Transaction failed", error.message);
    // toast.error("Transaction failed");
    return error;
  };

  const handleStarknetPaySuccess = async (txHash: {
    transaction_hash: string;
  }) => {
    const transactionHash = txHash.transaction_hash;

    if (
      !transfer?.transferId ||
      !transactionHash ||
      wrongChainState.isWrongChain ||
      currentNetwork?.type !== ChainTypes.Starknet
    ) {
      return;
    }

    setTransactionHash(transactionHash);

    console.log("====================================");
    console.log("INITIATING STARKNET TX HASH");
    console.log("====================================");

    // Wait for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("====================================");
    console.log("SUBMITTING STARKNET TX HASH");
    console.log("====================================");

    submitTxHashMutation.mutate({
      transferId: transfer.transferId,
      txHash: transactionHash,
    });

    updateSelection({ orderStep: OrderStep.GotTransfer });

    setLoading(false);
  };

  const handleStarknetPayFailed = (error: Error) => {
    // console.log("Starknet Transaction failed", error.message);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="bg-[#181818] rounded-2xl max-w-md w-[90%] shadow-xl p-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-white">
              Review transaction
            </h1>
            <p className="text-neutral-400 mb-4">
              Verify transaction details before you send
            </p>

            {/* <h1 className="!text-red-500">{isError ? "Error" : "No error"}</h1> */}
            <div className="space-y-5">
              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-lg">Amount</span>
                <AssetAvator
                  cryptoType={quote.cryptoType}
                  cryptoAmount={quote.amountPaid}
                />
              </div>

              {/* Total value */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 text-lg">Total value</span>
                <span className="text-white text-lg font-medium">
                  {totalAmount.toFixed(2)} {quote.fiatType}
                </span>
              </div>

              {/* Recipient */}
              {quote.transferType === TransferType.TransferOut && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-lg">Recipient</span>
                  <span className="text-white text-lg font-medium">
                    {transfer?.transferAddress?.slice(0, 4)}...
                    {transfer?.transferAddress?.slice(-4)}
                  </span>
                </div>
              )}

              {/* Account */}
              {accountNumber && institution && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-lg">Account</span>
                  <div className="text-white text-lg font-medium flex items-center">
                    <span>
                      {accountNumber?.slice(0, 4)}...{accountNumber?.slice(-4)}
                    </span>
                    <span className="text-neutral-400 mx-2">•</span>
                    <span>{institution?.name.slice(0, 4)}</span>
                  </div>
                </div>
              )}

              {/* Network */}
              {currentNetwork && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 text-lg">Network</span>
                  <div className="flex items-center gap-2">
                    <Image
                      src={currentNetwork.logo}
                      alt={currentNetwork.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="text-white text-lg font-medium">
                      {currentNetwork.name}
                    </span>
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
              <p className="text-neutral-400 text-xs">
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
