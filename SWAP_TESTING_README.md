# USDC ↔ CNGN On-Chain Swap Testing

This repository contains comprehensive tests for USDC ↔ CNGN token swaps on the Base network using Aerodrome V3 DEX. The tests perform real on-chain transactions to validate swap functionality with dynamic exchange rates.

## 🎯 Overview

The test suite validates the core swap panel functionality for a OneRamp application, ensuring that users can successfully swap between USDC and CNGN tokens with proper rate calculations and transaction execution.

## 🏗️ Technical Architecture

### Network Configuration
- **Blockchain**: Base Mainnet
- **RPC Endpoint**: `https://mainnet.base.org`
- **Chain ID**: 8453

### Smart Contract Addresses

| Contract | Address | Description |
|----------|---------|-------------|
| **USDC Token** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | USD Coin (6 decimals) |
| **CNGN Token** | `0x46C85152bFe9f96829aA94755D9f915F9B10EF5F` | Central Bank of Nigeria Digital Currency (6 decimals) |
| **Aerodrome V3 SwapRouter** | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` | Decentralized exchange router for swaps |

### Key Dependencies
- **Viem v2.37.6**: Ethereum interaction library for contract calls and transaction signing
- **Jest**: Testing framework with custom timeouts for blockchain operations
- **Base Network**: Layer 2 network for efficient and low-cost transactions

## 🧪 Test Structure

### 1. Pre-swap Validation Tests
**Purpose**: Ensure the testing environment is properly configured before executing swaps.

- **Balance Validation**: Confirms sufficient USDC, CNGN, and ETH balances for testing
  - Minimum 0.01 USDC for USDC → CNGN swaps
  - Minimum 10 CNGN for CNGN → USDC swaps  
  - Minimum 0.001 ETH for gas fees

- **Exchange Rate Fetching**: Validates that the dynamic rate fetcher returns valid rates
  - Tests `utils/v3-rate-fetcher.ts` functionality
  - Ensures both USDC → CNGN and CNGN → USDC rates are available

### 2. Real On-Chain Swap Tests
**Purpose**: Execute actual blockchain transactions to test swap functionality.

#### USDC → CNGN Swap Test
1. **Initial Balance Check**: Records starting USDC and CNGN balances
2. **Rate Calculation**: Fetches current exchange rate from Aerodrome V3
3. **Amount Calculation**: Determines expected CNGN output with 2% slippage tolerance
4. **Token Approval**: Approves SwapRouter to spend USDC tokens
5. **Swap Execution**: Calls `exactInputSingle` on Aerodrome V3 SwapRouter
6. **Transaction Validation**: Confirms successful execution and proper gas usage

#### CNGN → USDC Swap Test
1. **Initial Balance Check**: Records starting CNGN and USDC balances
2. **Rate Calculation**: Fetches current exchange rate from Aerodrome V3
3. **Amount Calculation**: Determines expected USDC output with 2% slippage tolerance
4. **Token Approval**: Approves SwapRouter to spend CNGN tokens
5. **Swap Execution**: Calls `exactInputSingle` on Aerodrome V3 SwapRouter
6. **Transaction Validation**: Confirms successful execution and proper gas usage

### 3. Rate Calculation Validation Tests
**Purpose**: Ensure mathematical consistency and accuracy of exchange rate calculations.

#### Mathematical Consistency Test
- Validates that `USDC → CNGN rate ≈ 1 / (CNGN → USDC rate)`
- Allows up to 5% variance for liquidity and slippage considerations
- Ensures rates are logically inverse of each other

#### Multi-Amount Validation Test
- Tests rate accuracy across different swap amounts (0.01, 0.1, 1.0 USDC)
- Validates round-trip calculations (USDC → CNGN → USDC)
- Ensures minimal round-trip error (< 1%) for rate consistency

## 🔧 Implementation Details

### Gas Management
- **Dynamic Gas Pricing**: Fetches current network gas price
- **30% Buffer**: Applies buffer to handle network congestion
- **Explicit Gas Limits**: Sets 350,000 gas limit for swap transactions

### Nonce Management
- **Fresh Nonce Fetching**: Gets current transaction count before each transaction
- **Sequential Execution**: Ensures proper transaction ordering (approve → swap)

### Error Handling
- **Transaction Timeouts**: 120-second timeout for transaction confirmation
- **Status Validation**: Checks transaction receipt status for success
- **Balance Validation**: Confirms sufficient balances before attempting swaps

### Slippage Protection
- **2% Slippage Tolerance**: Conservative slippage for reliable execution
- **Minimum Amount Out**: Calculates and enforces minimum received amounts

## 🚀 Running the Tests

### Prerequisites
1. **Environment Variables**: Set `PRIVATE_KEY` with a wallet containing USDC, CNGN, and ETH
2. **Node Dependencies**: Install required packages with `npm install`

### Execution Commands
```bash
# Run all on-chain swap tests
npm test onchain-swaps

# Run with verbose output
npm test onchain-swaps -- --verbose

# Run specific test patterns
npm test onchain-swaps -- --testNamePattern="USDC.*CNGN"
```

### Test Timeouts
- **Balance/Rate Tests**: 30 seconds
- **Swap Transactions**: 180 seconds (3 minutes)
- **Individual Operations**: 120 seconds

## 📊 Expected Test Results

### Successful Test Output
```
✅ Test environment initialized
🔐 Account address: 0x[...address...]
💰 USDC Balance: [amount] USDC
💰 CNGN Balance: [amount] CNGN
⛽ ETH Balance: [amount] ETH
📊 USDC → CNGN Rate: [rate]
📊 CNGN → USDC Rate: [rate]
🚀 Starting USDC → CNGN swap...
📈 Expected CNGN output: [amount]
✅ USDC approved
🔄 Executing USDC → CNGN swap...
✅ USDC → CNGN swap completed!
🔗 Transaction: https://basescan.org/tx/0x[hash]
🎉 USDC → CNGN swap test passed!
```

### Transaction Verification
All successful swaps generate BaseScan transaction links for verification:
- View transaction details at `https://basescan.org/tx/[transaction_hash]`
- Confirm token transfers and gas usage
- Validate smart contract interactions

## 🔍 Rate Fetcher Details

### Dynamic Rate Source
The `utils/v3-rate-fetcher.ts` file implements a sophisticated rate fetching mechanism:

1. **Primary Method**: Quoter contract calls to Aerodrome V3
2. **Fallback Method**: Recent transaction analysis from DEX pools
3. **Rate Caching**: Optimizes performance with intelligent caching
4. **Error Handling**: Gracefully handles quoter failures and network issues

### Rate Object Structure
```javascript
{
  usdcTocNGN: 1505.3566,    // How many CNGN per 1 USDC
  cNGNToUSDC: 0.00066429,   // How many USDC per 1 CNGN
  source: "Recent Transaction Data" // Rate source identifier
}
```

## 🛡️ Security Considerations

### Private Key Management
- **Environment Variables**: Private keys stored securely in environment
- **Test Network**: Consider using testnet for initial testing
- **Limited Exposure**: Tests use small amounts to minimize risk

### Transaction Safety
- **Slippage Protection**: 2% maximum slippage prevents excessive losses
- **Deadline Protection**: 10-minute transaction deadlines prevent stale executions
- **Balance Validation**: Pre-flight checks ensure sufficient funds

## 📈 Performance Metrics

### Test Execution Times
- **Environment Setup**: ~1 second
- **Balance Checks**: ~5 seconds total
- **Rate Fetching**: ~2-5 seconds
- **Swap Execution**: ~30-60 seconds per swap
- **Total Test Suite**: ~3-5 minutes

### Gas Usage (Typical)
- **Token Approval**: ~46,000 gas
- **USDC → CNGN Swap**: ~200,000-300,000 gas
- **CNGN → USDC Swap**: ~200,000-300,000 gas

## 🎯 Success Criteria

### Test Passing Requirements
1. **Environment Validation**: All balances sufficient, rates available
2. **Transaction Success**: Both swap directions execute without errors
3. **Rate Consistency**: Mathematical rate relationships validated
4. **Gas Efficiency**: Transactions complete within reasonable gas limits

### Quality Metrics
- **100% Test Pass Rate**: All tests must pass consistently
- **Transaction Reliability**: < 1% failure rate under normal conditions
- **Rate Accuracy**: < 1% round-trip calculation error
- **Performance**: < 5 minute total execution time

## 🔗 Resources

### Block Explorers
- **BaseScan**: https://basescan.org - Transaction verification and contract interaction history
- **Base Network Info**: https://base.org - Network status and documentation

### Smart Contract Documentation
- **Aerodrome V3 Docs**: DEX-specific documentation for swap parameters
- **Base Network Docs**: Layer 2 specific features and optimizations
- **Viem Documentation**: Client library usage and best practices

### Token Information
- **USDC on Base**: Bridged USD Coin with 6 decimal precision
- **CNGN Details**: Central Bank of Nigeria digital currency implementation
- **Liquidity Sources**: Aerodrome V3 concentrated liquidity pools

This comprehensive test suite ensures that the USDC ↔ CNGN swap functionality works reliably in production environments with real user funds and network conditions.