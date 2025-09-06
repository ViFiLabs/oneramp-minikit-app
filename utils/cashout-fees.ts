// Tanzania cashout fee ranges and corresponding fees
const CASHOUT_FEE_RANGES = [
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

/**
 * Calculate the cashout fee for a given amount in TZS
 * @param amount - The amount in TZS
 * @returns The cashout fee in TZS
 */
export function calculateCashoutFee(amount: number): number {
  const range = CASHOUT_FEE_RANGES.find(
    (range) => amount >= range.min && amount <= range.max
  );
  
  return range ? range.fee : 0;
}

/**
 * Check if the country supports cashout fees
 * @param countryName - Name of the country
 * @returns boolean indicating if cashout fees are supported
 */
export function supportsCashoutFees(countryName: string): boolean {
  return countryName.toLowerCase() === "tanzania";
}
