/**
 * V3 Rate Fetcher Tests
 * 
 * Tests the v3-rate-fetcher utility functions that integrate with MixedQuoter
 * to provide exchange rates for the SwapPanel component.
 */

const { describe, test, expect, beforeAll } = require('@jest/globals');

// Import the functions we want to test
const { getLiveExchangeRate, getV3Quote } = require('../utils/v3-rate-fetcher');

describe('V3 Rate Fetcher Integration', () => {
  
  beforeAll(() => {
    console.log('🔧 Setting up V3 Rate Fetcher tests...');
  });

  describe('getLiveExchangeRate Function', () => {
    test('should fetch live exchange rate successfully', async () => {
      console.log('📡 Testing getLiveExchangeRate()...');
      
      const rate = await getLiveExchangeRate();
      
      expect(rate).toBeDefined();
      expect(rate).toHaveProperty('usdcTocNGN');
      expect(rate).toHaveProperty('cNGNToUSDC');
      expect(rate).toHaveProperty('source');
      expect(rate).toHaveProperty('timestamp');
      expect(rate).toHaveProperty('success');
      
      // Rate validations
      expect(rate.usdcTocNGN).toBeGreaterThan(0);
      expect(rate.cNGNToUSDC).toBeGreaterThan(0);
      expect(typeof rate.source).toBe('string');
      expect(typeof rate.timestamp).toBe('string');
      expect(typeof rate.success).toBe('boolean');
      
      console.log(`✅ USDC → CNGN Rate: ${rate.usdcTocNGN.toFixed(4)}`);
      console.log(`✅ CNGN → USDC Rate: ${rate.cNGNToUSDC.toFixed(8)}`);
      console.log(`✅ Source: ${rate.source}`);
      console.log(`✅ Success: ${rate.success}`);
      
      // Sanity checks for reasonable rates
      expect(rate.usdcTocNGN).toBeGreaterThan(1000);
      expect(rate.usdcTocNGN).toBeLessThan(2000);
      expect(rate.cNGNToUSDC).toBeGreaterThan(0.0003);
      expect(rate.cNGNToUSDC).toBeLessThan(0.002);
    }, 30000);

    test('should provide consistent inverse rates', async () => {
      console.log('🧮 Testing rate consistency...');
      
      const rate = await getLiveExchangeRate();
      
      const calculatedInverse = 1 / rate.usdcTocNGN;
      const actualInverse = rate.cNGNToUSDC;
      const difference = Math.abs(calculatedInverse - actualInverse);
      const percentageDiff = (difference / calculatedInverse) * 100;
      
      console.log(`📊 USDC→CNGN: ${rate.usdcTocNGN.toFixed(4)}`);
      console.log(`📊 CNGN→USDC: ${rate.cNGNToUSDC.toFixed(8)}`);
      console.log(`🔍 Calculated inverse: ${calculatedInverse.toFixed(8)}`);
      console.log(`🔍 Percentage difference: ${percentageDiff.toFixed(4)}%`);
      
      // Rates should be mathematically consistent within reasonable bounds
      expect(percentageDiff).toBeLessThan(5); // Allow up to 5% difference
    }, 30000);
  });

  describe('getV3Quote Function', () => {
    test('should get quote for USDC → CNGN', async () => {
      console.log('💰 Testing getV3Quote for USDC → CNGN...');
      
      const quote = await getV3Quote('1', 'USDC', 'CNGN');
      
      expect(quote).toBeDefined();
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('rate');
      expect(quote).toHaveProperty('source');
      expect(quote).toHaveProperty('timestamp');
      expect(quote).toHaveProperty('success');
      
      const outputAmount = parseFloat(quote.amountOut);
      const rate = parseFloat(quote.rate);
      
      console.log(`✅ 1 USDC = ${quote.amountOut} CNGN`);
      console.log(`✅ Rate: ${quote.rate} CNGN per USDC`);
      console.log(`✅ Source: ${quote.source}`);
      
      expect(outputAmount).toBeGreaterThan(1000);
      expect(outputAmount).toBeLessThan(2000);
      expect(rate).toBeGreaterThan(1000);
      expect(rate).toBeLessThan(2000);
      expect(quote.success).toBe(true);
    }, 30000);

    test('should get quote for CNGN → USDC', async () => {
      console.log('💰 Testing getV3Quote for CNGN → USDC...');
      
      const quote = await getV3Quote('1500', 'CNGN', 'USDC');
      
      expect(quote).toBeDefined();
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('rate');
      expect(quote).toHaveProperty('source');
      
      const outputAmount = parseFloat(quote.amountOut);
      const rate = parseFloat(quote.rate);
      
      console.log(`✅ 1500 CNGN = ${quote.amountOut} USDC`);
      console.log(`✅ Rate: ${quote.rate} USDC per CNGN`);
      console.log(`✅ Source: ${quote.source}`);
      
      expect(outputAmount).toBeGreaterThan(0.5);
      expect(outputAmount).toBeLessThan(2);
      expect(rate).toBeGreaterThan(0.0003);
      expect(rate).toBeLessThan(0.002);
      expect(quote.success).toBe(true);
    }, 30000);

    test('should handle different amounts correctly', async () => {
      console.log('🔢 Testing different amounts...');
      
      const amounts = ['0.1', '1', '5', '10'];
      const quotes = [];
      
      for (const amount of amounts) {
        console.log(`   Testing ${amount} USDC → CNGN...`);
        const quote = await getV3Quote(amount, 'USDC', 'CNGN');
        quotes.push({ amount, quote });
        
        expect(quote).toBeDefined();
        expect(quote.success).toBe(true);
        
        const outputAmount = parseFloat(quote.amountOut);
        const inputAmount = parseFloat(amount);
        const impliedRate = outputAmount / inputAmount;
        
        console.log(`     ${amount} USDC = ${quote.amountOut} CNGN (rate: ${impliedRate.toFixed(4)})`);
        
        // Basic sanity checks
        expect(outputAmount).toBeGreaterThan(0);
        expect(impliedRate).toBeGreaterThan(1000);
        expect(impliedRate).toBeLessThan(2000);
      }
      
      // Check that rates are reasonably consistent across amounts
      const rates = quotes.map(q => parseFloat(q.quote.amountOut) / parseFloat(q.amount));
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const maxDeviation = Math.max(...rates.map(rate => Math.abs(rate - avgRate) / avgRate));
      
      console.log(`📊 Average rate: ${avgRate.toFixed(4)}`);
      console.log(`📊 Max deviation: ${(maxDeviation * 100).toFixed(2)}%`);
      
      // Rates should be consistent within 5% (allowing for price impact)
      expect(maxDeviation).toBeLessThan(0.05);
    }, 60000);

    test('should reject invalid inputs', async () => {
      console.log('⚠️  Testing error handling...');
      
      // Test invalid amount
      await expect(getV3Quote('0', 'USDC', 'CNGN')).rejects.toThrow();
      await expect(getV3Quote('', 'USDC', 'CNGN')).rejects.toThrow();
      await expect(getV3Quote('invalid', 'USDC', 'CNGN')).rejects.toThrow();
      
      // Test unsupported pair
      await expect(getV3Quote('1', 'USDC', 'INVALID')).rejects.toThrow();
      await expect(getV3Quote('1', 'INVALID', 'CNGN')).rejects.toThrow();
      
      console.log('✅ Error handling works correctly');
    }, 30000);
  });

  describe('Integration with SwapPanel', () => {
    test('should provide quotes in format expected by SwapPanel', async () => {
      console.log('🔌 Testing SwapPanel integration format...');
      
      const quote = await getV3Quote('1', 'USDC', 'CNGN');
      
      // SwapPanel expects these properties
      expect(quote).toHaveProperty('amountOut');
      expect(quote).toHaveProperty('rate');
      expect(quote).toHaveProperty('source');
      expect(quote).toHaveProperty('timestamp');
      expect(quote).toHaveProperty('success');
      
      // Check that values are properly formatted strings
      expect(typeof quote.amountOut).toBe('string');
      expect(typeof quote.rate).toBe('string');
      expect(typeof quote.source).toBe('string');
      expect(typeof quote.timestamp).toBe('string');
      expect(typeof quote.success).toBe('boolean');
      
      // Check that numeric strings are valid
      expect(parseFloat(quote.amountOut)).not.toBeNaN();
      expect(parseFloat(quote.rate)).not.toBeNaN();
      
      console.log('✅ Quote format compatible with SwapPanel');
      console.log(`   Amount Out: ${quote.amountOut} (${typeof quote.amountOut})`);
      console.log(`   Rate: ${quote.rate} (${typeof quote.rate})`);
      console.log(`   Source: ${quote.source}`);
    }, 30000);

    test('should handle rate calculations as expected by UI', async () => {
      console.log('🎨 Testing UI rate calculation compatibility...');
      
      const amount = '1';
      const quote = await getV3Quote(amount, 'USDC', 'CNGN');
      
      // Simulate SwapPanel rate calculation
      const calculatedRate = parseFloat(quote.amountOut) / parseFloat(amount);
      const displayRate = calculatedRate.toFixed(0); // SwapPanel uses toFixed(0)
      
      console.log(`📊 Quote rate: ${quote.rate}`);
      console.log(`📊 Calculated rate: ${calculatedRate.toFixed(4)}`);
      console.log(`📊 Display rate: ${displayRate}`);
      
      // Rates should be consistent
      const rateDifference = Math.abs(parseFloat(quote.rate) - calculatedRate);
      const percentageDiff = (rateDifference / calculatedRate) * 100;
      
      expect(percentageDiff).toBeLessThan(1); // Should be nearly identical
      
      console.log('✅ Rate calculations are UI-compatible');
    }, 30000);
  });
});