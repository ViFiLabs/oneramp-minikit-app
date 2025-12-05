"use client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BuyPanelErrorFallback } from "./components/buy-error-fallback";
import BuyInterfaceSkeleton from "./components/buy-interface-skeleton";
import { BuyInterface } from "./buy-interface";

// Country-specific institution lists

export function BuyPanel() {
  return (
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-3xl min-h-[400px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 border !border-[#232323]">
      <ErrorBoundary FallbackComponent={BuyPanelErrorFallback}>
        <Suspense fallback={<BuyInterfaceSkeleton />}>
          <BuyInterface />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
