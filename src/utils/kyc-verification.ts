import { getCNGNKYCThreshold } from "@/src/lib/exchange-rates-data";
import { Country, Asset } from "@/types";

/**
 * KYC Verification Result
 */
export interface KYCVerificationResult {
  /**
   * Whether the transaction should proceed
   */
  shouldProceed: boolean;

  /**
   * Whether KYC verification is required
   */
  requiresKYC: boolean;

  /**
   * Reason for blocking/requiring KYC (for error messages)
   */
  reason?: string;

  /**
   * Whether KYC bypass is allowed for this transaction
   */
  bypassAllowed: boolean;
}

/**
 * KYC Verification Options
 */
export interface KYCVerificationOptions {
  /**
   * Transaction amount (as string or number)
   */
  amount: string | number;

  /**
   * Selected country
   */
  country?: Country | null;

  /**
   * Selected asset (for determining thresholds)
   */
  asset?: Asset | null;

  /**
   * Payment method (momo, bank, etc.)
   */
  paymentMethod?: string | null;

  /**
   * KYC data from the store/API
   */
  kycData?: {
    kycStatus?: string;
    [key: string]: unknown;
  } | null;

  /**
   * Exchange rate for USD conversion (for pay interface)
   * If provided, will use this to convert to USD for threshold check
   */
  exchangeRate?: number;

  /**
   * Order type: "buying" or "selling" (affects threshold calculation)
   */
  orderType?: "buying" | "selling";
}

/**
 * Global KYC verification utility function
 * Can be used as middleware in submit functions to check KYC validity
 *
 * @param options - KYC verification options
 * @returns KYC verification result
 *
 * @example
 * ```ts
 * const result = verifyKYC({
 *   amount: "100",
 *   country: selectedCountry,
 *   asset: selectedAsset,
 *   paymentMethod: "momo",
 *   kycData: kycData,
 *   orderType: "buying"
 * });
 *
 * if (!result.shouldProceed) {
 *   // Show KYC modal, reset button, show error
 *   return;
 * }
 *
 * // Proceed with transaction
 * ```
 */
export function verifyKYC(
  options: KYCVerificationOptions
): KYCVerificationResult {
  const {
    amount,
    country,
    asset,
    // paymentMethod,
    kycData,
    exchangeRate,
    orderType = "buying",
  } = options;

  // Parse amount to number
  const numericAmount = parseFloat(String(amount || 0));

  // Determine threshold based on asset and order type
  let threshold: number;
  let amountInUsd: number;

  if (orderType === "selling") {
    // For pay interface: amount is in local fiat, convert to USD
    if (exchangeRate && exchangeRate > 0) {
      amountInUsd = numericAmount / exchangeRate;
    } else {
      // Fallback: use country exchange rate
      const rateForUsd = country?.exchangeRate || 0;
      amountInUsd = rateForUsd > 0 ? numericAmount / rateForUsd : 0;
    }
    threshold = 100; // $100 USD threshold for selling/paying
  } else {
    // For buy interface: amount is already in crypto/USD
    amountInUsd = numericAmount;

    // Use asset-specific threshold
    if (asset?.symbol === "cNGN") {
      const cngnThreshold = getCNGNKYCThreshold(); // Dynamic: ~$1000 in NGN
      threshold = cngnThreshold;
    } else {
      threshold = 100; // $100 USD threshold for USDC/USDT
    }
  }

  // Determine if KYC bypass is allowed
  let bypassAllowed = false;

  if (orderType === "selling") {
    // Pay interface: bypass allowed if amount in USD is below threshold
    bypassAllowed = amountInUsd > 0 && amountInUsd < threshold;
  } else {
    // Buy interface: bypass allowed for MoMo payments (except NG and ZA)
    bypassAllowed =
      country?.countryCode !== "NG" &&
      country?.countryCode !== "ZA" &&
      numericAmount > 0 &&
      numericAmount < threshold;
  }

  // If bypass is allowed, proceed without KYC check
  if (bypassAllowed) {
    return {
      shouldProceed: true,
      requiresKYC: false,
      bypassAllowed: true,
    };
  }

  // Check if KYC data exists
  if (!kycData) {
    return {
      shouldProceed: false,
      requiresKYC: true,
      bypassAllowed: false,
      reason: "KYC verification required",
    };
  }

  // Check KYC status (handle both string and typed values)
  const kycStatus = kycData.kycStatus?.toString().toUpperCase();

  // If verified, proceed
  if (kycStatus === "VERIFIED") {
    return {
      shouldProceed: true,
      requiresKYC: false,
      bypassAllowed: false,
    };
  }

  // If rejected or in review, block with appropriate message
  if (kycStatus === "REJECTED") {
    return {
      shouldProceed: false,
      requiresKYC: true,
      bypassAllowed: false,
      reason: "KYC verification was rejected. Please contact support.",
    };
  }

  if (kycStatus === "IN_REVIEW") {
    return {
      shouldProceed: false,
      requiresKYC: true,
      bypassAllowed: false,
      reason:
        "KYC verification is not complete. Please wait for verification to finish.",
    };
  }

  // If pending or any other status, require KYC
  return {
    shouldProceed: false,
    requiresKYC: true,
    bypassAllowed: false,
    reason: "KYC verification required",
  };
}
