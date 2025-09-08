// Quick test for Uganda cashout fee calculation
import { calculateCashoutFee, getUgandaCashoutBreakdown, supportsCashoutFees } from "./utils/cashout-fees";

console.log("=== Uganda Cashout Fee Test ===");

// Test amount: 10,000 UGX
const testAmount = 10000;
const country = "Uganda";

console.log(`Amount: ${testAmount.toLocaleString()} UGX`);
console.log(`Country: ${country}`);
console.log(`Supports cashout fees: ${supportsCashoutFees(country)}`);

const totalFee = calculateCashoutFee(testAmount, country);
console.log(`Total cashout fee: ${totalFee.toLocaleString()} UGX`);

const breakdown = getUgandaCashoutBreakdown(testAmount);
console.log(`Breakdown:`);
console.log(`  - Withdraw from Agent: ${breakdown.withdrawFee.toLocaleString()} UGX`);
console.log(`  - Tax (0.5%): ${breakdown.taxAmount.toLocaleString()} UGX`);
console.log(`  - Total: ${breakdown.total.toLocaleString()} UGX`);

console.log("\n=== Tanzania Test ===");
const tanzaniaAmount = 1800;
const tanzaniaFee = calculateCashoutFee(tanzaniaAmount, "Tanzania");
console.log(`Amount: ${tanzaniaAmount.toLocaleString()} TZS`);
console.log(`Total cashout fee: ${tanzaniaFee.toLocaleString()} TZS`);

export {};
