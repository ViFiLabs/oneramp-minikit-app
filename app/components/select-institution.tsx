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
import AccountDetails from "./account-details";
import SubmitButton from "./buttons/submit-button";
import { InstitutionModal } from "./modals/InstitutionModal";
import { KYCVerificationModal } from "./modals/KYCVerificationModal";

interface FormInputs {
  accountNumber: string;
  walletAddress?: string;
}

const SelectInstitution = ({ buy }: { buy?: boolean }) => {
  const { institution, country, updateSelection } = useUserSelectionStore();
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const { isValid: isAmountValid, amount: userAmountEntered } =
    useAmountStore();
  const userPayLoad = useUserSelectionStore();
  const { kycData } = useKYCStore();

  const { setQuote } = useQuoteStore();
  const { currentNetwork } = useNetworkStore();
  const { isConnected, address } = useWalletGetInfo();
  const { setTransfer } = useTransferStore();
  const [isNigeriaOrSouthAfrican, setIsNigeriaOrSouthAfrican] = useState(
    userPayLoad.country?.countryCode === "NG" ||
      userPayLoad.country?.countryCode === "ZA"
  );

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
      walletAddress: userPayLoad.pastedAddress || "",
    },
  });

  const accountNumber = watch("accountNumber");

  // Update form values when external state changes
  useEffect(() => {
    if (userPayLoad.pastedAddress) {
      setValue("walletAddress", userPayLoad.pastedAddress);
    }
  }, [userPayLoad.pastedAddress, setValue]);

  // Save account number to global state when it changes
  useEffect(() => {
    if (accountNumber) {
      updateSelection({ accountNumber });
    }
  }, [accountNumber, updateSelection]);

  useEffect(() => {
    if (
      userPayLoad.country?.countryCode === "NG" ||
      userPayLoad.country?.countryCode === "ZA"
    ) {
      setIsNigeriaOrSouthAfrican(true);
    } else {
      setIsNigeriaOrSouthAfrican(false);
    }
  }, [userPayLoad.country?.countryCode]);

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
          country: nationality,
          address: country?.countryCode || "",
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
          country: nationality,
          address: country?.countryCode || "",
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
              country: nationality,
              address: country?.countryCode || "",
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

          return;
        }
      }

      // Reset form inputs visually while keeping global state
      reset({
        accountNumber: "",
        walletAddress: "",
      });
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
      setButtonText(
        currentNetwork?.type === "starknet"
          ? "Connect Starknet Wallet"
          : "Connect EVM Wallet"
      );
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

    if (instType.includes("mobile")) {
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

  return (
    <form onSubmit={onSubmit}>
      {(!buy || (buy && !isNigeriaOrSouthAfrican)) && (
        <div
          className={`mb-2 bg-[#232323] rounded-2xl p-5 flex flex-col gap-4 `}
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
                {institution?.name || "Select institution"}
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

            {/* Account Number */}
            <div className="flex-1 h-full w-full">
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
                          userPayLoad.country.accountNumberLength.mobileLength;
                        return (
                          value.length >= minLength ||
                          `Mobile number must be at least ${minLength} digits`
                        );
                      }
                      return true;
                    },
                  },
                })}
                className={`bg-transparent border !border-neutral-600 text-lg text-white font-medium rounded-full h-14 pl-6 w-full focus:outline-none ${
                  touchedFields.accountNumber && errors.accountNumber
                    ? "border-red-500 focus:border-red-500"
                    : "focus:border-purple-400"
                }`}
              />
            </div>
          </div>

          {/* Show account details only when account number is entered */}
          {accountNumber && isAccountNumberValid() && (
            <AccountDetails accountNumber={accountNumber} />
          )}
        </div>
      )}

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
          <div className="flex items-center border border-[#444] rounded-full px-9 py-3 my-4">
            <svg
              width="24"
              height="24"
              className="mr-2 text-neutral-400"
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
            <Input
              type="text"
              placeholder="Paste your wallet address here..."
              {...register("walletAddress", {
                // required: buy ? "Wallet address is required" : false,
                required: false,
                pattern: {
                  value: /^0x[a-fA-F0-9]{40}$|^0x[a-fA-F0-9]{64}$/,
                  message: "Invalid wallet address format",
                },
              })}
              className={`bg-transparent text-white w-full focus:outline-none p-3 outline-none !border-none ${
                errors.walletAddress ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.walletAddress && (
            <p className="mt-1 text-xs text-red-500">
              {errors.walletAddress.message}
            </p>
          )}
        </>
      )}

      {userPayLoad.pastedAddress && buy ? (
        // Add a console.log statement here
        <SubmitButton
          onClick={onSubmit}
          disabled={
            createMutation.isPending ||
            userPayLoad.appState === AppState.Processing ||
            Object.keys(errors).length > 0 ||
            !isAmountValid ||
            !currentNetwork
          }
          className={`w-full  text-white text-base font-bold h-14 mt-2 rounded-2xl ${
            buttonDisabled || !isAmountValid || !currentNetwork
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
        // Put a console.log statement here
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
              {currentNetwork?.type === "starknet"
                ? "Starknet wallet required for this network"
                : "EVM wallet required for this network"}
            </div>
          )}
        </div>
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
