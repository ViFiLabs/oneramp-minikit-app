export default function TransactionLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        {/* Transaction Card Skeleton */}
        <div className="bg-[#181818] rounded-2xl p-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* Status skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
            <div className="h-5 w-24 bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* Amount skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-20 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-8 w-32 bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-600 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action button skeleton */}
          <div className="h-12 w-full bg-gray-600 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
