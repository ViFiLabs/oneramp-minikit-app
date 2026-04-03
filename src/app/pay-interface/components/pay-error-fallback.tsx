export function PayPanelErrorFallback({
  error: _error,
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
      </div>
    </div>
  );
}
