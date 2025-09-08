// Tanzania cashout fee ranges and corresponding fees
const TANZANIA_CASHOUT_FEE_RANGES = [
  { min: 0, max: 999, fee: 185 },
  { min: 1000, max: 1999, fee: 360 },
  { min: 2000, max: 2999, fee: 410 },
  { min: 3000, max: 3999, fee: 614 },
  { min: 4000, max: 4999, fee: 677 },
  { min: 5000, max: 6999, fee: 1004 },
  { min: 7000, max: 9999, fee: 1056 },
  { min: 10000, max: 14999, fee: 1552 },
  { min: 15000, max: 19999, fee: 1645 },
  { min: 20000, max: 29999, fee: 2156 },
  { min: 30000, max: 39999, fee: 2201 },
  { min: 40000, max: 49999, fee: 2769 },
  { min: 50000, max: 99999, fee: 3273 },
  { min: 100000, max: 199999, fee: 4357 },
  { min: 200000, max: 299999, fee: 6121 },
  { min: 300000, max: 399999, fee: 7338 },
  { min: 400000, max: 499999, fee: 7932 },
  { min: 500000, max: 599999, fee: 8745 },
  { min: 600000, max: 699999, fee: 9532 },
  { min: 700000, max: 799999, fee: 9700 },
  { min: 800000, max: 899999, fee: 9750 },
  { min: 900000, max: 1000000, fee: 9776 },
  { min: 1000001, max: 3000000, fee: 9875 },
  { min: 3000001, max: Infinity, fee: 12000 },
];

// Uganda cashout fee ranges (Withdraw from Agent fees in UGX)
const UGANDA_WITHDRAW_FEE_RANGES = [
  { min: 0, max: 2500, fee: 330 },
  { min: 2501, max: 5000, fee: 440 },
  { min: 5001, max: 15000, fee: 700 },
  { min: 15001, max: 30000, fee: 880 },
  { min: 30001, max: 45000, fee: 1210 },
  { min: 45001, max: 60000, fee: 1500 },
  { min: 60001, max: 125000, fee: 1925 },
  { min: 125001, max: 250000, fee: 3575 },
  { min: 250001, max: 500000, fee: 7000 },
  { min: 500001, max: 1000000, fee: 12500 },
  { min: 1000001, max: 2000000, fee: 15000 },
  { min: 2000001, max: 3000000, fee: 18000 },
  { min: 3000001, max: 4000000, fee: 18000 },
  { min: 4000001, max: 5000000, fee: 18000 },
];

// Uganda tax rate (0.5% of transaction amount)
const UGANDA_TAX_RATE = 0.005;

/**
 * Calculate the cashout fee for a given amount based on country
 * @param amount - The amount in local currency
 * @param countryName - Name of the country
 * @returns The total cashout fee in local currency
 */
export function calculateCashoutFee(amount: number, countryName?: string): number {
  if (!countryName) return 0;
  
  const country = countryName.toLowerCase();
  
  if (country === "tanzania") {
    const range = TANZANIA_CASHOUT_FEE_RANGES.find(
      (range) => amount >= range.min && amount <= range.max
    );
    return range ? range.fee : 0;
  }
  
  if (country === "uganda") {
    // Get withdraw from agent fee
    const withdrawRange = UGANDA_WITHDRAW_FEE_RANGES.find(
      (range) => amount >= range.min && amount <= range.max
    );
    const withdrawFee = withdrawRange ? withdrawRange.fee : 0;
    
    // Calculate tax (0.5% of amount)
    const taxAmount = Math.round(amount * UGANDA_TAX_RATE);
    
    return withdrawFee + taxAmount;
  }
  
  return 0;
}

/**
 * Get detailed breakdown of cashout fees for Uganda
 * @param amount - The amount in UGX
 * @returns Object with withdraw fee, tax amount, and total
 */
export function getUgandaCashoutBreakdown(amount: number): {
  withdrawFee: number;
  taxAmount: number;
  total: number;
} {
  const withdrawRange = UGANDA_WITHDRAW_FEE_RANGES.find(
    (range) => amount >= range.min && amount <= range.max
  );
  const withdrawFee = withdrawRange ? withdrawRange.fee : 0;
  const taxAmount = Math.round(amount * UGANDA_TAX_RATE);
  
  return {
    withdrawFee,
    taxAmount,
    total: withdrawFee + taxAmount,
  };
}

/**
 * Check if the country supports cashout fees
 * @param countryName - Name of the country
 * @returns boolean indicating if cashout fees are supported
 */
export function supportsCashoutFees(countryName: string): boolean {
  const country = countryName.toLowerCase();
  return country === "tanzania" || country === "uganda";
}
