# Testing Guide

This project uses Jest for unit testing. The test files are located in the `__tests__` directory.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (useful during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

### Current Tests
- `__tests__/cashout-fees.test.ts` - Tests for the Tanzania and Uganda cashout fee calculation logic

### What's Tested
- **Tanzania cashout fees**: All 24 amount ranges with fixed fees
- **Uganda cashout fees**: Withdraw from Agent fees + 0.5% tax calculation
- **Country support**: Validation that only Tanzania and Uganda support cashout fees
- **Edge cases**: Boundary conditions and error scenarios
- **Breakdown functionality**: Detailed fee breakdown for Uganda

## Test Coverage

The tests provide comprehensive coverage for the cashout fees utility functions:
- `calculateCashoutFee()` - Tests both Tanzania and Uganda fee calculations
- `getUgandaCashoutBreakdown()` - Tests detailed Uganda fee breakdown
- `supportsCashoutFees()` - Tests country support validation

## Adding New Tests

1. Create test files in the `__tests__` directory with `.test.ts` or `.test.tsx` extension
2. Import the functions you want to test
3. Write test cases using Jest's `describe`, `it`, and `expect` functions
4. Run `npm test` to execute your tests

## Configuration

- **Jest Configuration**: `jest.config.js`
- **Setup File**: `jest.setup.js`
- **TypeScript Support**: Configured in `tsconfig.json` with `"jest"` in types array

## Environment Variables for Tests

Jest is wired up through `next/jest`, which automatically loads Next.js env
files when `NODE_ENV=test`. The load order is:

1. `.env.test.local` — your personal test secrets, gitignored
2. `.env.test` — committed test defaults (if any)
3. `.env` — committed shared defaults

`.env.local` is intentionally **not** loaded in test mode, so anything a test
needs must live in one of the files above.

To set up test-only variables, copy the template:

```bash
cp .env.test.example .env.test.local
```

Then fill in the values. `.env.test.example` lists every variable a test
reads and describes what it's for.

### On-chain integration tests

`__tests__/onchain-swaps.test.js` signs real transactions against Base
mainnet and requires `PRIVATE_KEY` to be set in `.env.test.local`. Use a
disposable test wallet — never a key that holds real funds or is shared with
any other environment.
