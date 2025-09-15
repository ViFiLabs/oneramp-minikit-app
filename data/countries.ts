import { Country } from "@/types";

// Simplified institution interface for static data
interface SimpleInstitution {
  name: string;
}

// Payment support configuration for countries
export interface PaymentSupport {
  name: string;
  countryCode: string;
  supportedPaymentTypes: ("Buy Goods" | "Paybill" | "Send Money")[];
  requiresInstitution: boolean;
}

// Define which countries support Pay functionality and their capabilities
export const PAY_SUPPORTED_COUNTRIES: PaymentSupport[] = [
  {
    name: "Kenya",
    countryCode: "KE",
    supportedPaymentTypes: ["Buy Goods", "Paybill", "Send Money"],
    requiresInstitution: false, // Kenya doesn't need institution selection for Buy Goods/Paybill
  },
  {
    name: "Uganda",
    countryCode: "UG",
    supportedPaymentTypes: ["Send Money"],
    requiresInstitution: true,
  },
  {
    name: "Tanzania",
    countryCode: "TZ",
    supportedPaymentTypes: ["Send Money"],
    requiresInstitution: true,
  },
  // Future countries can be easily added here:
  // {
  //   name: "Ghana",
  //   supportedPaymentTypes: ["Send Money"],
  //   requiresInstitution: true,
  // },
];

// Helper function to get supported countries for Pay interface
export const getPaySupportedCountries = () => {
  return countries.filter((country) =>
    PAY_SUPPORTED_COUNTRIES.some((supported) => supported.name === country.name)
  );
};

// Helper function to get payment support for a specific country
export const getPaymentSupport = (
  countryName: string
): PaymentSupport | undefined => {
  return PAY_SUPPORTED_COUNTRIES.find(
    (supported) => supported.name === countryName
  );
};

// Helper function to check if a payment type is supported for a country
export const isPaymentTypeSupported = (
  countryName: string,
  paymentType: string
): boolean => {
  const support = getPaymentSupport(countryName);
  return (
    support?.supportedPaymentTypes.includes(
      paymentType as "Buy Goods" | "Paybill" | "Send Money"
    ) || false
  );
};

// Helper function to check if a country requires institution selection
export const requiresInstitutionSelection = (countryName: string): boolean => {
  const support = getPaymentSupport(countryName);
  return support?.requiresInstitution || false;
};

// Country-specific institution lists
export const countryInstitutions: Record<string, SimpleInstitution[]> = {
  Nigeria: [
    { name: "OPay" },
    { name: "PalmPay" },
    { name: "Moniepoint MFB" },
    { name: "Kuda Microfinance Bank" },
    { name: "Access Bank" },
    { name: "Citibank" },
    { name: "Diamond Bank" },
    { name: "Ecobank Bank" },
    { name: "FBNQuest Merchant Bank" },
    { name: "FCMB" },
    { name: "Fidelity Bank" },
    { name: "First Bank Of Nigeria" },
    { name: "FSDH Merchant Bank" },
    { name: "Greenwich Merchant Bank" },
    { name: "Guaranty Trust Bank" },
    { name: "Heritage" },
    { name: "Jaiz Bank" },
    { name: "Keystone Bank" },
    { name: "Paystack-Titan MFB" },
    { name: "Polaris Bank" },
    { name: "Providus Bank" },
    { name: "Rand Merchant Bank" },
    { name: "Safe Haven MFB" },
    { name: "Stanbic IBTC Bank" },
    { name: "Standard Chartered Bank" },
    { name: "Sterling Bank" },
    { name: "Suntrust Bank" },
    { name: "Union Bank" },
    { name: "United Bank for Africa" },
    { name: "Unity Bank" },
    { name: "Wema Bank" },
    { name: "Zenith Bank" },
  ],
  Kenya: [
    { name: "AIRTEL" },
    { name: "M-PESA" },
    { name: "ABSA Bank Kenya" },
    { name: "African Bank Corporation Limited" },
    { name: "Bank of Africa" },
    { name: "Bank of Baroda" },
    { name: "Caritas Microfinance Bank" },
    { name: "Choice Microfinance Bank Kenya Limited" },
    { name: "Citi Bank" },
    { name: "Commercial International Bank Kenya Limited" },
    { name: "Consolidated Bank Kenya" },
    { name: "Cooperative Bank of Kenya" },
    { name: "Credit Bank Limited" },
    { name: "Diamond Trust Bank" },
    { name: "Dubai Islamic Bank" },
    { name: "Ecobank Transnational Inc." },
    { name: "Equity Bank" },
    { name: "Family Bank" },
    { name: "Faulu Bank" },
    { name: "First Community Bank" },
    { name: "Guaranty Trust Holding Company PLC" },
    { name: "Guardian Bank Limited" },
    { name: "Gulf African Bank" },
    { name: "Housing finance Company" },
    { name: "Investments & Morgage Limited" },
    { name: "Kenya Commercial Bank" },
    { name: "Kenya Women Microfinance Bank" },
    { name: "Kingdom Bank Limited" },
    { name: "Middle East Bank" },
    { name: "National Bank of Kenya" },
    { name: "National Commercial Bank of Africa" },
    { name: "Oriental Commercial Bank Limited" },
    { name: "Paramount Bank" },
    { name: "Prime Bank Limited" },
    { name: "SBM Bank Kenya" },
    { name: "Sidian Bank" },
    { name: "Stanbic Bank Kenya" },
    { name: "Standard Chartered Kenya" },
    { name: "Stima SACCO" },
    { name: "Unaitas Sacco" },
    { name: "United Bank for Africa" },
    { name: "Victoria Commercial Bank" },
  ],
  Uganda: [{ name: "AIRTEL" }, { name: "MTN" }],
  Ghana: [{ name: "AIRTEL" }, { name: "MTN" }],
  Zambia: [{ name: "AIRTEL" }, { name: "MTN" }],
  Tanzania: [
    { name: "AIRTEL" },
    { name: "MTN" },
    { name: "SAFARICOM" },
    { name: "VADAFORN" },
  ],
  SouthAfrica: [
    { name: "AIRTEL" },
    { name: "MTN" },
    { name: "SAFARICOM" },
    { name: "VADAFORN" },
  ],
};

export const countryCurrencies = [
  { name: "Nigeria", logo: "/logos/nigeria.png" },
  { name: "Kenya", logo: "/logos/kenya.png" },
  { name: "Zambia", logo: "/logos/zambia.png" },
  { name: "Uganda", logo: "/logos/uganda.png" },
  { name: "Tanzania", logo: "/logos/tanzania.png" },
  { name: "South Africa", logo: "/logos/southafrica.png" },
  { name: "Ghana", logo: "/logos/ghana.png" },
];

export const countries: Country[] = [
  {
    name: "Nigeria",
    logo: "/logos/nigeria.png",
    currency: "NGN",
    countryCode: "NG",
    phoneCode: "+234",
    exchangeRate: 1_588.69,
    institutions: [],
    fiatMinMax: { min: 3_000, max: 3_375_000 },
    cryptoMinMax: { min: 1, max: 2_500 },
    accountNumberLength: {
      bankLength: 10,
      mobileLength: 9,
    },
  },
  {
    name: "Kenya",
    logo: "/logos/kenya.png",
    currency: "KES",
    countryCode: "KE",
    phoneCode: "+254",
    exchangeRate: 130,
    institutions: [],
    fiatMinMax: { min: 120, max: 450_000 },
    cryptoMinMax: { min: 1, max: 2_500 },
    accountNumberLength: {
      bankLength: 13,
      mobileLength: 10,
    },
  },
  // {
  //   name: "Zambia",
  //   logo: "/logos/zambia.png",
  //   currency: "ZMW",
  //   countryCode: "ZM",
  //   phoneCode: "+260",
  //   exchangeRate: 127.38,
  //   institutions: [],
  //   fiatMinMax: { min: 110.38, max: 100_000 },
  //   cryptoMinMax: { min: 5, max: 2_500 },
  //   accountNumberLength: {
  //     bankLength: 11,
  //     mobileLength: 10,
  //   },
  // },
  {
    name: "Uganda",
    logo: "/logos/uganda.png",
    currency: "UGX",
    countryCode: "UG",
    phoneCode: "+256",
    exchangeRate: 3_804.44,
    institutions: [],
    fiatMinMax: { min: 2_500, max: 5_000_000 },
    cryptoMinMax: { min: 1, max: 2_500 },
    accountNumberLength: {
      bankLength: 10,
      mobileLength: 10,
    },
  },
  {
    name: "Tanzania",
    logo: "/logos/tanzania.png",
    currency: "TZS",
    countryCode: "TZ",
    phoneCode: "+255",
    exchangeRate: 2_941.0,
    institutions: [],
    fiatMinMax: { min: 1_800.0, max: 13_475_000 },
    cryptoMinMax: { min: 1, max: 2_500 },
    accountNumberLength: {
      bankLength: 12,
      mobileLength: 10,
    },
  },
  // {
  //   name: "South Africa",
  //   logo: "/logos/southafrica.png",
  //   currency: "ZAR",
  //   countryCode: "ZA",
  //   phoneCode: "+27",
  //   exchangeRate: 18.57,
  //   institutions: [],
  //   fiatMinMax: { min: 300, max: 35_000 },
  //   cryptoMinMax: { min: 15, max: 2_500 },
  //   accountNumberLength: {
  //     bankLength: 13,
  //     mobileLength: 10,
  //   },
  // },
  {
    name: "Ghana",
    logo: "/logos/ghana.png",
    currency: "GHS",
    countryCode: "GHA",
    phoneCode: "+233",
    exchangeRate: 15.43,
    institutions: [],
    fiatMinMax: { min: 15.43, max: 35_000 },
    cryptoMinMax: { min: 1, max: 2_500 },
    accountNumberLength: {
      bankLength: 13,
      mobileLength: 10,
    },
  },
];

export const GLOBAL_MIN_MAX = {
  min: 1,
  max: 2_500,
};
