import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import React from "react";

export function WithdrawPanelErrorFallback({
  error: _error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-3xl overflow-hidden p-4 sm:p-5 min-h-[400px] space-y-4">
      <div className="space-y-3">
        <div className="h-12 rounded-xl bg-neutral-800/80 border border-neutral-700 px-4 flex items-center text-neutral-500">
          Select Country
        </div>
        <div className="h-12 rounded-xl bg-neutral-800/80 border border-neutral-700 px-4 flex items-center text-neutral-500">
          Select Asset
        </div>
        <Input
          disabled
          value=""
          placeholder="Enter amount"
          className="bg-neutral-800 border-neutral-700 text-neutral-500"
        />
      </div>

      <Button
        disabled
        className="w-full bg-neutral-700 text-neutral-400 cursor-not-allowed"
      >
        Withdraw (Temporarily Disabled)
      </Button>

      <Button
        onClick={resetErrorBoundary}
        variant="outline"
        className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
      >
        Retry
      </Button>
    </div>
  );
}
