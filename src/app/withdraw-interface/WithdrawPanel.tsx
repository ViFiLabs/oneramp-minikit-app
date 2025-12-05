"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { WithdrawPanelErrorFallback } from "./components/withdraw-error-fallback";
import WithdrawInterfaceSkeleton from "./components/withdraw-interface-skeleton";
import { WithdrawInterface } from "./withdraw-interface";

export function WithdrawPanel() {
  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      <ErrorBoundary FallbackComponent={WithdrawPanelErrorFallback}>
        <Suspense fallback={<WithdrawInterfaceSkeleton />}>
          <WithdrawInterface />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Swipe to buy button
