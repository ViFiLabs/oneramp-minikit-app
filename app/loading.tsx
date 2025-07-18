export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-black">
      <div className="h-full min-h-screen">
        <div className="flex flex-col md:grid md:grid-cols-3 h-full min-h-screen">
          {/* Left section - Logo skeleton */}
          <div className="hidden md:flex p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-600 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Mobile header skeleton */}
          <div className="w-full flex justify-between items-center px-4 py-2 h-14 md:hidden">
            <div className="w-20 h-8 bg-gray-600 rounded-full animate-pulse"></div>
            <div className="flex flex-1" />
            <div className="w-24 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
          </div>

          {/* Center section - Main content skeleton */}
          <div className="flex flex-col items-center justify-start w-full pt-6 pb-2 md:pt-16 px-4">
            {/* Hero text skeleton */}
            <div className="text-center mb-8 space-y-4">
              <div className="h-8 w-64 bg-gray-600 rounded animate-pulse mx-auto"></div>
              <div className="h-4 w-96 bg-gray-600 rounded animate-pulse mx-auto"></div>
              <div className="h-4 w-80 bg-gray-600 rounded animate-pulse mx-auto"></div>
            </div>

            {/* Tabs skeleton */}
            <div className="w-full max-w-md mb-6">
              <div className="flex gap-2 p-1 bg-neutral-800 rounded-lg">
                <div className="flex-1 h-10 bg-gray-600 rounded-md animate-pulse"></div>
                <div className="flex-1 h-10 bg-gray-600 rounded-md animate-pulse"></div>
              </div>
            </div>

            {/* Main card skeleton */}
            <div className="w-full max-w-md">
              <div className="bg-[#181818] rounded-2xl p-6 space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-6 w-20 bg-gray-600 rounded animate-pulse"></div>
                </div>

                {/* Country selector skeleton */}
                <div className="space-y-3">
                  <div className="h-12 w-full bg-gray-600 rounded-lg animate-pulse"></div>
                </div>

                {/* Payment type buttons skeleton */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-gray-600 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>

                {/* Payment fields skeleton */}
                <div className="space-y-3">
                  <div className="h-4 w-32 bg-gray-600 rounded animate-pulse"></div>
                  <div className="h-12 w-full bg-gray-600 rounded-lg animate-pulse"></div>
                </div>

                {/* Amount section skeleton */}
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-gray-600 rounded animate-pulse"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="h-px bg-gray-700"></div>
                </div>

                {/* Exchange rate skeleton */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-4 w-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-16 bg-gray-600 rounded animate-pulse"></div>
                    <div className="text-right">
                      <div className="h-6 w-20 bg-gray-600 rounded animate-pulse mb-1"></div>
                      <div className="h-3 w-16 bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="h-3 w-32 bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 w-28 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Swipe button skeleton */}
                <div className="h-16 w-full bg-gray-600 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right section skeleton */}
          <div className="hidden md:flex relative">
            <div className="w-full flex flex-row justify-between py-6 px-4">
              <div className="flex flex-1" />
              <div className="flex flex-1 justify-end">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
