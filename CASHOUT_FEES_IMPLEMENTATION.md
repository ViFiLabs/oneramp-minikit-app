# Tanzania & Uganda Cashout Fees Implementation

## Overview

Added an optional checkbox feature that allows users to include cashout fees when sending money to Tanzania or Uganda. The cashout fees are calculated based on predefined amount ranges and fee structures specific to each country.

### Tanzania
- Fixed cashout fees based on amount ranges

### Uganda  
- Withdraw from Agent fees based on amount ranges
- Tax amount calculated as 0.5% of transaction amount
- Total cashout fee = Withdraw fee + Tax amount

## Files Modified/Created

### 1. `/utils/cashout-fees.ts` (New File)

- Contains the cashout fee calculation logic for both Tanzania and Uganda
- Tanzania: Fixed fees based on amount ranges
- Uganda: Withdraw from Agent fees + 0.5% tax calculation
- Exports `calculateCashoutFee(amount: number, countryName?: string)` function
- Exports `getUgandaCashoutBreakdown(amount: number)` for detailed Uganda fee breakdown
- Exports `supportsCashoutFees(countryName: string)` function to check country support
- Currently supports Tanzania and Uganda

### 2. `/store/amount-store.ts` (Modified)
- Added new state variables:
  - `includeCashoutFees: boolean` - whether to include cashout fees
  - `cashoutFeeAmount: number` - calculated cashout fee amount
- Added corresponding setter functions:
  - `setIncludeCashoutFees(include: boolean)`
  - `setCashoutFeeAmount(amount: number)`

### 3. `/app/components/payment/pay-interface.tsx` (Modified)
- Added imports for Checkbox component and cashout fees utilities
- Added useEffect hooks to:
  - Calculate cashout fees when amount or checkbox state changes
  - Reset cashout fees when switching away from Tanzania
- Updated `calculatedCryptoAmount` to include cashout fees in the total when enabled
- Added checkbox component that appears only when Tanzania is selected
- Added amount breakdown section showing the fee details when checkbox is enabled

### 4. `/__tests__/cashout-fees.test.ts` (New File)
- Comprehensive test suite for the cashout fee calculation logic
- Tests various amount ranges and edge cases
- Validates country support functionality

## Cashout Fee Ranges

### Tanzania (TZS)

| Amount Range (TZS) | Cashout Fee (TZS) |
|-------------------|-------------------|
| 0 - 999 | 185 |
| 1,000 - 1,999 | 360 |
| 2,000 - 2,999 | 410 |
| 3,000 - 3,999 | 614 |
| 4,000 - 4,999 | 677 |
| 5,000 - 6,999 | 1,004 |
| 7,000 - 9,999 | 1,056 |
| 10,000 - 14,999 | 1,552 |
| 15,000 - 19,999 | 1,645 |
| 20,000 - 29,999 | 2,156 |
| 30,000 - 39,999 | 2,201 |
| 40,000 - 49,999 | 2,769 |
| 50,000 - 99,999 | 3,273 |
| 100,000 - 199,999 | 4,357 |
| 200,000 - 299,999 | 6,121 |
| 300,000 - 399,999 | 7,338 |
| 400,000 - 499,999 | 7,932 |
| 500,000 - 599,999 | 8,745 |
| 600,000 - 699,999 | 9,532 |
| 700,000 - 799,999 | 9,700 |
| 800,000 - 899,999 | 9,750 |
| 900,000 - 1,000,000 | 9,776 |
| 1,000,001 - 3,000,000 | 9,875 |
| > 3,000,000 | 12,000 |

### Uganda (UGX)

**Withdraw from Agent Fees:**

| Amount Range (UGX) | Withdraw Fee (UGX) |
|-------------------|-------------------|
| 0 - 2,500 | 330 |
| 2,501 - 5,000 | 440 |
| 5,001 - 15,000 | 700 |
| 15,001 - 30,000 | 880 |
| 30,001 - 45,000 | 1,210 |
| 45,001 - 60,000 | 1,500 |
| 60,001 - 125,000 | 1,925 |
| 125,001 - 250,000 | 3,575 |
| 250,001 - 500,000 | 7,000 |
| 500,001 - 1,000,000 | 12,500 |
| 1,000,001 - 2,000,000 | 15,000 |
| 2,000,001 - 3,000,000 | 18,000 |
| 3,000,001 - 4,000,000 | 18,000 |
| 4,000,001 - 5,000,000 | 18,000 |

**Tax Amount:** 0.5% of transaction amount

**Total Cashout Fee = Withdraw from Agent Fee + Tax Amount (0.5%)**

## User Experience

1. **Default State**: When Tanzania is selected, the checkbox appears but is unchecked by default
2. **Checkbox Interaction**: 
   - Shows the calculated cashout fee next to the checkbox label
   - When checked, displays a breakdown showing amount + fee = total
3. **Calculation Update**: 
   - Cashout fees automatically recalculate when the user changes the amount
   - The "You'll pay" section updates to include the total amount (original + fees) converted to crypto
4. **Country Switching**: 
   - Checkbox automatically disappears and resets when switching away from Tanzania
   - Fees are cleared from calculations

## Technical Details

- **State Management**: Uses Zustand store for persistent state management
- **Real-time Calculation**: useEffect hooks ensure fees are calculated in real-time
- **Type Safety**: Full TypeScript support with proper type definitions
- **Testing**: Comprehensive test coverage for fee calculation logic
- **Performance**: Optimized with useMemo for crypto amount calculations
- **UI Components**: Uses existing Shadcn/UI components for consistent design

## Future Enhancements

- Add support for other countries with different fee structures
- Implement dynamic fee fetching from API
- Add fee estimation preview before final confirmation
- Include fee breakdown in transaction receipts
