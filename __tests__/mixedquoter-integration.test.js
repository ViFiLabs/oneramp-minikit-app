/**
 * MixedQuoter Integration Tests
 * 
 * Tests the on-chain quote functionality using the MixedQuoter contract
 * for USDC ↔ CNGN exchange rates on Base network.
 */

const { describe, test, expect, beforeAll } = require('@jest/globals');
const { createPublicClient, http, parseUnits, formatUnits } = require('viem');
const { base } = require('viem/chains');

describe('MixedQuoter On-Chain Quotes', () => {
  
  // Test configuration
  const BASE_RPC = 'https://mainnet.base.org';
  
  // Contract addresses on Base Mainnet
  const MIXED_QUOTER_ADDRESS = '0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6';
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const CNGN_ADDRESS = '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F';
  
  // MixedQuoter ABI
  const MIXED_QUOTER_ABI = [
    {
      "inputs": [
        {
          "components": [
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "address", "name": "tokenOut", "type": "address" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "int24", "name": "tickSpacing", "type": "int24" },
            { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
          ],
          "internalType": "struct IMixedRouteQuoterV1.QuoteExactInputSingleV3Params",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "quoteExactInputSingleV3",
      "outputs": [
        { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
        { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
        { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
        { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
  
  let publicClient;
  
  beforeAll(async () => {
    console.log('🔧 Setting up MixedQuoter tests...');
    
    // Initialize viem client
    publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC),
    });
    
    // Test connectivity
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Connected to Base network, block: ${blockNumber.toString()}`);
  });

  describe('Contract Connectivity', () => {
    test('should connect to Base network successfully', async () => {
      const blockNumber = await publicClient.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0n);
      console.log(`📡 Current block number: ${blockNumber.toString()}`);
    }, 10000);

    test('should have valid contract addresses', () => {
      expect(MIXED_QUOTER_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(USDC_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(CNGN_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      console.log('📋 Contract addresses validated:');
      console.log(`   MixedQuoter: ${MIXED_QUOTER_ADDRESS}`);
      console.log(`   USDC: ${USDC_ADDRESS}`);
      console.log(`   CNGN: ${CNGN_ADDRESS}`);
    });
  });

  describe('USDC → CNGN Quotes', () => {
    test('should get quote for 1 USDC → CNGN', async () => {
      const amountIn = '1';
      const amountInWei = parseUnits(amountIn, 6);
      
      console.log(`💰 Testing ${amountIn} USDC → CNGN`);
      
      const quoteParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = result;
      
      expect(amountOut).toBeGreaterThan(0n);
      expect(gasEstimate).toBeGreaterThan(0n);
      
      const outputAmount = formatUnits(amountOut, 6);
      const rate = parseFloat(outputAmount);
      
      console.log(`   ✅ Output: ${outputAmount} CNGN`);
      console.log(`   📈 Rate: 1 USDC = ${rate.toFixed(4)} CNGN`);
      console.log(`   ⛽ Gas estimate: ${gasEstimate.toString()}`);
      
      // Sanity checks for USDC/CNGN rate (should be roughly 1400-1600 based on market)
      expect(rate).toBeGreaterThan(1000);
      expect(rate).toBeLessThan(2000);
    }, 15000);

    test('should get quote for 10 USDC → CNGN', async () => {
      const amountIn = '10';
      const amountInWei = parseUnits(amountIn, 6);
      
      console.log(`💰 Testing ${amountIn} USDC → CNGN`);
      
      const quoteParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const [amountOut] = result;
      expect(amountOut).toBeGreaterThan(0n);
      
      const outputAmount = formatUnits(amountOut, 6);
      const rate = parseFloat(outputAmount) / parseFloat(amountIn);
      
      console.log(`   ✅ Output: ${outputAmount} CNGN`);
      console.log(`   📈 Rate: 1 USDC = ${rate.toFixed(4)} CNGN`);
      
      expect(rate).toBeGreaterThan(1000);
      expect(rate).toBeLessThan(2000);
    }, 15000);

    test('should get quote for 0.1 USDC → CNGN', async () => {
      const amountIn = '0.1';
      const amountInWei = parseUnits(amountIn, 6);
      
      console.log(`💰 Testing ${amountIn} USDC → CNGN`);
      
      const quoteParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const [amountOut] = result;
      expect(amountOut).toBeGreaterThan(0n);
      
      const outputAmount = formatUnits(amountOut, 6);
      const rate = parseFloat(outputAmount) / parseFloat(amountIn);
      
      console.log(`   ✅ Output: ${outputAmount} CNGN`);
      console.log(`   📈 Rate: 1 USDC = ${rate.toFixed(4)} CNGN`);
      
      expect(rate).toBeGreaterThan(1000);
      expect(rate).toBeLessThan(2000);
    }, 15000);
  });

  describe('CNGN → USDC Quotes', () => {
    test('should get quote for 1500 CNGN → USDC', async () => {
      const amountIn = '1500';
      const amountInWei = parseUnits(amountIn, 6);
      
      console.log(`💰 Testing ${amountIn} CNGN → USDC`);
      
      const quoteParams = {
        tokenIn: CNGN_ADDRESS,
        tokenOut: USDC_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const [amountOut] = result;
      expect(amountOut).toBeGreaterThan(0n);
      
      const outputAmount = formatUnits(amountOut, 6);
      const rate = parseFloat(outputAmount) / parseFloat(amountIn);
      
      console.log(`   ✅ Output: ${outputAmount} USDC`);
      console.log(`   📈 Rate: 1 CNGN = ${rate.toFixed(8)} USDC`);
      
      // Rate should be roughly 0.0005-0.001 USDC per CNGN
      expect(rate).toBeGreaterThan(0.0003);
      expect(rate).toBeLessThan(0.002);
    }, 15000);

    test('should get quote for 5000 CNGN → USDC', async () => {
      const amountIn = '5000';
      const amountInWei = parseUnits(amountIn, 6);
      
      console.log(`💰 Testing ${amountIn} CNGN → USDC`);
      
      const quoteParams = {
        tokenIn: CNGN_ADDRESS,
        tokenOut: USDC_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const [amountOut] = result;
      expect(amountOut).toBeGreaterThan(0n);
      
      const outputAmount = formatUnits(amountOut, 6);
      const rate = parseFloat(outputAmount) / parseFloat(amountIn);
      
      console.log(`   ✅ Output: ${outputAmount} USDC`);
      console.log(`   📈 Rate: 1 CNGN = ${rate.toFixed(8)} USDC`);
      
      expect(rate).toBeGreaterThan(0.0003);
      expect(rate).toBeLessThan(0.002);
    }, 15000);
  });

  describe('Rate Consistency Analysis', () => {
    test('should have mathematically consistent rates', async () => {
      console.log('🧮 Testing rate consistency...');
      
      // Get USDC → CNGN rate
      const usdcAmount = '1';
      const usdcAmountWei = parseUnits(usdcAmount, 6);
      
      const usdcToCngnParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        amountIn: usdcAmountWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const usdcResult = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [usdcToCngnParams],
      });

      const [usdcAmountOut] = usdcResult;
      const cngnFromUsdc = formatUnits(usdcAmountOut, 6);
      const usdcToCngnRate = parseFloat(cngnFromUsdc);
      
      console.log(`📊 USDC → CNGN: 1 USDC = ${usdcToCngnRate.toFixed(4)} CNGN`);
      
      // Get CNGN → USDC rate (use the output amount from above as input)
      const cngnAmount = cngnFromUsdc;
      const cngnAmountWei = parseUnits(cngnAmount, 6);
      
      const cngnToUsdcParams = {
        tokenIn: CNGN_ADDRESS,
        tokenOut: USDC_ADDRESS,
        amountIn: cngnAmountWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const cngnResult = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [cngnToUsdcParams],
      });

      const [cngnAmountOut] = cngnResult;
      const usdcFromCngn = formatUnits(cngnAmountOut, 6);
      
      console.log(`📊 CNGN → USDC: ${cngnAmount} CNGN = ${usdcFromCngn} USDC`);
      
      // Calculate round-trip efficiency
      const roundTripEfficiency = parseFloat(usdcFromCngn) / parseFloat(usdcAmount);
      const slippage = (1 - roundTripEfficiency) * 100;
      
      console.log(`🔄 Round-trip efficiency: ${(roundTripEfficiency * 100).toFixed(4)}%`);
      console.log(`💧 Round-trip slippage: ${slippage.toFixed(4)}%`);
      
      // Round-trip should return close to original amount (allowing for slippage/fees)
      expect(roundTripEfficiency).toBeGreaterThan(0.95); // Allow up to 5% round-trip cost
      expect(roundTripEfficiency).toBeLessThan(1.05);   // Shouldn't gain value
      
      // Calculate inverse rate consistency
      const expectedInverseRate = 1 / usdcToCngnRate;
      const actualCngnToUsdcRate = parseFloat(usdcFromCngn) / parseFloat(cngnAmount);
      const rateDifference = Math.abs(expectedInverseRate - actualCngnToUsdcRate);
      const percentageDiff = (rateDifference / expectedInverseRate) * 100;
      
      console.log(`🔍 Expected CNGN/USDC rate: ${expectedInverseRate.toFixed(8)}`);
      console.log(`🔍 Actual CNGN/USDC rate: ${actualCngnToUsdcRate.toFixed(8)}`);
      console.log(`🔍 Rate difference: ${percentageDiff.toFixed(4)}%`);
      
      // Rates should be consistent within reasonable bounds (allowing for price impact)
      expect(percentageDiff).toBeLessThan(5); // Allow up to 5% difference due to price impact
      
      if (percentageDiff < 1) {
        console.log('✅ Rates are highly consistent (< 1% difference)');
      } else {
        console.log('⚠️  Rates have minor inconsistency (price impact expected for larger amounts)');
      }
    }, 30000);
  });

  describe('Performance and Gas Estimation', () => {
    test('should complete quotes within reasonable time', async () => {
      const startTime = Date.now();
      
      const amountInWei = parseUnits('1', 6);
      const quoteParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        amountIn: amountInWei,
        tickSpacing: 10,
        sqrtPriceLimitX96: BigInt(0)
      };

      const result = await publicClient.readContract({
        address: MIXED_QUOTER_ADDRESS,
        abi: MIXED_QUOTER_ABI,
        functionName: "quoteExactInputSingleV3",
        args: [quoteParams],
      });

      const queryTime = Date.now() - startTime;
      const [, , , gasEstimate] = result;
      
      console.log(`⏱️  Query completed in ${queryTime}ms`);
      console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
      
      // Performance expectations
      expect(queryTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(gasEstimate).toBeGreaterThan(0n);
      expect(gasEstimate).toBeLessThan(500000n); // Should be reasonable gas estimate
    }, 10000);
  });
});