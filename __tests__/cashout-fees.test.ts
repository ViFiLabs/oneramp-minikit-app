import { describe, it, expect } from '@jest/globals';
import { calculateCashoutFee, supportsCashoutFees } from '../utils/cashout-fees';

describe('Cashout Fees', () => {
  describe('calculateCashoutFee', () => {
    it('should calculate correct fees for different amount ranges', () => {
      // Test various ranges
      expect(calculateCashoutFee(500)).toBe(185);
      expect(calculateCashoutFee(999)).toBe(185);
      expect(calculateCashoutFee(1000)).toBe(360);
      expect(calculateCashoutFee(1500)).toBe(360);
      expect(calculateCashoutFee(1999)).toBe(360);
      expect(calculateCashoutFee(2000)).toBe(410);
      expect(calculateCashoutFee(5000)).toBe(1004);
      expect(calculateCashoutFee(10000)).toBe(1552);
      expect(calculateCashoutFee(50000)).toBe(3273);
      expect(calculateCashoutFee(100000)).toBe(4357);
      expect(calculateCashoutFee(500000)).toBe(8745);
      expect(calculateCashoutFee(1000000)).toBe(9776);
      expect(calculateCashoutFee(2000000)).toBe(9875);
      expect(calculateCashoutFee(4000000)).toBe(12000);
    });

    it('should return 0 for amounts that do not match any range', () => {
      expect(calculateCashoutFee(-100)).toBe(0);
    });

    it('should handle edge cases correctly', () => {
      expect(calculateCashoutFee(0)).toBe(185);
      expect(calculateCashoutFee(3000001)).toBe(12000);
      expect(calculateCashoutFee(10000000)).toBe(12000);
    });
  });

  describe('supportsCashoutFees', () => {
    it('should return true for Tanzania', () => {
      expect(supportsCashoutFees('Tanzania')).toBe(true);
      expect(supportsCashoutFees('tanzania')).toBe(true);
      expect(supportsCashoutFees('TANZANIA')).toBe(true);
    });

    it('should return false for other countries', () => {
      expect(supportsCashoutFees('Kenya')).toBe(false);
      expect(supportsCashoutFees('Uganda')).toBe(false);
      expect(supportsCashoutFees('Nigeria')).toBe(false);
      expect(supportsCashoutFees('')).toBe(false);
    });
  });
});
