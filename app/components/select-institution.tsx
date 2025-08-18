"use client";

import { createQuoteIn, createQuoteOut } from "@/actions/quote";
import { createTransferOut } from "@/actions/transfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/hooks/useWalletGetInfo";
import { useAmountStore } from "@/store/amount-store";
import { useKYCStore } from "@/store/kyc-store";
import { useNetworkStore } from "@/store/network";
import { useQuoteStore } from "@/store/quote-store";
import { useTransferStore } from "@/store/transfer-store";
import { useUserSelectionStore } from "@/store/user-selection";
import { AppState, Institution, OrderStep, QuoteRequest } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountStatusIndicator, AccountNameDisplay } from "./account-details";
import SubmitButton from "./buttons/submit-button";
import { InstitutionModal } from "./modals/InstitutionModal";
import { KYCVerificationModal } from "./modals/KYCVerificationModal";

interface FormInputs {
  accountNumber: string;
  walletAddress?: string;
}

const SelectInstitution = ({
  buy,
  disableSubmit = false,
}: {
  buy?: boolean;
  disableSubmit?: boolean;
}) => {
  const { institution, country, updateSelection, countryPanelOnTop } =
    useUserSelectionStore();
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const {
    isValid: isAmountValid,
    amount: userAmountEntered,
    cryptoAmount,
  } = useAmountStore();
  const userPayLoad = useUserSelectionStore();
  const { kycData } = useKYCStore();

  const { setQuote } = useQuoteStore();
  const { currentNetwork } = useNetworkStore();
  const { isConnected, address } = useWalletGetInfo();
  const { setTransfer } = useTransferStore();
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, touchedFields },
    trigger,
  } = useForm<FormInputs>({
    mode: "onBlur",
    defaultValues: {
      accountNumber: "",
      walletAddress: userPayLoad.pastedAddress || address || "",
    },
  });

  const accountNumber = watch("accountNumber");
  const walletAddress = watch("walletAddress");

  // Update form values when external state changes
  useEffect(() => {
    if (userPayLoad.pastedAddress) {
      setValue("walletAddress", userPayLoad.pastedAddress);
    } else if (address && !userPayLoad.pastedAddress) {
      setValue("walletAddress", address);
      updateSelection({ pastedAddress: address });
    }
  }, [userPayLoad.pastedAddress, address, setValue, updateSelection]);

  // Save account number to global state when it changes
  useEffect(() => {
    if (accountNumber) {
      updateSelection({ accountNumber });
    }
  }, [accountNumber, updateSelection]);

  // Previously toggled a Nigeria/SA flag for conditional rendering. We now
  // always render the recipient section and rely on runtime branching where needed.

  // Watch for wallet address changes and update global state
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "walletAddress" && value.walletAddress) {
        updateSelection({ pastedAddress: value.walletAddress });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, updateSelection]);

  const createMutation = useMutation({
    mutationFn: async (payload: QuoteRequest) =>
      buy ? await createQuoteIn(payload) : await createQuoteOut(payload),
    onSuccess: async (data) => {
      updateSelection({ accountNumber, orderStep: OrderStep.GotQuote });

      if (!userPayLoad.paymentMethod) {
        updateSelection({ paymentMethod: "momo" });
      }

      // Create the transfer here too...
      if (userPayLoad.paymentMethod === "momo") {
        const { institution, country } = userPayLoad;
        const { fullKYC } = kycData || {};

        // if (!institution || !accountNumber || !country || !fullKYC) return;
        if (!country || !fullKYC) return;

        const {
          fullName,
          nationality,
          dateOfBirth,
          documentNumber,
          documentType,
          documentSubType,
        } = fullKYC;

        // accountNumber withouth the leading 0
        const accountNumberWithoutLeadingZero = accountNumber.replace(
          /^0+/,
          ""
        );

        const fullPhoneNumber = `${country.phoneCode}${accountNumberWithoutLeadingZero}`;
        let updatedDocumentType = documentType;
        let updatedDocumentTypeSubType = documentSubType;
        let payload;

        const isNigeriaOrSouthAfrican =
          country.countryCode === "NG" || country.countryCode === "ZA";

        if (country.countryCode === "NG") {
          updatedDocumentTypeSubType = "BVN";
          updatedDocumentType = "NIN";
        }

        if (documentType === "ID") {
          updatedDocumentType = "NIN";
        } else if (documentType === "P") {
          updatedDocumentType = "Passport";
        } else {
          updatedDocumentType = "License";
        }

        const userDetails = {
          name: fullName,
          country: country?.countryCode || "",
          address: nationality || country?.name || "",
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
            quoteId: data.quote.quoteId,
            userDetails,
          };
        } else {
          if (!institution) return;
          payload = {
            phone: fullPhoneNumber,
            operator: institution.name.toLocaleLowerCase(),
            quoteId: data.quote.quoteId,
            userDetails,
          };
        }

        setQuote(data.quote);

        if (!buy) {
          const transferResponse = await createTransferOut(payload);
          setTransfer(transferResponse);

          return;
        }
      }

      if (userPayLoad.paymentMethod === "bank") {
        const { institution } = userPayLoad;
        const { fullKYC } = kycData || {};

        // if (!institution || !accountNumber || !country || !fullKYC) return;
        if (!country || !fullKYC || !institution) return;

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
        }

        if (documentType === "ID") {
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
          country: country?.countryCode || "",
          address: nationality || country?.name || "",
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
              code: institution.code,
              accountNumber: accountNumber,
              accountName: accountName,
            },
            operator: "bank",
            quoteId: data.quote.quoteId,
            userDetails: {
              ...userDetails,
              phone: phoneNumber,
            },
          };
        } else {
          if (!institution) return;

          payload = {
            bank: {
              code: institution.code,
              accountNumber: accountNumber,
              accountName: accountName,
              // code: "",
              // accountNumber: "",
              // accountName: "",
            },
            operator: "bank",
            quoteId: data.quote.quoteId,
            userDetails: {
              name: fullName,
              country: country?.countryCode || "",
              address: nationality || country?.name || "",
              phone: accountNumber,
              dob: dateOfBirth,
              idNumber: documentNumber,
              idType: updatedDocumentType,
              additionalIdType: updatedDocumentType,
              additionalIdNumber: updatedDocumentTypeSubType,
            },
          };
        }

        setQuote(data.quote);

        if (!buy) {
          const transferResponse = await createTransferOut(payload);
          setTransfer(transferResponse);

          // Reset form inputs visually while keeping global state
          reset({
            accountNumber: "",
            walletAddress: "",
          });
          setIsEditingAddress(false);

          return;
        }
      }

      // Reset form inputs visually while keeping global state
      reset({
        accountNumber: "",
        walletAddress: "",
      });
      setIsEditingAddress(false);
    },
    onError: () => {},
  });

  // Update button disabled state and text whenever dependencies change
  useEffect(() => {
    const isDisabled =
      !isConnected ||
      !hasRequiredWallet() ||
      !accountNumber ||
      !country ||
      !isAmountValid ||
      userPayLoad.appState === AppState.Processing;
    // || Object.keys(errors).length > 0;
    setButtonDisabled(isDisabled);

    // Update button text based on conditions
    if (!isConnected) {
      setButtonText("Connect Wallet");
    } else if (!hasRequiredWallet()) {
      setButtonText("Connect EVM Wallet");
    } else if (!institution) {
      if (!buy) {
        setButtonText("Select institution");
      } else {
        setButtonText("Buy");
      }
    } else if (!isAmountValid) {
      setButtonText("Invalid amount");
      // setButtonText("Please fix form errors");
    } else {
      setButtonText(buy ? "Buy" : "Swap");
    }
  }, [
    isConnected,
    accountNumber,
    institution,
    country,
    currentNetwork,
    isAmountValid,
    errors,
  ]);

  const handleInstitutionSelect = (inst: Institution) => {
    let instType = inst.type;

    if (!inst.type) {
      instType = inst.accountNumberType;
    }

    if (typeof instType === "string" && instType.includes("mobile")) {
      instType = "momo";
    }

    updateSelection({
      institution: inst,
      paymentMethod: instType as "bank" | "momo",
      accountNumber: "", // Clear account number when institution changes
    });
    setShowInstitutionModal(false);
    setValue("accountNumber", "");
    trigger("accountNumber");
  };

  const onSubmit = handleSubmit((data) => {
    if (!userPayLoad) return;

    const { country, asset } = userPayLoad;

    if (!country || !currentNetwork) return;

    let selectedAsset;

    if (!asset) {
      selectedAsset = assets[0];
    } else {
      selectedAsset = asset;
    }

    // Verify KYC
    if (kycData && kycData.kycStatus !== "VERIFIED") {
      setShowKYCModal(true);
      toast.error("KYC verification required");
      return;
    }

    // Additional check for rejected or in-review KYC
    if (
      kycData?.kycStatus === "REJECTED" ||
      kycData?.kycStatus === "IN_REVIEW"
    ) {
      setShowKYCModal(true);
      toast.error(
        "KYC verification is not complete. Please wait for verification to finish."
      );
      return;
    }

    let walletAddress;

    if (buy && data.walletAddress) {
      walletAddress = data.walletAddress;
      // Update both account number and wallet address in global state
      updateSelection({
        pastedAddress: data.walletAddress,
        accountNumber: data.accountNumber,
      });
    } else {
      walletAddress = address;
      // Update account number in global state
      updateSelection({ accountNumber: data.accountNumber });
    }

    const payload: QuoteRequest = {
      address: walletAddress as string,
      country: country?.countryCode,
      cryptoAmount: userAmountEntered,
      cryptoType: selectedAsset?.symbol,
      fiatType: country?.currency,
      network: currentNetwork?.name.toLowerCase(),
    };

    if (countryPanelOnTop) {
      payload.cryptoAmount = cryptoAmount;
    }

    createMutation.mutate(payload);

    // Reset form inputs visually while keeping global state
  });

  // Check if user has the required wallet for the selected network
  const hasRequiredWallet = () => {
    if (!currentNetwork) return false;

    const isSupportedNetwork = SUPPORTED_NETWORKS_WITH_RPC_URLS.find(
      (network) => network.name === currentNetwork.name
    );

    return !!isSupportedNetwork && isConnected;
  };

  const isAccountNumberValid = () => {
    if (!userPayLoad) return false;
    if (!accountNumber) return false;

    const { country, paymentMethod } = userPayLoad;

    if (!country?.accountNumberLength) return false;

    if (paymentMethod === "bank" && country.accountNumberLength?.bankLength) {
      return accountNumber.length >= country.accountNumberLength.bankLength;
    }

    if (paymentMethod === "momo" && country.accountNumberLength?.mobileLength) {
      return accountNumber.length >= country.accountNumberLength.mobileLength;
    }

    return false;
  };

  const isValidEVMAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleEditAddress = () => {
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (walletAddress && isValidEVMAddress(walletAddress)) {
      setIsEditingAddress(false);
      updateSelection({ pastedAddress: walletAddress });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingAddress(false);
    // Reset to the saved address
    setValue("walletAddress", userPayLoad.pastedAddress || address || "");
  };

  const renderMpesa = (name: string) => {
    if (name.includes("SAFARICOM")) {
      return "M-PESA";
    }
    return name;
  };
  return (
    <form onSubmit={onSubmit}>
      <div
        className={`mb-2 bg-[#232323] rounded-t-[2rem] p-5 flex flex-col gap-4 `}
      >
        <div className="flex items-center justify-between">
          <span className="text-white text-lg font-medium">Recipient</span>
        </div>

        <div className="flex gap-3 items-center  flex-col">
          {/* Institution Selector */}
          <Button
            type="button"
            variant="default"
            onClick={() => {
              setShowInstitutionModal(true);
              setValue("accountNumber", "");
              updateSelection({ paymentMethod: undefined });
            }}
            className="bg-transparent border w-full h-full !border-neutral-600 text-neutral-400 rounded-full p-3 cursor-pointer flex items-center justify-center"
          >
            <span className="line-clamp-1 text-white">
              {renderMpesa(institution?.name || "") || "Select institution"}
            </span>
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

          {/* Account Number - only show after institution is selected */}
          {institution && (
            <>
              <div className="flex-1 h-full w-full relative">
                <Input
                  type="number"
                  placeholder="Account number"
                  {...register("accountNumber", {
                    required: "Account number is required",
                    validate: {
                      validLength: (value) => {
                        if (!userPayLoad?.country?.accountNumberLength)
                          return true;
                        if (userPayLoad.paymentMethod === "bank") {
                          const minLength =
                            userPayLoad.country.accountNumberLength.bankLength;
                          return (
                            value.length >= minLength ||
                            `Account number must be at least ${minLength} digits`
                          );
                        }
                        if (userPayLoad.paymentMethod === "momo") {
                          const minLength =
                            userPayLoad.country.accountNumberLength
                              .mobileLength;
                          return (
                            value.length >= minLength ||
                            `Mobile number must be at least ${minLength} digits`
                          );
                        }
                        return true;
                      },
                    },
                  })}
                  className={`bg-transparent border !border-neutral-600 text-lg text-white font-medium rounded-full h-14 pl-6 pr-12 w-full focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&]:appearance-none ${
                    touchedFields.accountNumber && errors.accountNumber
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-purple-400"
                  }`}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
                {/* Status indicator inside input */}
                {accountNumber && isAccountNumberValid() && (
                  <AccountStatusIndicator accountNumber={accountNumber} />
                )}
              </div>

              {/* Account name display below input */}
              {accountNumber && isAccountNumberValid() && (
                <AccountNameDisplay accountNumber={accountNumber} />
              )}
            </>
          )}
        </div>
      </div>

      {country && (
        <InstitutionModal
          open={showInstitutionModal}
          onClose={() => setShowInstitutionModal(false)}
          selectedInstitution={institution || null}
          onSelect={handleInstitutionSelect}
          country={country.countryCode}
          buy={buy}
        />
      )}

      {/* Address form input */}
      {buy && (
        <>
          <div className="flex items-center border border-[#444] rounded-full px-6 py-3 my-4">
            <svg
              width="24"
              height="24"
              className="mr-3 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="#888"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 4H4v14a2 2 0 002 2h12a2 2 0 002-2v-5M9 15H4M15 1v6m-3-3h6"
              />
            </svg>

            {!isEditingAddress ? (
              <>
                <div className="flex-1 text-white text-sm font-mono truncate pr-2">
                  {walletAddress ? (
                    <span title={walletAddress}>
                      {walletAddress.length > 20
                        ? `${walletAddress.slice(
                            0,
                            10
                          )}...${walletAddress.slice(-8)}`
                        : walletAddress}
                    </span>
                  ) : (
                    "No wallet connected"
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEditAddress}
                  className="ml-3 p-1 text-white hover:text-gray-200 transition-colors flex-shrink-0"
                  title="Edit address"
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Paste your wallet address here..."
                  {...register("walletAddress", {
                    required: false,
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message:
                        "Invalid EVM address format (must be 42 characters: 0x + 40 hex characters)",
                    },
                  })}
                  className={`bg-transparent text-white flex-1 focus:outline-none p-0 outline-none !border-none text-sm font-mono ${
                    errors.walletAddress ? "text-red-400" : ""
                  }`}
                  autoFocus
                />
                <div className="flex ml-2 gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    className={`p-1 transition-colors ${
                      walletAddress && isValidEVMAddress(walletAddress)
                        ? "text-white hover:text-gray-200"
                        : "text-gray-500 cursor-not-allowed"
                    }`}
                    title="Save address"
                    disabled={
                      !walletAddress || !isValidEVMAddress(walletAddress)
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 text-white hover:text-gray-200 transition-colors"
                    title="Cancel edit"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          {errors.walletAddress && (
            <p className="mt-1 text-xs text-red-500">
              {errors.walletAddress.message}
            </p>
          )}
        </>
      )}

      {!disableSubmit && (
        <>
          {userPayLoad.pastedAddress && buy ? (
            <SubmitButton
              onClick={onSubmit}
              disabled={
                createMutation.isPending ||
                userPayLoad.appState === AppState.Processing ||
                Object.keys(errors).length > 0 ||
                !isAmountValid ||
                !currentNetwork ||
                !institution
              }
              className={`w-full  text-white text-base font-bold h-14 mt-2 rounded-2xl ${
                buttonDisabled ||
                !isAmountValid ||
                !currentNetwork ||
                !institution
                  ? "!bg-[#232323] !hover:bg-[#2a2a2a] cursor-not-allowed"
                  : "!bg-[#2563eb] !hover:bg-[#1d4ed8]"
              }`}
            >
              {createMutation.isPending ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                "Buy"
              )}
            </SubmitButton>
          ) : (
            // ) : buttonText === "Connect Wallet" ? (
            //   <div className="flex w-full justify-center my-4">
            //     <ModalConnectButton large />
            //   </div>

            <div className="mb-4">
              <SubmitButton
                onClick={onSubmit}
                disabled={
                  buttonDisabled ||
                  createMutation.isPending ||
                  userPayLoad.appState === AppState.Processing
                }
                className={`w-full text-white text-base font-bold h-14 mt-2 rounded-2xl ${
                  buttonDisabled
                    ? "!bg-[#232323] !hover:bg-[#2a2a2a] cursor-not-allowed"
                    : "!bg-[#2563eb] !hover:bg-[#1d4ed8]"
                }`}
              >
                {createMutation.isPending ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  buttonText
                )}
              </SubmitButton>

              {/* Show wallet requirement message if needed */}
              {!hasRequiredWallet() && isConnected && (
                <div className="text-center mt-2 text-xs text-amber-400 font-medium">
                  &quot;EVM wallet required for this network&quot;
                </div>
              )}
            </div>
          )}
        </>
      )}

      <KYCVerificationModal
        open={showKYCModal}
        onClose={() => {
          setShowKYCModal(false);
        }}
        kycLink={kycData?.message?.link || null}
      />
    </form>
  );
};

export default SelectInstitution;
