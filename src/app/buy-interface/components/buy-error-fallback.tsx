import { Button } from "@/src/components/ui/button";
import React from "react";

export function BuyPanelErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-3xl overflow-hidden p-4 sm:p-5 min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        {/* Error Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400 text-sm">
            Unable to load the withdrawal interface. Please try again.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Error Details:</p>
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={resetErrorBoundary}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
