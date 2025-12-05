import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

const WithdrawInterfaceSkeleton = () => {
  return (
    <div className="w-full max-w-md mx-auto min-h-[400px] bg-[#181818] rounded-3xl p-0 flex flex-col gap-0 md:shadow-lg md:border border-[#232323] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4">
        <Skeleton className="h-6 w-20 bg-neutral-700" />
        <Skeleton className="h-6 w-16 bg-neutral-700" />
      </div>

      {/* From Panel */}
      <div className="mx-3 md:mx-4 my-1 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-12 bg-neutral-700" />
        <Skeleton className="h-4 w-32 bg-neutral-700" />
      </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Skeleton className="h-10 w-28 md:w-32 rounded-full bg-neutral-800" />
          <Skeleton className="h-10 flex-1 bg-transparent" />
        </div>
      </div>

      {/* Swap Arrow */}
      <div className="flex items-center justify-center my-1">
        <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
        </div>

      {/* To Panel */}
      <div className="mx-3 md:mx-4 my-1 bg-[#232323] rounded-2xl p-4 md:p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-8 bg-neutral-700" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 flex-1 rounded-t-[2rem] bg-neutral-800" />
        </div>
      </div>

      {/* Exchange Rate Component */}
      <div className="mx-4 md:mx-10 mb-4 flex justify-between">
        <Skeleton className="h-4 w-40 bg-neutral-700" />
        <Skeleton className="h-4 w-36 bg-neutral-700 hidden md:block" />
        </div>

      {/* Institution Selector */}
      <div className="px-3 md:px-4">
        <Skeleton className="h-12 w-full rounded-lg bg-neutral-800" />
      </div>

      {/* Swipe to Withdraw Button */}
      <div className="px-3 md:px-4 mt-4">
      <Skeleton className="h-14 w-full rounded-full bg-neutral-700" />
      </div>
    </div>
  );
};

export default WithdrawInterfaceSkeleton;
