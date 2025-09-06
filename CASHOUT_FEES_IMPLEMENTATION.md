# Tanzania Cashout Fees Implementation

## Overview
Added an optional checkbox feature that allows users to include cashout fees when sending money to Tanzania. The cashout fees are calculated based on predefined amount ranges specific to Tanzania.

## Files Modified/Created

### 1. `/utils/cashout-fees.ts` (New File)
- Contains the cashout fee calculation logic with all amount ranges and corresponding fees
- Exports `calculateCashoutFee(amount: number)` function to calculate fees based on amount
- Exports `supportsCashoutFees(countryName: string)` function to check if a country supports cashout fees
- Currently only supports Tanzania

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

## Cashout Fee Ranges (Tanzania - TZS)

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
