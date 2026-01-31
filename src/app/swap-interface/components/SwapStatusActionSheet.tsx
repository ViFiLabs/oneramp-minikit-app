"use client";

import { FiCheck, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";

export type SwapStatus = "processing" | "success" | "error";

interface SwapStatusActionSheetProps {
  status: SwapStatus;
  stepMessage: string;
  errorMessage?: string;
  swapHash?: string;
  fromSymbol?: string;
  toSymbol?: string;
  onClose: () => void;
}

export function SwapStatusActionSheet({
  status,
  stepMessage,
  errorMessage,
  swapHash,
  fromSymbol,
  toSymbol,
  onClose,
}: SwapStatusActionSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    if (status === "processing") return; // Don't allow close while processing
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const canClose = status !== "processing";

  return (
    <>
      {/* Backdrop - dark overlay for consistency */}
      <div
        className={`fixed inset-0 z-55 bg-black/60 md:backdrop-blur-sm transition-opacity duration-300 ${
          canClose ? "cursor-pointer" : "cursor-not-allowed"
        }`}
        onClick={canClose ? handleClose : undefined}
        style={{ position: "fixed", zIndex: 55 }}
      />

      {/* Action sheet from bottom */}
      <div
        className="fixed  inset-0 z-60 flex items-end justify-center pointer-events-none"
        style={{ position: "fixed", zIndex: 60 }}
      >
        <div
          className={`w-full max-w-md h-1/2 overflow-y-auto shadow-2xl transition-transform duration-300 ease-out bg-gray-900 rounded-t-3xl pointer-events-auto ${
            isVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-500 rounded-full" />
          </div>

          {/* Header with Close Button - hidden when processing */}
          <div className="flex justify-end px-4 pb-2">
            {canClose && (
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <FiX size={16} color="#ffffff" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 pb-8 flex flex-col items-center space-y-6">
            {status === "processing" && (
              <>
                <div className="flex justify-center items-center gap-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <p className="text-white text-center text-lg font-medium">
                  {stepMessage}
                </p>
                {fromSymbol && toSymbol && (
                  <p className="text-neutral-400 text-center text-sm">
                    {fromSymbol} → {toSymbol}
                  </p>
                )}
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <FiCheck size={24} color="#ffffff" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white text-lg font-semibold">
                    Transaction Successful!
                  </p>
                  <p className="text-neutral-400 text-sm">
                    Your swap has been completed successfully
                  </p>
                </div>
                {swapHash && (
                  <a
                    href={`https://basescan.org/tx/${swapHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    View on BaseScan
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15,3 21,3 21,9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                  <FiX size={24} color="#ffffff" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-white text-lg font-semibold">Swap Error</p>
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
                <p className="text-neutral-500 text-xs text-center">
                  Close and swipe again to retry
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
