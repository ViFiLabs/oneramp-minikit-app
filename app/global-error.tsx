"use client";

import { Button } from "@/app/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-4">
            {/* Critical Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-red-500"
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

            {/* Critical Error Message */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white">Critical Error</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Something went wrong with the application. This is a critical
                error that prevents the app from loading properly.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">
                    Error Details (Development):
                  </p>
                  <p className="text-xs text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  onClick={reset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Reload Page
                </Button>
              </div>

              {/* Support Info */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact our support team or
                  try clearing your browser cache.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
