// Demo file to test cashout fee calculations
import { calculateCashoutFee, supportsCashoutFees } from "./cashout-fees";

// Test cases for cashout fee calculation
console.log("=== Tanzania Cashout Fee Calculator Demo ===");
console.log("");

const testAmounts = [
  500,     // Should be 185
  1500,    // Should be 360
  2500,    // Should be 410
  5000,    // Should be 1004
  10000,   // Should be 1552
  50000,   // Should be 3273
  100000,  // Should be 4357
  500000,  // Should be 8745
  1000000, // Should be 9776
  2000000, // Should be 9875
  4000000, // Should be 12000
];

testAmounts.forEach(amount => {
  const fee = calculateCashoutFee(amount);
  console.log(`Amount: ${amount.toLocaleString()} TZS -> Cashout Fee: ${fee.toLocaleString()} TZS`);
});

console.log("");
console.log("Country Support Test:");
console.log(`Tanzania supports cashout fees: ${supportsCashoutFees("Tanzania")}`);
console.log(`Kenya supports cashout fees: ${supportsCashoutFees("Kenya")}`);
console.log(`Uganda supports cashout fees: ${supportsCashoutFees("Uganda")}`);

export {};
