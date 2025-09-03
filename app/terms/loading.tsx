export default function TermsLoading() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl mx-auto bg-black rounded-2xl overflow-hidden">
        <div className="p-6 pb-4 border-b border-[#333]">
          <div className="h-4 bg-gray-700 rounded w-20 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-700 rounded w-40 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
