"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-[#121212] p-6 sm:p-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-300">
            Temporary service disruption
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-white leading-tight">
          We are still here, but some services are unstable right now
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          Some backend requests are failing at the moment. Your funds are safe.
          Please try again in a few moments while we stabilize connectivity.
        </p>

        <div className="mt-5 rounded-xl border border-[#2f2f2f] bg-[#181818] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            What you can do
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>Retry this screen now</li>
            <li>Return to Home and try another flow</li>
            <li>Check back in a few minutes if this continues</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={reset}
            className="flex-1 bg-white text-black hover:bg-gray-200"
          >
            Retry
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
