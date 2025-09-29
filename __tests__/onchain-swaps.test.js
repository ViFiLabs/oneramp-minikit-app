const { describe, test, expect, beforeAll } = require('@jest/globals');
const { createPublicClient, createWalletClient, http, parseUnits, formatUnits } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

// Import rate fetcher and quote functions
const { getLiveExchangeRate, getV3Quote } = require('../utils/v3-rate-fetcher');

describe('USDC ↔ CNGN On-Chain Swap Tests', () => {
  
  // Test configuration
  const BASE_RPC = 'https://mainnet.base.org';
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  
  // Contract addresses on Base Mainnet
  const CNGN_ADDRESS = '0x46C85152bFe9f96829aA94755D9f915F9B10EF5F'; // CNGN token (6 decimals)
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC token (6 decimals)
  const AERODROME_V3_SWAP_ROUTER = '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5'; // Aerodrome V3 SwapRouter

  let publicClient, walletClient, account;

  beforeAll(() => {
    // Validate environment
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Initialize clients
    publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC),
    });

    account = privateKeyToAccount(PRIVATE_KEY);
    walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(BASE_RPC),
    });

    console.log('✅ Test environment initialized');
    console.log('🔐 Account address:', account.address);
  });

  // ERC20 ABI for token operations
  const erc20Abi = [
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function',
    },
  ];

  // Aerodrome V3 SwapRouter ABI
  const SWAP_ROUTER_ABI = [
    {
      inputs: [
        {
          components: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'tickSpacing', type: 'int24' },
            { name: 'recipient', type: 'address' },
            { name: 'deadline', type: 'uint256' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' },
          ],
          name: 'params',
          type: 'tuple',
        },
      ],
      name: 'exactInputSingle',
      outputs: [{ name: 'amountOut', type: 'uint256' }],
      type: 'function',
    },
  ];

  describe('Pre-swap Validation', () => {
    test('validates account balances are sufficient', async () => {
      const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const cngnBalance = await publicClient.readContract({
        address: CNGN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const ethBalance = await publicClient.getBalance({
        address: account.address,
      });

      console.log('💰 USDC Balance:', formatUnits(usdcBalance, 6), 'USDC');
      console.log('💰 CNGN Balance:', formatUnits(cngnBalance, 6), 'CNGN');
      console.log('⛽ ETH Balance:', formatUnits(ethBalance, 18), 'ETH');

      // Validate sufficient balances
      expect(usdcBalance).toBeGreaterThan(parseUnits('0.01', 6)); // At least 0.01 USDC
      expect(cngnBalance).toBeGreaterThan(parseUnits('10', 6)); // At least 10 CNGN
      expect(ethBalance).toBeGreaterThan(parseUnits('0.001', 18)); // At least 0.001 ETH for gas

      console.log('✅ All balances are sufficient for testing');
    }, 30000);

    test('validates dynamic exchange rate fetching', async () => {
      const rateData = await getLiveExchangeRate();
      
      expect(rateData).toBeDefined();
      expect(rateData.usdcTocNGN).toBeGreaterThan(0);
      expect(rateData.cNGNToUSDC).toBeGreaterThan(0);

      console.log('📊 USDC → CNGN Rate:', rateData.usdcTocNGN.toFixed(4));
      console.log('📊 CNGN → USDC Rate:', rateData.cNGNToUSDC.toFixed(8));
      console.log('✅ Exchange rates fetched successfully');
    }, 30000);
  });

  describe('Real On-Chain Swaps', () => {
    test('executes USDC → CNGN swap successfully', async () => {
      console.log('🚀 Starting USDC → CNGN swap...');

      // Get initial balances
      const initialUsdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const initialCngnBalance = await publicClient.readContract({
        address: CNGN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      console.log('💰 Initial USDC:', formatUnits(initialUsdcBalance, 6));
      console.log('💰 Initial CNGN:', formatUnits(initialCngnBalance, 6));

      // Get precise quote from MixedQuoter
      const swapAmountUSDC = 0.01; // 0.01 USDC
      const quoteResult = await getV3Quote(swapAmountUSDC.toString(), 'USDC', 'CNGN');
      
      console.log('📊 MixedQuoter Quote:', quoteResult);
      console.log('📊 Exchange Rate:', quoteResult.rate, 'CNGN per USDC');

      // Prepare swap parameters using precise quote
      const swapAmountWei = parseUnits(swapAmountUSDC.toString(), 6);
      const expectedCngnOutput = parseFloat(quoteResult.amountOut);
      const minAmountOut = parseUnits((expectedCngnOutput * 0.98).toFixed(6), 6); // 2% slippage

      console.log('📈 Expected CNGN output:', expectedCngnOutput.toFixed(6));
      console.log('🛡️ Min amount out (2% slippage):', formatUnits(minAmountOut, 6));

      // Step 1: Approve USDC spend
      console.log('📝 Approving USDC spend...');
      
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AERODROME_V3_SWAP_ROUTER, swapAmountWei],
      });

      await publicClient.waitForTransactionReceipt({ 
        hash: approveTx,
        timeout: 120000 // 2 minutes
      });
      console.log('✅ USDC approved');

      // Add small delay to ensure nonce synchronization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Execute swap
      console.log('🔄 Executing USDC → CNGN swap...');

      const gasPrice = await publicClient.getGasPrice();
      const bufferedGasPrice = (gasPrice * 130n) / 100n; // 30% buffer

      const swapParams = {
        tokenIn: USDC_ADDRESS,
        tokenOut: CNGN_ADDRESS,
        tickSpacing: 10,
        recipient: account.address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        amountIn: swapAmountWei,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: BigInt(0),
      };

      const swapTx = await walletClient.writeContract({
        address: AERODROME_V3_SWAP_ROUTER,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [swapParams],
        gasPrice: bufferedGasPrice,
        gas: BigInt(350000),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: swapTx,
        timeout: 120000
      });

      console.log('✅ USDC → CNGN swap completed!');
      console.log('🔗 Transaction:', `https://basescan.org/tx/${swapTx}`);

      // Validate success
      expect(receipt.status).toBe('success');
      console.log('🎉 USDC → CNGN swap test passed!');

    }, 180000);

    test('executes CNGN → USDC swap successfully', async () => {
      console.log('🚀 Starting CNGN → USDC swap...');

      // Get initial balances
      const initialCngnBalance = await publicClient.readContract({
        address: CNGN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const initialUsdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account.address],
      });

      console.log('💰 Initial CNGN:', formatUnits(initialCngnBalance, 6));
      console.log('💰 Initial USDC:', formatUnits(initialUsdcBalance, 6));

      // Get precise quote from MixedQuoter
      const swapAmountCNGN = 10; // 10 CNGN
      const quoteResult = await getV3Quote(swapAmountCNGN.toString(), 'CNGN', 'USDC');
      
      console.log('📊 MixedQuoter Quote:', quoteResult);
      console.log('📊 Exchange Rate:', quoteResult.rate, 'USDC per CNGN');

      // Prepare swap parameters using precise quote
      const swapAmountWei = parseUnits(swapAmountCNGN.toString(), 6);
      const expectedUsdcOutput = parseFloat(quoteResult.amountOut);
      const minAmountOut = parseUnits((expectedUsdcOutput * 0.98).toFixed(6), 6); // 2% slippage

      console.log('📈 Expected USDC output:', expectedUsdcOutput.toFixed(6));
      console.log('🛡️ Min amount out (2% slippage):', formatUnits(minAmountOut, 6));

      // Step 1: Approve CNGN spend
      console.log('📝 Approving CNGN spend...');
      
      const approveTx = await walletClient.writeContract({
        address: CNGN_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [AERODROME_V3_SWAP_ROUTER, swapAmountWei],
      });

      await publicClient.waitForTransactionReceipt({ 
        hash: approveTx,
        timeout: 120000 // 2 minutes
      });
      console.log('✅ CNGN approved');

      // Add small delay to ensure nonce synchronization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Execute swap
      console.log('🔄 Executing CNGN → USDC swap...');

      const gasPrice = await publicClient.getGasPrice();
      const bufferedGasPrice = (gasPrice * 130n) / 100n; // 30% buffer

      const swapParams = {
        tokenIn: CNGN_ADDRESS,
        tokenOut: USDC_ADDRESS,
        tickSpacing: 10,
        recipient: account.address,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 600),
        amountIn: swapAmountWei,
        amountOutMinimum: minAmountOut,
        sqrtPriceLimitX96: BigInt(0),
      };

      const swapTx = await walletClient.writeContract({
        address: AERODROME_V3_SWAP_ROUTER,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [swapParams],
        gasPrice: bufferedGasPrice,
        gas: BigInt(350000),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: swapTx,
        timeout: 120000
      });

      console.log('✅ CNGN → USDC swap completed!');
      console.log('🔗 Transaction:', `https://basescan.org/tx/${swapTx}`);

      // Validate success
      expect(receipt.status).toBe('success');
      console.log('🎉 CNGN → USDC swap test passed!');

    }, 180000);
  });

  describe('Rate Calculation Validation', () => {
    test('validates rate calculations are mathematically consistent', async () => {
      console.log('🧮 Testing rate calculation consistency...');

      const rateData = await getLiveExchangeRate();
      const usdcToCngn = rateData.usdcTocNGN;
      const cngnToUsdc = rateData.cNGNToUSDC;

      console.log('📊 USDC → CNGN Rate:', usdcToCngn);
      console.log('📊 CNGN → USDC Rate:', cngnToUsdc);

      // Test mathematical consistency: USDC→CNGN rate should be ~1/CNGN→USDC rate
      const calculatedInverse = 1 / cngnToUsdc;
      const rateDifference = Math.abs(usdcToCngn - calculatedInverse) / usdcToCngn;

      console.log('🔍 Calculated inverse rate:', calculatedInverse.toFixed(4));
      console.log('🔍 Rate difference:', (rateDifference * 100).toFixed(2) + '%');

      // Allow for some variance due to liquidity/slippage (up to 5%)
      expect(rateDifference).toBeLessThan(0.05);

      console.log('✅ Rate calculations are mathematically consistent');
    }, 30000);

    test('validates rate calculations for different swap amounts', async () => {
      console.log('🧮 Testing rate calculations for various amounts...');

      const rateData = await getLiveExchangeRate();
      
      const testAmounts = [0.01, 0.1, 1.0]; // USDC amounts to test
      
      for (const usdcAmount of testAmounts) {
        const expectedCngn = usdcAmount * rateData.usdcTocNGN;
        const backToUsdc = expectedCngn * rateData.cNGNToUSDC;
        const roundTripError = Math.abs(usdcAmount - backToUsdc) / usdcAmount;
        
        console.log(`💱 ${usdcAmount} USDC → ${expectedCngn.toFixed(4)} CNGN → ${backToUsdc.toFixed(6)} USDC`);
        console.log(`🔍 Round-trip error: ${(roundTripError * 100).toFixed(3)}%`);
        
        // Expect minimal round-trip error (less than 1%)
        expect(roundTripError).toBeLessThan(0.01);
      }

      console.log('✅ Rate calculations are accurate for different amounts');
    }, 30000);
  });
});