import { cn } from "@/src/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-gray-600", className)}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Predefined skeleton components for common use cases
export function ExchangeRateSkeleton() {
  return (
    <div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function CryptoAmountSkeleton() {
  return (
    <div className="text-right">
      <Skeleton className="h-6 w-20 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// Additional skeleton components for other use cases
export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function ButtonSkeleton() {
  return <Skeleton className="h-12 w-full" />;
}

export function InputSkeleton() {
  return <Skeleton className="h-12 w-full" />;
}
