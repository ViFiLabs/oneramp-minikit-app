import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

const BuyInterfaceSkeleton = () => {
  return (
    <div className="w-full max-w-md mx-auto bg-[#181818] rounded-3xl min-h-[400px] p-4 md:p-6 flex flex-col gap-3 md:gap-4 border !border-[#232323]">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <Skeleton className="h-5 md:h-6 w-24 md:w-32 bg-neutral-700" />
        <Skeleton className="h-8 w-24 md:w-32 rounded-lg bg-neutral-800" />
      </div>

      {/* Buy Value Input Section */}
      <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
        {/* BuyValueInput - centered */}
        <div className="w-full flex items-center justify-center">
          <div className="w-full max-w-[280px] md:max-w-[300px] flex justify-center">
            <Skeleton className="h-16 w-full rounded-lg bg-neutral-800" />
        </div>
      </div>

        {/* Token Selection Button */}
        <Skeleton className="h-10 w-48 md:w-56 rounded-full bg-neutral-700" />

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 md:gap-4 mt-1 md:mt-2">
          <Skeleton className="h-9 md:h-10 w-16 md:w-20 rounded-full bg-neutral-800" />
          <Skeleton className="h-9 md:h-10 w-16 md:w-20 rounded-full bg-neutral-800" />
          <Skeleton className="h-9 md:h-10 w-16 md:w-20 rounded-full bg-neutral-800" />
        </div>
      </div>

      {/* Exchange Rate Component */}
      <div className="mx-4 md:mx-10 mb-2 flex justify-between">
        <Skeleton className="h-4 w-40 bg-neutral-700" />
        <Skeleton className="h-4 w-36 bg-neutral-700 hidden md:block" />
      </div>

      {/* Institution Selector */}
      <div className="px-0">
        <Skeleton className="h-12 w-full rounded-lg bg-neutral-800" />
      </div>

      {/* Swipe to Buy Button */}
      <div className="mt-4">
        <Skeleton className="h-14 w-full rounded-full bg-neutral-700" />
      </div>
    </div>
  );
};

export default BuyInterfaceSkeleton;
