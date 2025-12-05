import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

const PayInterfaceSkeleton = () => {
  return (
    <div className="mx-auto w-full bg-[#181818] text-white rounded-3xl overflow-hidden p-4 sm:p-5 space-y-3 sm:space-y-4 min-h-[400px]">
      {/* Pay Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-12 bg-neutral-700" />
        <Skeleton className="h-6 w-16 bg-neutral-700" />
      </div>

      {/* Country Selection */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-t-2xl rounded-b-lg bg-neutral-800" />
      </div>

      {/* Payment Type Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((item) => (
          <Skeleton
            key={item}
            className="h-12 w-full rounded-lg bg-neutral-800"
          />
        ))}
      </div>

      {/* Dynamic Payment Fields */}
      <div className="min-h-[80px] space-y-3">
        <Skeleton className="h-4 w-32 bg-neutral-700" />
        <Skeleton className="h-12 w-full rounded-lg bg-neutral-800" />
      </div>

      {/* Amount Section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-40 bg-neutral-700" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16 bg-neutral-700" />
          <Skeleton className="h-10 w-32 bg-neutral-700" />
        </div>
        <div className="h-px bg-gray-700"></div>
      </div>

      {/* You'll Pay Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20 bg-neutral-700" />
          <Skeleton className="h-4 w-4 bg-neutral-700 rounded" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20 bg-neutral-700" />
          <div className="text-right space-y-1">
            <Skeleton className="h-7 w-24 bg-neutral-700 ml-auto" />
            <Skeleton className="h-3 w-20 bg-neutral-700 ml-auto" />
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32 bg-neutral-700" />
          <Skeleton className="h-3 w-36 bg-neutral-700" />
        </div>
      </div>

      {/* Fee Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24 bg-neutral-700" />
          <Skeleton className="h-4 w-20 bg-neutral-700" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-neutral-700" />
          <Skeleton className="h-4 w-16 bg-neutral-700" />
        </div>
        <div className="h-px bg-gray-700"></div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 bg-neutral-700" />
          <Skeleton className="h-4 w-24 bg-neutral-700" />
        </div>
      </div>

      {/* Swipe to Pay Button */}
      <Skeleton className="h-14 w-full rounded-full bg-neutral-700" />
    </div>
  );
};

export default PayInterfaceSkeleton;
