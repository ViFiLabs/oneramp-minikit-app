# Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Folder Organization Philosophy](#folder-organization-philosophy)
4. [Global Components](#global-components)
5. [Tab-Specific Architecture](#tab-specific-architecture)
6. [Data Access Layer (tRPC)](#data-access-layer-trpc)
7. [React Suspense & Error Boundaries](#react-suspense--error-boundaries)
8. [Benefits & Rationale](#benefits--rationale)
9. [Development Patterns](#development-patterns)
10. [Examples](#examples)

---

## Overview

This project follows a **feature-based, centralized architecture** that prioritizes maintainability, developer experience, and scalability. The architecture is built on three core principles:

1. **Centralized Feature Management**: Each major feature (tab/screen) is self-contained with all its logic, components, and hooks in a single folder
2. **Shared Component Library**: Global, reusable components are separated from feature-specific components
3. **Type-Safe Data Layer**: tRPC provides end-to-end type safety between client and server, integrated with TanStack Query for optimal data fetching

---

## Project Structure

```
src/
├── app/                          # Next.js App Router directory
│   ├── buy-interface/           # Buy/Deposit feature
│   │   ├── buy-interface.tsx    # Main component
│   │   ├── BuyPanel.tsx         # Panel wrapper with Suspense/ErrorBoundary
│   │   ├── components/          # Feature-specific components
│   │   │   ├── buy-error-fallback.tsx
│   │   │   └── buy-interface-skeleton.tsx
│   │   └── hooks/               # Feature-specific hooks
│   │       └── use-buy-suspense.tsx
│   ├── pay-interface/           # Pay feature
│   │   ├── pay-interface.tsx
│   │   ├── PayPanel.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── schemas/            # Form validation schemas
│   ├── withdraw-interface/      # Withdraw feature
│   │   ├── withdraw-interface.tsx
│   │   ├── WithdrawPanel.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── cNGN/               # Nested feature (cNGN withdrawals)
│   ├── swap-interface/          # Swap feature
│   ├── transactions/           # Transaction history feature
│   ├── providers/               # Global providers
│   └── api/                     # API routes
│       └── trpc/                # tRPC endpoint
├── components/                  # Global shared components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── buttons/                 # App-specific button variants
│   ├── inputs/                  # App-specific input components
│   ├── modals/                  # Reusable modals
│   ├── cards/                   # Reusable card components
│   └── ...
├── trpc/                        # tRPC configuration
│   ├── client.tsx               # Client-side tRPC setup
│   ├── server.tsx               # Server-side tRPC setup
│   ├── init.ts                  # tRPC initialization
│   ├── routers/                 # tRPC routers
│   └── query-client.ts         # TanStack Query client
├── hooks/                       # Global hooks (shared across features)
├── store/                       # Zustand stores
├── utils/                       # Utility functions
└── lib/                         # Library code
```

---

## Folder Organization Philosophy

### Why This Structure?

The architecture is designed around the principle that **developers working on a feature should rarely need to leave that feature's folder**. This provides several key advantages:

1. **Reduced Cognitive Load**: All related code is in one place
2. **Easier Code Reviews**: Changes are localized to specific folders
3. **Better Team Collaboration**: Multiple developers can work on different features without conflicts
4. **Simplified Testing**: Feature-specific tests can be co-located with the feature
5. **Improved Onboarding**: New developers can understand one feature at a time

### The `/app` Folder

Everything lives under `/app` because we're using **Next.js App Router**. This provides:

- **File-based routing**: Routes are defined by the folder structure
- **Server Components by default**: Better performance and SEO
- **Built-in layouts**: Shared layouts without prop drilling
- **Streaming & Suspense**: Native support for React Suspense boundaries

### Global vs. Feature-Specific Components

**Global Components** (`/src/components/`):
- Used across multiple features
- Examples: `Button`, `Input`, `Select`, `Modal`, `Card`
- Should be generic and reusable
- Located in `/src/components/ui/` (base components) or `/src/components/` (app-specific variants)

**Feature-Specific Components** (`/src/app/{feature}/components/`):
- Only used within that feature
- Examples: `SwipeToPayButton`, `BuyInterfaceSkeleton`, `WithdrawErrorFallback`
- Can be tightly coupled to the feature's logic
- Should NOT be imported by other features

---

## Global Components

### Base UI Components (`/src/components/ui/`)

These are the foundational components built on top of [shadcn/ui](https://ui.shadcn.com/). They provide:

- **Consistent styling**: All components follow the same design system
- **Accessibility**: Built with accessibility in mind (ARIA attributes, keyboard navigation)
- **Type safety**: Fully typed with TypeScript
- **Customization**: Easy to customize via CSS variables and Tailwind classes

**Examples:**
- `button.tsx` - Base button component with variants
- `input.tsx` - Form input component
- `select.tsx` - Dropdown select component
- `dialog.tsx` - Modal/dialog component
- `card.tsx` - Card container component

### App-Specific Global Components

These components are used across multiple features but are specific to our application:

- `/src/components/buttons/` - Custom button variants (e.g., `SwapButton`, `SubmitButton`)
- `/src/components/inputs/` - Custom input components (e.g., `BuyValueInput`, `CurrencyValueInput`)
- `/src/components/modals/` - Reusable modals (e.g., `CountryCurrencyModal`, `KYCVerificationModal`)
- `/src/components/cards/` - Status cards (e.g., `OrderProcessingCard`, `SuccessCard`)

### When to Create a Global Component

Create a global component when:
- ✅ It's used in 2+ features
- ✅ It represents a common UI pattern
- ✅ It needs to be consistent across the app

Keep it feature-specific when:
- ❌ It's only used in one feature
- ❌ It's tightly coupled to feature-specific logic
- ❌ It's unlikely to be reused

---

## Tab-Specific Architecture

Each tab/feature follows a consistent structure:

```
{feature}-interface/
├── {feature}-interface.tsx      # Main component (client component)
├── {Feature}Panel.tsx           # Panel wrapper with Suspense/ErrorBoundary
├── components/                  # Feature-specific components
│   ├── {feature}-error-fallback.tsx
│   └── {feature}-interface-skeleton.tsx
├── hooks/                       # Feature-specific hooks
│   └── use-{feature}-suspense.tsx
└── schemas/                     # Form validation schemas (if applicable)
```

### Example: Buy Interface

```
buy-interface/
├── buy-interface.tsx           # Main buy logic and UI
├── BuyPanel.tsx                # Wraps BuyInterface with Suspense/ErrorBoundary
├── components/
│   ├── buy-error-fallback.tsx  # Error boundary fallback UI
│   └── buy-interface-skeleton.tsx  # Loading skeleton
└── hooks/
    └── use-buy-suspense.tsx    # Suspense-enabled data fetching hooks
```

### Benefits of This Structure

1. **Self-Contained Features**: Everything related to a feature is in one place
2. **Isolated Testing**: Easy to test features in isolation
3. **Clear Boundaries**: Easy to identify what belongs to which feature
4. **Simplified Refactoring**: Changes to one feature don't affect others
5. **Better Code Splitting**: Features can be lazy-loaded independently

---

## Data Access Layer (tRPC)

### Why tRPC?

We use **tRPC** instead of raw Next.js Server Components for data fetching because:

1. **End-to-End Type Safety**: Types are shared between client and server
2. **No API Contracts**: No need to manually maintain API types
3. **Great DX**: Autocomplete and type checking in your IDE
4. **TanStack Query Integration**: Built-in caching, refetching, and optimistic updates
5. **Suspense Support**: Native support for React Suspense

### Architecture

```
trpc/
├── client.tsx          # Client-side tRPC setup with React Query
├── server.tsx          # Server-side tRPC setup
├── init.ts             # tRPC initialization and context
├── routers/            # tRPC routers (API endpoints)
│   └── _app.ts         # Main router combining all sub-routers
└── query-client.ts     # TanStack Query client configuration
```

### How It Works

1. **Server-Side** (`/src/trpc/server.tsx`):
   - Defines the tRPC router with all available procedures
   - Creates a context for each request
   - Exports a `caller` for server-side usage

2. **Client-Side** (`/src/trpc/client.tsx`):
   - Sets up the tRPC client with HTTP batch link
   - Integrates with TanStack Query
   - Provides `useTRPC()` hook for components

3. **API Route** (`/src/app/api/trpc/[trpc]/route.ts`):
   - Next.js API route that handles tRPC requests
   - Connects client and server

### Usage Pattern

**In a Feature Hook** (`/src/app/buy-interface/hooks/use-buy-suspense.tsx`):

```typescript
import { useTRPC } from "@/src/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const useBuyRatesSuspense = ({
  orderType,
  providerType,
}: {
  orderType: "selling" | "buying";
  providerType: "momo" | "bank";
}) => {
  const trpc = useTRPC();
  return useSuspenseQuery(
    trpc.getAllCountriesExchangeRates.queryOptions(
      {
        orderType,
        providerType,
      },
      {
        staleTime: 90 * 1000, // Cache for 90 seconds
        refetchInterval: 90 * 1000, // Auto-refetch every 90 seconds
      }
    )
  );
};
```

**In a Component** (`/src/app/buy-interface/buy-interface.tsx`):

```typescript
// Fetch data using the suspense hook
const { data: exchangeRates } = useBuyRatesSuspense({
  orderType: "buying",
  providerType: currentPaymentMethod,
});
```

### Advantages Over Server Components

| Feature | tRPC + TanStack Query | Next.js Server Components |
|---------|----------------------|---------------------------|
| Type Safety | ✅ End-to-end | ❌ Manual types |
| Caching | ✅ Automatic (TanStack Query) | ⚠️ Manual (unstable_cache) |
| Refetching | ✅ Built-in | ❌ Manual |
| Optimistic Updates | ✅ Built-in | ❌ Not supported |
| Suspense | ✅ Native support | ✅ Native support |
| Error Handling | ✅ Built-in | ⚠️ Manual |
| Dev Experience | ✅ Excellent | ⚠️ Good |

---

## React Suspense & Error Boundaries

### Why Suspense?

React Suspense allows us to:
- **Show loading states** while data is being fetched
- **Stream content** as it becomes available
- **Improve perceived performance** with better UX
- **Simplify data fetching** code

### Why Error Boundaries?

Error Boundaries allow us to:
- **Catch errors** in component trees
- **Show fallback UI** instead of crashing
- **Isolate errors** to specific features
- **Provide recovery options** to users

### Implementation Pattern

Each feature panel follows this pattern:

```typescript
// BuyPanel.tsx
"use client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BuyPanelErrorFallback } from "./components/buy-error-fallback";
import BuyInterfaceSkeleton from "./components/buy-interface-skeleton";
import { BuyInterface } from "./buy-interface";

export function BuyPanel() {
  return (
    <div className="...">
      <ErrorBoundary FallbackComponent={BuyPanelErrorFallback}>
        <Suspense fallback={<BuyInterfaceSkeleton />}>
          <BuyInterface />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

### How It Works

1. **Suspense Boundary**: When `BuyInterface` uses `useSuspenseQuery`, React suspends and shows the fallback (`BuyInterfaceSkeleton`)
2. **Error Boundary**: If an error occurs, React catches it and shows `BuyPanelErrorFallback`
3. **Isolation**: Errors in one feature don't crash the entire app

### Benefits

1. **Feature Isolation**: Each feature has its own error boundary
2. **Better UX**: Users see loading states and error recovery options
3. **Developer Experience**: Clear separation of concerns
4. **Maintainability**: Easy to add/remove features without affecting others

---

## Benefits & Rationale

### 1. Centralized Feature Management

**Problem**: In traditional architectures, code for a feature is scattered across:
- `/components/` (UI components)
- `/hooks/` (custom hooks)
- `/utils/` (utility functions)
- `/api/` (API calls)
- `/types/` (TypeScript types)

**Solution**: All feature code lives in one folder:
```
buy-interface/
├── buy-interface.tsx      # Main component
├── components/            # Feature components
├── hooks/                 # Feature hooks
└── schemas/              # Feature schemas
```

**Benefits**:
- ✅ Easy to find related code
- ✅ Clear ownership of features
- ✅ Simplified code reviews
- ✅ Better team collaboration

### 2. Works Amazingly with Suspense & Error Boundaries

**Problem**: In traditional architectures, Suspense and Error Boundaries are hard to implement because:
- Components are scattered
- Data fetching is mixed with UI
- Error handling is inconsistent

**Solution**: Each feature has its own Suspense/Error Boundary:
```typescript
<ErrorBoundary FallbackComponent={FeatureErrorFallback}>
  <Suspense fallback={<FeatureSkeleton />}>
    <FeatureComponent />
  </Suspense>
</ErrorBoundary>
```

**Benefits**:
- ✅ Isolated error handling
- ✅ Feature-specific loading states
- ✅ Better user experience
- ✅ Easier debugging

### 3. Type-Safe Data Layer

**Problem**: Traditional REST APIs require:
- Manual type definitions
- API contract maintenance
- Runtime type checking
- No autocomplete

**Solution**: tRPC provides:
- End-to-end type safety
- Automatic type inference
- IDE autocomplete
- Compile-time error checking

**Benefits**:
- ✅ Fewer bugs
- ✅ Better developer experience
- ✅ Faster development
- ✅ Easier refactoring

### 4. Scalability

**Problem**: As the app grows, traditional architectures become:
- Hard to navigate
- Prone to merge conflicts
- Difficult to test
- Slow to build

**Solution**: Feature-based architecture:
- Features are independent
- Easy to add new features
- Minimal coupling between features
- Better code splitting

**Benefits**:
- ✅ Scales with team size
- ✅ Faster builds (code splitting)
- ✅ Easier testing
- ✅ Better performance

---

## Development Patterns

### Adding a New Feature

1. **Create the feature folder**:
   ```
   src/app/new-feature/
   ├── new-feature.tsx
   ├── NewFeaturePanel.tsx
   ├── components/
   │   ├── new-feature-error-fallback.tsx
   │   └── new-feature-skeleton.tsx
   └── hooks/
       └── use-new-feature-suspense.tsx
   ```

2. **Create the panel wrapper**:
   ```typescript
   // NewFeaturePanel.tsx
   "use client";
   import { Suspense } from "react";
   import { ErrorBoundary } from "react-error-boundary";
   import { NewFeatureErrorFallback } from "./components/new-feature-error-fallback";
   import NewFeatureSkeleton from "./components/new-feature-skeleton";
   import { NewFeature } from "./new-feature";

   export function NewFeaturePanel() {
     return (
       <div className="...">
         <ErrorBoundary FallbackComponent={NewFeatureErrorFallback}>
           <Suspense fallback={<NewFeatureSkeleton />}>
             <NewFeature />
           </Suspense>
         </ErrorBoundary>
       </div>
     );
   }
   ```

3. **Create suspense hooks**:
   ```typescript
   // hooks/use-new-feature-suspense.tsx
   import { useTRPC } from "@/src/trpc/client";
   import { useSuspenseQuery } from "@tanstack/react-query";

   export const useNewFeatureDataSuspense = () => {
     const trpc = useTRPC();
     return useSuspenseQuery(
       trpc.getNewFeatureData.queryOptions()
     );
   };
   ```

4. **Use in the main component**:
   ```typescript
   // new-feature.tsx
   "use client";
   import { useNewFeatureDataSuspense } from "./hooks/use-new-feature-suspense";

   export function NewFeature() {
     const { data } = useNewFeatureDataSuspense();
     // ... rest of component
   }
   ```

### Creating a Global Component

1. **Determine if it should be global**:
   - Used in 2+ features? → Global
   - Only used in one feature? → Feature-specific

2. **If global, place in `/src/components/`**:
   ```
   src/components/
   ├── ui/              # Base components (shadcn/ui)
   ├── buttons/         # Button variants
   ├── inputs/          # Input variants
   └── modals/          # Modal components
   ```

3. **Export from the component file**:
   ```typescript
   // src/components/buttons/CustomButton.tsx
   export function CustomButton({ ... }) {
     // ...
   }
   ```

### Adding a tRPC Endpoint

1. **Add to the router** (`/src/trpc/routers/_app.ts`):
   ```typescript
   export const appRouter = createTRPCRouter({
     // ... existing routes
     getNewFeatureData: baseProcedure
       .input(z.object({ id: z.string() }))
       .query(async ({ input }) => {
         // Fetch data
         return data;
       }),
   });
   ```

2. **Use in a feature hook**:
   ```typescript
   export const useNewFeatureDataSuspense = (id: string) => {
     const trpc = useTRPC();
     return useSuspenseQuery(
       trpc.getNewFeatureData.queryOptions({ id })
     );
   };
   ```

---

## Examples

### Example 1: Buy Interface

**Structure**:
```
buy-interface/
├── buy-interface.tsx           # Main component (500+ lines)
├── BuyPanel.tsx               # Wrapper with Suspense/ErrorBoundary
├── components/
│   ├── buy-error-fallback.tsx  # Error UI
│   └── buy-interface-skeleton.tsx  # Loading UI
└── hooks/
    └── use-buy-suspense.tsx   # Data fetching hooks
```

**Key Features**:
- Uses `useBuyRatesSuspense` for exchange rates
- Uses `useBuyInstitutionsSuspense` for institutions
- All logic contained in `buy-interface.tsx`
- Error handling isolated to the feature

### Example 2: Pay Interface

**Structure**:
```
pay-interface/
├── pay-interface.tsx
├── PayPanel.tsx
├── components/
│   ├── pay-error-fallback.tsx
│   ├── pay-interface-skeleton.tsx
│   └── swipe-to-pay.tsx       # Feature-specific component
├── hooks/
│   └── use-payinterface-suspense.tsx
└── schemas/
    └── payment-form.schema.ts  # Form validation
```

**Key Features**:
- Form validation with Zod schemas
- Feature-specific `SwipeToPayButton` component
- Suspense-enabled data fetching
- Isolated error handling

### Example 3: Withdraw Interface with Nested Feature

**Structure**:
```
withdraw-interface/
├── withdraw-interface.tsx
├── WithdrawPanel.tsx
├── components/
│   ├── withdraw-error-fallback.tsx
│   └── withdraw-interface-skeleton.tsx
├── hooks/
│   └── use-withdraw-suspense.tsx
└── cNGN/                      # Nested feature
    ├── CNGNWithdrawPanel.tsx
    ├── CNGNSwapTocNGNPanel.tsx
    ├── CNGNSwapToUSDCPanel.tsx
    └── utils.ts
```

**Key Features**:
- Main withdraw interface
- Nested cNGN feature with its own components
- Shared hooks for data fetching
- Clear separation of concerns

---

## Best Practices

### ✅ Do

- **Keep features self-contained**: All feature code should be in the feature folder
- **Use Suspense hooks**: Always use `useSuspenseQuery` for data fetching
- **Wrap features with Error Boundaries**: Every feature panel should have an ErrorBoundary
- **Create feature-specific components**: If a component is only used in one feature, keep it there
- **Use tRPC for all data fetching**: Avoid direct API calls, use tRPC procedures
- **Type everything**: Use TypeScript for all code

### ❌ Don't

- **Don't import feature components in other features**: Use global components instead
- **Don't mix feature logic**: Keep each feature's logic isolated
- **Don't skip Error Boundaries**: Always wrap features with ErrorBoundary
- **Don't use regular queries**: Use `useSuspenseQuery` for better UX
- **Don't create global components prematurely**: Only make components global when they're reused

---

## Conclusion

This architecture provides:

1. **Better Developer Experience**: Easy to find and modify code
2. **Improved Maintainability**: Clear structure and boundaries
3. **Type Safety**: End-to-end type safety with tRPC
4. **Better UX**: Suspense and Error Boundaries for better loading/error states
5. **Scalability**: Architecture that grows with your team

When working on a feature, you should rarely need to leave that feature's folder. This makes development faster, easier, and more enjoyable.
