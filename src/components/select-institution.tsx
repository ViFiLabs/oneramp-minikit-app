"use client";

import { createQuoteIn, createQuoteOut } from "@/src/actions/quote";
import { createTransferOut } from "@/src/actions/transfer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { assets } from "@/data/currencies";
import { SUPPORTED_NETWORKS_WITH_RPC_URLS } from "@/data/networks";
import useWalletGetInfo from "@/src/hooks/useWalletGetInfo";
import { useAmountStore } from "@/src/store/amount-store";
import { useKYCStore } from "@/src/store/kyc-store";
import { useNetworkStore } from "@/src/store/network";
import { useQuoteStore } from "@/src/store/quote-store";
import { useTransferStore } from "@/src/store/transfer-store";
import { useUserSelectionStore } from "@/src/store/user-selection";
import {
  AppState,
  Institution,
  OrderStep,
  QuoteRequest,
  KYCVerificationResponse,
} from "@/types";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountStatusIndicator, AccountNameDisplay } from "./account-details";
import SubmitButton from "./buttons/submit-button";
import { InstitutionModal } from "./modals/InstitutionModal";
import { useRecipientStore } from "@/src/store/recipient-store";
import { verifyAccountDetails } from "@/src/actions/institutions";
import { useVerifyPhoneNumber } from "../hooks/useVerifyPhoneNumber";
import { useDebouncedAccountNumber } from "../hooks/useDebouncedAccountNumber";

interface FormInputs {
  accountNumber: string;
  walletAddress?: string;
}

const SelectInstitution = ({
  buy,
  disableSubmit = false,
  institutions,
}: {
  buy?: boolean;
  disableSubmit?: boolean;
  institutions?: Institution[]; // Optional institutions prop from suspense data
}) => {
  const { institution, country, updateSelection, countryPanelOnTop } =
    useUserSelectionStore();
  const { saveRecipient, getRecipient } = useRecipientStore();
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Connect Wallet");
  const [isVerifyingPhoneNumber, setIsVerifyingPhoneNumber] = useState(false);
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

  const cleanAccountNumber = (accountNumber: string) => {
    // const isNigeria = userPayLoad.country?.countryCode === "NG";
    // if (userPayLoad.paymentMethod !== "momo" || isNigeria) {
    //   return accountNumber;
    // }

    // Rules:
    // 1. Not adding a country code
    // 2. No adding a leading 0
    const digitsOnly = accountNumber.replace(/\D/g, "");
    const phoneCode = String(country?.phoneCode || "").replace(/\D/g, "");
    const withoutCountryCode =
      phoneCode && digitsOnly.startsWith(phoneCode)
        ? digitsOnly.slice(phoneCode.length)
        : digitsOnly;
    const cleaned = withoutCountryCode.replace(/^0+/, "");

    return cleaned;
  };

  // Debounced save of account number to global state
  useDebouncedAccountNumber({
    value: accountNumber || "",
    delayMs: 400,
    clean: cleanAccountNumber,
    setValue,
    onCleaned: (cleaned) => updateSelection({ accountNumber: cleaned }),
    debugLabel: "SelectInstitution",
  });

  // Prefill institution and account number when country changes
  useEffect(() => {
    if (country?.countryCode) {
      const savedData = getRecipient(country.countryCode);

      if (savedData) {
        // Prefill institution if saved and not already selected
        if (savedData.institution && !institution) {
          updateSelection({ institution: savedData.institution });
        }

        // Prefill account number if saved
        if (savedData.accountNumber) {
          setValue("accountNumber", savedData.accountNumber);
          updateSelection({ accountNumber: savedData.accountNumber });
        }

        // Prefill account name if saved
        if (savedData.accountName) {
          updateSelection({ accountName: savedData.accountName });
        }

        // Prefill payment method if saved
        if (savedData.paymentMethod) {
          updateSelection({ paymentMethod: savedData.paymentMethod });
        }
      }
    }
  }, [
    country?.countryCode,
    getRecipient,
    institution,
    setValue,
    updateSelection,
  ]);

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

  // Save institution, account number, and account name to persist store when they change
  useEffect(() => {
    if (
      country?.countryCode &&
      (institution || accountNumber || userPayLoad.accountName)
    ) {
      const cleanedAccountNumber = accountNumber
        ? cleanAccountNumber(accountNumber)
        : undefined;
      saveRecipient(country.countryCode, {
        institution: institution || undefined,
        accountNumber: cleanedAccountNumber || undefined,
        accountName: userPayLoad.accountName || undefined,
        paymentMethod: userPayLoad.paymentMethod || undefined,
      });
    }
  }, [
    country?.countryCode,
    institution,
    accountNumber,
    userPayLoad.accountName,
    userPayLoad.paymentMethod,
    saveRecipient,
  ]);

  // Prefetch and persist account name when missing (bank only)
  useEffect(() => {
    const shouldPrefetch =
      userPayLoad.paymentMethod === "bank" &&
      !!country?.currency &&
      !!institution?.code &&
      !!accountNumber &&
      !userPayLoad.accountName &&
      !!kycData; // align with normal verifier gating

    if (!shouldPrefetch) return;

    let cancelled = false;
    (async () => {
      try {
        const resp = await verifyAccountDetails({
          bankId: institution!.code,
          bankName: institution!.name,
          accountNumber,
          currency: country!.currency,
        });

        if (cancelled) return;
        if (resp && !(resp instanceof Error) && resp.accountName) {
          updateSelection({ accountName: resp.accountName });
          if (country?.countryCode) {
            saveRecipient(country.countryCode, {
              institution: institution!,
              accountNumber,
              accountName: resp.accountName,
              paymentMethod: "bank",
            });
          }
        }
      } catch {
        // Ignore prefetch errors; UI verifier handles feedback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    userPayLoad.paymentMethod,
    country?.currency,
    country?.countryCode,
    institution?.code,
    institution?.name,
    accountNumber,
    userPayLoad.accountName,
    kycData,
    saveRecipient,
    updateSelection,
    country,
    institution,
  ]);

  const createMutation = useMutation({
    mutationFn: async (payload: QuoteRequest) =>
      buy ? await createQuoteIn(payload) : await createQuoteOut(payload),
    onSuccess: async (data) => {
      const cleanedAccountNumber = accountNumber
        ? cleanAccountNumber(accountNumber)
        : accountNumber;
      updateSelection({
        accountNumber: cleanedAccountNumber,
        orderStep: OrderStep.GotQuote,
      });

      if (!userPayLoad.paymentMethod) {
        updateSelection({ paymentMethod: "momo" });
      }

      // Create the transfer here too...
      if (userPayLoad.paymentMethod === "momo") {
        const { institution, country } = userPayLoad;
        const fullKYC = kycData?.fullKYC;

        // Determine if KYC can be bypassed for MoMo under $100 (USDC based)
        const isNigeriaOrSouthAfrican =
          country?.countryCode === "NG" || country?.countryCode === "ZA";
        const quoteCryptoAmount = parseFloat(
          String(data?.quote?.cryptoAmount || 0)
        );
        const quoteCryptoType = String(data?.quote?.cryptoType || "");
        const allowKycBypassForMomo =
          quoteCryptoType === "USDC" &&
          quoteCryptoAmount > 0 &&
          quoteCryptoAmount < 100;

        // Require KYC unless MoMo under $100 and not NG/ZA
        if (!country || (!fullKYC && !allowKycBypassForMomo)) return;

        const kycFields: KYCVerificationResponse["fullKYC"] | undefined =
          fullKYC;
        const {
          fullName,
          nationality,
          dateOfBirth,
          documentNumber,
          documentType,
          documentSubType,
        } = kycFields || ({} as KYCVerificationResponse["fullKYC"]);

        // accountNumber withouth the leading 0
        const accountNumberWithoutLeadingZero = accountNumber.replace(
          /^0+/,
          ""
        );

        const fullPhoneNumber = `${country.phoneCode}${accountNumberWithoutLeadingZero}`;
        let updatedDocumentType = documentType || "";
        let updatedDocumentTypeSubType = documentSubType || "";
        let payload;

        if (country.countryCode === "NG") {
          updatedDocumentTypeSubType = "BVN";
          updatedDocumentType = "NIN";
        }

        if (documentType) {
          if (documentType === "ID") {
            updatedDocumentType = "NIN";
          } else if (documentType === "P") {
            updatedDocumentType = "Passport";
          } else {
            updatedDocumentType = "License";
          }
        }

        const userDetails = {
          name:
            country?.countryCode === "NG" && userPayLoad.accountName
              ? userPayLoad.accountName
              : fullName || "",
          country: country?.countryCode || "",
          address: nationality || country?.name || "",
          phone: accountNumber,
          dob: dateOfBirth || "",
          idNumber: documentNumber || "",
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
          name:
            country?.countryCode === "NG" && userPayLoad.accountName
              ? userPayLoad.accountName
              : fullName,
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

  // Check if user has the required wallet for the selected network
  const hasRequiredWallet = useCallback(() => {
    if (!currentNetwork) return false;

    const isSupportedNetwork = SUPPORTED_NETWORKS_WITH_RPC_URLS.find(
      (network) => network.name === currentNetwork.name
    );

    return !!isSupportedNetwork && isConnected;
  }, [currentNetwork, isConnected]);

  // Update button disabled state and text whenever dependencies change
  useEffect(() => {
    // For Nigeria buy flow, account number is not required in the form
    const isNigeriaBuyFlow = buy && userPayLoad?.country?.countryCode === "NG";
    const requiresAccountNumber = !isNigeriaBuyFlow;

    const isDisabled =
      !isConnected ||
      !hasRequiredWallet() ||
      (requiresAccountNumber && !accountNumber) ||
      !institution ||
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
    buy,
    userPayLoad?.country?.countryCode,
    hasRequiredWallet,
    userPayLoad.appState,
  ]);

  const handleInstitutionSelect = (inst: Institution) => {
    let instType = inst.type;

    if (!inst.type) {
      instType = inst.accountNumberType;
    }

    if (typeof instType === "string" && instType.includes("mobile")) {
      instType = "momo";
    }

    // Check if we have saved data for this country
    const savedData = country?.countryCode
      ? getRecipient(country.countryCode)
      : null;

    // Use saved account number if it exists, otherwise leave blank
    const prefillAccountNumber = savedData?.accountNumber || "";

    updateSelection({
      institution: inst,
      paymentMethod: instType as "bank" | "momo",
      accountNumber: prefillAccountNumber,
    });

    // Save the selected institution immediately
    if (country?.countryCode) {
      saveRecipient(country.countryCode, {
        institution: inst,
        accountNumber: savedData?.accountNumber,
        accountName: savedData?.accountName,
        paymentMethod:
          (instType as "bank" | "momo") || savedData?.paymentMethod,
      });
    }

    setShowInstitutionModal(false);
    setValue("accountNumber", prefillAccountNumber);
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

    // Verify KYC – allow MoMo under $100 (USDC) to bypass, but never for bank
    const isMomo = userPayLoad.paymentMethod === "momo";
    const isNigeriaOrSouthAfrican =
      userPayLoad?.country?.countryCode === "NG" ||
      userPayLoad?.country?.countryCode === "ZA";

    // Amount here is in crypto terms for quote (USDC); rely on userAmountEntered
    const enteredCryptoAmount = parseFloat(String(userAmountEntered || 0));
    const allowKycBypassForMomo =
      isMomo &&
      !isNigeriaOrSouthAfrican &&
      enteredCryptoAmount > 0 &&
      enteredCryptoAmount < 100 &&
      true; // Asset can vary; threshold is in USD terms

    if (!allowKycBypassForMomo) {
      // Default KYC gates
      if (kycData && kycData.kycStatus !== "VERIFIED") {
        toast.error("KYC verification required");
        return;
      }

      if (
        kycData?.kycStatus === "REJECTED" ||
        kycData?.kycStatus === "IN_REVIEW"
      ) {
        toast.error(
          "KYC verification is not complete. Please wait for verification to finish."
        );
        return;
      }
    }

    let walletAddress;

    if (buy && data.walletAddress) {
      walletAddress = data.walletAddress;
      // Update both account number and wallet address in global state
      updateSelection({
        pastedAddress: data.walletAddress,
        accountNumber: cleanAccountNumber(data.accountNumber),
      });
    } else {
      walletAddress = address;
      // Update account number in global state
      updateSelection({
        accountNumber: cleanAccountNumber(data.accountNumber),
      });
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

  // Nigeria KYC phone validation (to show feedback under account input for buy flow)
  const isValidNigerianPhone = (input?: string | null) => {
    if (!input) return false;
    const phone = String(input).replace(/\s|-/g, "");
    return [/^\+234\d{10}$/i, /^234\d{10}$/i, /^0\d{10}$/].some((re) =>
      re.test(phone)
    );
  };
  const isNgPhoneInvalid =
    !!buy &&
    userPayLoad?.country?.countryCode === "NG" &&
    !isValidNigerianPhone(kycData?.fullKYC?.phoneNumber || "");

  const renderMpesa = (name: string) => {
    if (name.includes("SAFARICOM")) {
      return "M-PESA";
    }
    return name;
  };

  const isNigeria = userPayLoad?.country?.countryCode === "NG";

  return (
    <form onSubmit={onSubmit}>
      <div className={`mb-2 bg-[#232323] rounded-xl p-5 flex flex-col gap-4 `}>
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

          {/* Account Number - only show after institution is selected (hidden for NG buy flow) */}
          {institution && !(buy && isNigeria) && (
            <>
              <div className="flex-1 h-full w-full relative flex items-center justify-between ">
                {/* only show this if the institution is not Nigeria */}
                {!isNigeria && (
                  <div
                    className="flex items-center h-12 px-4 gap-2 bg-white !border-neutral-600  p-2"
                    style={{
                      borderRadius: "2rem 0 0 2rem",
                    }}
                  >
                    <div className="size-4  rounded-full relative">
                      <img
                        src={country?.logo}
                        alt={country?.name}
                        className="size-full object-cover"
                      />
                    </div>
                    <h1 className="text-base font-semibold ">
                      {country?.phoneCode}
                    </h1>
                  </div>
                )}
                <Input
                  type="number"
                  placeholder="7XXXXXXXX"
                  disabled={isVerifyingPhoneNumber}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.value.length > 15) {
                      target.value = target.value.slice(0, 15);
                    }
                  }}
                  {...register("accountNumber", {
                    required: "Account number is required",
                    validate: {
                      validLength: (value) => {
                        if (!userPayLoad?.country?.accountNumberLength)
                          return true;

                        if (value.length > 15) {
                          // return "Account number cannot exceed 15 characters";
                          toast.error(
                            "Account number cannot exceed 15 characters"
                          );
                          return false;
                        }

                        // if (userPayLoad.paymentMethod === "momo") {
                        //   const minLength =
                        //     userPayLoad.country.accountNumberLength
                        //       .mobileLength;
                        //   toast.error(
                        //     `Mobile number must be at least ${minLength} digits`
                        //   );
                        //   return false;
                        // }
                        return true;
                      },
                    },
                  })}
                  className={`bg-transparent border   !border-neutral-600 text-lg  text-white font-medium h-12 pl-2 pr-12 w-full focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&]:appearance-none ${
                    touchedFields.accountNumber && errors.accountNumber
                      ? "border-red-500 focus:border-red-500"
                      : "focus:border-purple-400"
                  }`}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                    borderRadius: isNigeria ? "2rem" : "0 2rem 2rem 0",
                    paddingLeft: "1rem",
                    // borderLeft: isNigeria ? "none" : "1px solid #444",
                  }}
                />
                {/* Status indicator inside input */}
                {accountNumber && isAccountNumberValid() && (
                  <AccountStatusIndicator accountNumber={accountNumber} />
                )}

                {isVerifyingPhoneNumber && (
                  <div className="absolute right-3 top-0 bottom-0 flex items-center justify-center">
                    <Loader className="size-4 animate-spin text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Account name display below input */}
              {accountNumber && isAccountNumberValid() && (
                <AccountNameDisplay accountNumber={accountNumber} />
              )}

              {/* Nigeria-specific KYC phone feedback under account input when buying */}
              {isNgPhoneInvalid && (
                <p className="mt-1 text-[10px] text-red-500">
                  Invalid Nigerian phone number in KYC.
                </p>
              )}
            </>
          )}

          {/* Nigeria-specific KYC phone feedback below institution selector when account input is hidden */}
          {institution &&
            buy &&
            userPayLoad?.country?.countryCode === "NG" &&
            isNgPhoneInvalid && (
              <p className="mt-1 text-[12px] text-red-500 text-center">
                Invalid Nigerian phone number in KYC.
              </p>
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
          institutions={institutions}
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
                !institution ||
                isVerifyingPhoneNumber
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
    </form>
  );
};

export default SelectInstitution;
