"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TransactionReviewModal } from "@/src/components/modals/TransactionReviewModal";
import { PaymentInterface } from "@/src/app/pay-interface/pay-interface";
import PayInterfaceSkeleton from "@/src/app/pay-interface/components/pay-interface-skeleton";
import { PayPanelErrorFallback } from "./components/pay-error-fallback";

export function PayPanel() {
  return (
    <div className="w-full max-w-md mx-auto mt-0 min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      <ErrorBoundary FallbackComponent={PayPanelErrorFallback}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <PayInterfaceSkeleton />
            </div>
          }
        >
          <PaymentInterface />
        </Suspense>
      </ErrorBoundary>

      {/* Transaction Review Modal */}
      <TransactionReviewModal />
    </div>
  );
}
