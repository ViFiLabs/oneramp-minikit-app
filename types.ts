import { Chain } from "viem";
import { SUPPORTED_NETWORK_NAMES } from "./data/networks";

export enum ChainTypes {
  EVM = "evm",
}

export enum OrderStep {
  Initial = "Initial",
  GotQuote = "GotQuote",
  GotTransfer = "GotTransfer",
  ProcessingPayment = "ProcessingPayment",
  WaitingForPayment = "WaitingForPayment",
  PaymentReceived = "PaymentReceived",
  PaymentFailed = "PaymentFailed",
  PaymentRefunded = "PaymentRefunded",
  PaymentCompleted = "PaymentCompleted",
  PaymentExpired = "PaymentExpired",
}

export enum TransferStatusEnum {
  TransferStarted = "TransferStarted",
  TransferComplete = "TransferComplete",
  TransferFailed = "TransferFailed",
  TransferRefunded = "TransferRefunded",
  TransferExpired = "TransferExpired",
}

export interface Network extends Omit<Chain, "id"> {
  name: string;
  logo: string;
  type: ChainTypes;
  chainId: number;
  tokenAddress?: string;
  id: string | number;
  explorers?: {
    [key: string]: string[];
  };
  chainNamespace: "eip155" | "solana" | "bip122" | "polkadot" | "cosmos";
  caipNetworkId:
    | `eip155:${string}`
    | `eip155:${number}`
    | `solana:${string}`
    | `solana:${number}`
    | `bip122:${string}`
    | `bip122:${number}`
    | `polkadot:${string}`
    | `polkadot:${number}`
    | `cosmos:${string}`
    | `cosmos:${number}`;
}

export enum TransferType {
  TransferIn = "TransferIn",
  TransferOut = "TransferOut",
}

export interface Asset {
  network: string;
  name: string;
  logo: string;
  symbol: string;
  networks: Partial<{
    [key in (typeof SUPPORTED_NETWORK_NAMES)[number]]: Network;
  }>;
}

export interface Institution {
  name: string;
  code: string;
  status: string;
  accountNumberType: string;
  country: string;
  bankId: string;
  id: string;
  seerbitId: string;
  countryAccountNumberType: string;
  createdAt: string;
  updatedAt: string;
  featureFlagEnabled: string[];
  tempDisabledFor: string[];
  channelIds: string[];
  [key: string]: string | string[] | number | boolean;
}

export interface AccountNumberInputDetails {
  bankLength: number;
  mobileLength: number;
}

export interface Country {
  name: string;
  logo: string;
  currency: string;
  countryCode: string;
  phoneCode: string;
  exchangeRate: number;
  institutions: Institution[];
  fiatMinMax: MINMAX;
  cryptoMinMax: MINMAX;
  accountNumberLength: AccountNumberInputDetails;
}

export interface UserSelectionGlobalState {
  network?: Network;
  country?: Country;
  asset?: Asset;
  cryptoAmount?: number;
  fiatAmount?: number;
  address?: string;
  paymentMethod: "bank" | "momo";
  institution?: Institution;
  accountNumber?: string;
  accountName?: string;
  orderStep: OrderStep;
  appState: AppState;
  pastedAddress?: string;
  countryPanelOnTop?: boolean;
  billTillPayout?: UserBillTillPayout;
  isPayout?: boolean;
}

export interface UserBillTillPayout {
  tillNumber?: string;
  billNumber?: string;
  accountNumber?: string;
  phoneNumber?: string;
  accountName?: string;
}

export interface MINMAX {
  min: number;
  max: number;
}

export interface Quote {
  fiatType: string;
  cryptoType: string;
  fiatAmount: string;
  cryptoAmount: string;
  country: string;
  amountPaid: string;
  address: string;
  fee: string;
  guaranteedUntil: string;
  transferType: TransferType;
  feeInFiat: string;
  quoteId: string;
  network: string;
  used: boolean;
  requestType: string;
  id: string;
}

export interface Transfer {
  transferId: string;
  transferStatus: string;
  transferAddress: string;
  userActionDetails: {
    accountNumber: string;
    accountName: string;
    transactionReference: string;
    userActionType: string;
    institutionName: string;
    paymentLink?: string;
  };
  transactionHash?: string;
}

export interface TransferStatus {
  status: TransferStatusEnum;
  transferType: TransferType;
  fiatType: string;
  cryptoType: string;
  amountProvided: string;
  amountReceived: string;
  fiatAccountId: string;
  transferId: string;
  transferAddress: string;
  txHash?: string;
  userActionDetails: {
    userActionType: string;
    institutionName: string;
    accountNumber: string;
    accountName: string;
    transactionReference: string;
  };
}

export interface QuoteRequest {
  fiatType: string;
  cryptoType: string;
  network: string;
  cryptoAmount: string;
  country: string;
  address: string;
}

// {
//   "fiatType": "NGN",
//   "cryptoType": "USDC",
//   "network": "celo",
//   //   "fiatAmount": "3500",
//   "cryptoAmount": "6",
//   "country": "NG",
//   "address": "0x240ef8C7Ae6eB6C1A80Da77F5586EeE76d50C589"
// }

export interface ExchangeRateRequest {
  country: string;
  orderType: string;
  providerType: string;
}

export interface ExchangeRateResponse {
  country: string;
  exchange: number;
  conversionResponse: {
    success: boolean;
    chargeFeeInFiat: number;
    chargeFeeInUsd: number;
    exchangeRate: number;
    cryptoAmount: number;
    fiatAmount: number;
    providerPayoutAmount: number;
    gasFeeInFiat: number;
  };
}

// Institution interface of type key value pair

export interface KYCVerificationResponse {
  kycStatus: string;
  message: {
    link: string;
  };
  addressKYC: {
    userKYC: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  };
  fullKYC: {
    createdAt: string;
    dateOfBirth: string;
    documentNumber: string;
    documentSubType: string;
    documentType: string;
    email: string;
    firstName: string;
    lastName: string;
    nationality: string;
    fullName: string;
    additionalIdType: string;
    additionalIdNumber: string;
    additionalIdTypeSubType: string;
    phoneNumber?: string;
  };
}

export interface VerifyAccountDetailsRequest {
  bankId: string;
  accountNumber: string;
  currency: string;
}

export enum AppState {
  Idle = "Idle",
  Processing = "Processing",
}

export interface TransferMomoRequest {
  phone?: string;
  operator: string;
  quoteId: string;
  bank?: {
    code: string;
    accountNumber: string;
    accountName: string;
  };
  userDetails: {
    name: string;
    country: string;
    address: string;
    phone: string;
    dob: string;
    idNumber: string;
    idType: string;
    additionalIdType?: string;
    additionalIdNumber?: string;
    additionalIdTypeSubType?: string;
  };
}

export interface TransferBankRequest {
  quoteId: string;
  operator: string;
  bank: {
    code: string;
    accountNumber: string;
    accountName: string;
  };
  userDetails: {
    name: string;
    country: string;
    address: string;
    phone: string;
    dob: string;
    idNumber: string;
    idType: string;
    additionalIdType?: string;
    additionalIdNumber?: string;
    additionalIdTypeSubType?: string;
  };
}

export interface SubmitTransactionHashRequest {
  transferId: string;
  txHash: string;
}

// | "INITIATED"
//       | "IN-PROGRESS"
//       | "DONE"
//       | "FAILED"
//       | "REFUNDED"
//       | "IS-REFUNDING"
//       | "INITIATED"
//       | "IN-PROGRESS"
//       | "DONE"
//       | "FAILED"
//       | "REFUNDED"
//       | "IS-REFUNDING"

export enum TransactionStatus {
  INITIATED = "INITIATED",
  IN_PROGRESS = "IN-PROGRESS",
  DONE = "DONE",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  IS_REFUNDING = "IS-REFUNDING",
}

export interface Transaction {
  _id: string;
  amount: number;
  recieves: number;
  quoteId: string;
  orderno: string;
  orderType: string;
  transactionId: string;
  transferId: string;
  asset: string;
  address: string;
  phone: string;
  network: string;
  currency: string;
  paidIn: string;
  chain: string;
  amountPaid: number;
  operator: string;
  status: TransactionStatus;
  createdAt: string;
  txId: string;
}

// BILLS / TILL / PAYOUT
export interface BillQuoteRequest {
  fiatType: string;
  cryptoType: string;
  region: string;
  fiatAmount: string;
  network: string;
  country: string;
  address: string;
  rawAmount: string;
}
export interface BillTillQuoteRequest {
  fiatType: string;
  cryptoType: string;
  region: string;
  fiatAmount: string;
  network: string;
  country: string;
  address: string;
  rawAmount: string;
  quoteType: "bill" | "till" | "payout";
}

export interface TillRequest {
  quoteId: string;
  accountName: string;
  accountNumber: string;
}

export interface BillTillRequest {
  quoteId: string;
  accountName: string;
  accountNumber: string;
  businessNumber?: string;
  requestType: "bill" | "till" | "payout";
}

export interface TillRequest {
  quoteId: string;
  accountName: string;
  accountNumber: string;
}

export interface BillTillRequest {
  quoteId: string;
  accountName: string;
  accountNumber: string;
  businessNumber?: string;
  requestType: "bill" | "till" | "payout";
}

export interface GetBusinessAccountNameRequest {
  accountNumber: string;
  accountType: "paybill" | "till" | "phone";
}

// {
//   "success": true,
//   "data": {
//       "accountId": "400200",
//       "accountName": "Co-operative Bank Money Transfer"
//   }
// }

export interface GetBusinessAccountNameResponse {
  accountId: string;
  accountName: string;
}
