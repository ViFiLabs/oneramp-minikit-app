import {
  calculateCashoutFee,
  supportsCashoutFees,
  getUgandaCashoutBreakdown,
} from "../src/utils/cashout-fees";

describe("Cashout Fees", () => {
  describe("calculateCashoutFee", () => {
    describe("Tanzania", () => {
      it("should calculate correct fees for different amount ranges", () => {
        // Test various ranges for Tanzania
        expect(calculateCashoutFee(500, "Tanzania")).toBe(185);
        expect(calculateCashoutFee(999, "Tanzania")).toBe(185);
        expect(calculateCashoutFee(1000, "Tanzania")).toBe(360);
        expect(calculateCashoutFee(1500, "Tanzania")).toBe(360);
        expect(calculateCashoutFee(1999, "Tanzania")).toBe(360);
        expect(calculateCashoutFee(2000, "Tanzania")).toBe(410);
        expect(calculateCashoutFee(5000, "Tanzania")).toBe(1004);
        expect(calculateCashoutFee(10000, "Tanzania")).toBe(1552);
        expect(calculateCashoutFee(50000, "Tanzania")).toBe(3273);
        expect(calculateCashoutFee(100000, "Tanzania")).toBe(4357);
        expect(calculateCashoutFee(500000, "Tanzania")).toBe(8745);
        expect(calculateCashoutFee(1000000, "Tanzania")).toBe(9776);
        expect(calculateCashoutFee(2000000, "Tanzania")).toBe(9875);
        expect(calculateCashoutFee(4000000, "Tanzania")).toBe(12000);
      });
    });

    describe("Uganda", () => {
      it("should calculate correct fees including withdraw fee and tax", () => {
        // Test various ranges for Uganda (withdraw fee + 0.5% tax)

        // Amount: 1000 UGX -> Withdraw: 330, Tax: 5 (0.5% of 1000), Total: 335
        expect(calculateCashoutFee(1000, "Uganda")).toBe(335);

        // Amount: 2500 UGX -> Withdraw: 330, Tax: 13 (0.5% of 2500), Total: 343
        expect(calculateCashoutFee(2500, "Uganda")).toBe(343);

        // Amount: 3000 UGX -> Withdraw: 440, Tax: 15 (0.5% of 3000), Total: 455
        expect(calculateCashoutFee(3000, "Uganda")).toBe(455);

        // Amount: 10000 UGX -> Withdraw: 700, Tax: 50 (0.5% of 10000), Total: 750
        expect(calculateCashoutFee(10000, "Uganda")).toBe(750);

        // Amount: 50000 UGX -> Withdraw: 1500, Tax: 250 (0.5% of 50000), Total: 1750
        expect(calculateCashoutFee(50000, "Uganda")).toBe(1750);

        // Amount: 100000 UGX -> Withdraw: 1925, Tax: 500 (0.5% of 100000), Total: 2425
        expect(calculateCashoutFee(100000, "Uganda")).toBe(2425);
      });
    });

    it("should return 0 for unsupported countries", () => {
      expect(calculateCashoutFee(1000, "Kenya")).toBe(0);
      expect(calculateCashoutFee(1000, "Nigeria")).toBe(0);
      expect(calculateCashoutFee(1000)).toBe(0);
    });

    it("should return 0 for amounts that do not match any range", () => {
      expect(calculateCashoutFee(-100, "Tanzania")).toBe(0);
      expect(calculateCashoutFee(-100, "Uganda")).toBe(0);
    });

    it("should handle edge cases correctly", () => {
      expect(calculateCashoutFee(0, "Tanzania")).toBe(185);
      expect(calculateCashoutFee(3000001, "Tanzania")).toBe(12000);
      expect(calculateCashoutFee(10000000, "Tanzania")).toBe(12000);

      // Uganda edge cases
      expect(calculateCashoutFee(0, "Uganda")).toBe(330); // 330 + 0 tax
      expect(calculateCashoutFee(5000000, "Uganda")).toBe(43000); // 18000 + 25000 tax
    });
  });

  describe("getUgandaCashoutBreakdown", () => {
    it("should return correct breakdown for Uganda fees", () => {
      const breakdown = getUgandaCashoutBreakdown(10000);
      expect(breakdown.withdrawFee).toBe(700);
      expect(breakdown.taxAmount).toBe(50); // 0.5% of 10000
      expect(breakdown.total).toBe(750);
    });

    it("should handle different amount ranges", () => {
      const breakdown1 = getUgandaCashoutBreakdown(1000);
      expect(breakdown1.withdrawFee).toBe(330);
      expect(breakdown1.taxAmount).toBe(5);
      expect(breakdown1.total).toBe(335);

      const breakdown2 = getUgandaCashoutBreakdown(100000);
      expect(breakdown2.withdrawFee).toBe(1925);
      expect(breakdown2.taxAmount).toBe(500);
      expect(breakdown2.total).toBe(2425);
    });
  });

  describe("supportsCashoutFees", () => {
    it("should return true for Tanzania and Uganda", () => {
      expect(supportsCashoutFees("Tanzania")).toBe(true);
      expect(supportsCashoutFees("tanzania")).toBe(true);
      expect(supportsCashoutFees("TANZANIA")).toBe(true);

      expect(supportsCashoutFees("Uganda")).toBe(true);
      expect(supportsCashoutFees("uganda")).toBe(true);
      expect(supportsCashoutFees("UGANDA")).toBe(true);
    });

    it("should return false for other countries", () => {
      expect(supportsCashoutFees("Kenya")).toBe(false);
      expect(supportsCashoutFees("Nigeria")).toBe(false);
      expect(supportsCashoutFees("")).toBe(false);
    });
  });
});
